package com.verf.ProdExp.service.impl;

import com.verf.ProdExp.config.NotificationProperties;
import com.verf.ProdExp.entity.Product;
import com.verf.ProdExp.entity.Status;
import com.verf.ProdExp.entity.User;
import com.verf.ProdExp.mapper.ProductMapper;
import com.verf.ProdExp.repository.ProductRepository;
import com.verf.ProdExp.repository.UserRepository;
import com.verf.ProdExp.service.MailService;
import com.verf.ProdExp.service.NotificationSchedulePolicy;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NotificationSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(NotificationSchedulerService.class);

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final MailService mailService;
    private final NotificationSchedulePolicy notificationSchedulePolicy;
    private final NotificationProperties notificationProperties;

    @Scheduled(cron = "${app.notifications.cron:0 * * * * *}", zone = "${app.notifications.timezone:UTC}")
    public void processNotificationTick() {
        System.out.println("running notification scheduler tick");
        if (!notificationProperties.isEnabled()) {
            log.debug("Notification scheduler is disabled.");
            return;
        }

        Instant now = Instant.now();
        int batchSize = Math.max(1, notificationProperties.getBatchSize());
        Map<String, List<Product>> dueByUserId = new HashMap<>();

        int pageNumber = 0;
        while (true) {
            PageRequest pageable = PageRequest.of(
                    pageNumber,
                    batchSize,
                    Sort.by(Sort.Order.asc("userId"), Sort.Order.asc("id"))
            );
            Page<Product> page = productRepository.findActiveCandidatesForNotifications(pageable);
            if (page.isEmpty()) {
                break;
            }

            List<Product> changed = new ArrayList<>();
            for (Product product : page.getContent()) {
                boolean mutated = false;

                Status computedStatus = ProductMapper.computeStatus(product);
                if (product.getStatus() != computedStatus) {
                    product.setStatus(computedStatus);
                    mutated = true;
                }

                mutated |= notificationSchedulePolicy.refreshForScheduler(product, now);

                if (product.getStatus() == Status.AVAILABLE
                        && product.getNextNotificationAt() != null
                        && !product.getNextNotificationAt().isAfter(now)) {
                    dueByUserId.computeIfAbsent(product.getUserId(), ignored -> new ArrayList<>()).add(product);
                }

                if (mutated) {
                    changed.add(product);
                }
            }

            if (!changed.isEmpty()) {
                productRepository.saveAll(changed);
            }

            if (!page.hasNext()) {
                break;
            }
            pageNumber++;
        }

        if (dueByUserId.isEmpty()) {
            return;
        }

        List<Product> sentProducts = new ArrayList<>();
        for (Map.Entry<String, List<Product>> entry : dueByUserId.entrySet()) {
            String userId = entry.getKey();
            List<Product> dueProducts = entry.getValue();

            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                log.warn("Skipping notification digest because user was not found: userId={}", userId);
                continue;
            }

            User user = userOpt.get();
            if (!user.isEnabled() || !user.isEmailVerified()) {
                log.debug("Skipping notification digest for ineligible user: userId={} enabled={} verified={}",
                        userId, user.isEnabled(), user.isEmailVerified());
                continue;
            }

            try {
                mailService.sendProductReminderDigest(user, dueProducts, notificationSchedulePolicy.zoneId());
                for (Product product : dueProducts) {
                    product.setLastNotificationSentAt(now);
                    product.setNextNotificationAt(
                            notificationSchedulePolicy.computeNextNotificationAt(product.getNotificationFrequency(), now)
                    );
                    sentProducts.add(product);
                }
            } catch (Exception ex) {
                // Keep due timestamps unchanged; scheduler will retry on next run.
                log.error("Failed to send reminder digest for userId={} dueCount={}", userId, dueProducts.size(), ex);
            }
        }

        if (!sentProducts.isEmpty()) {
            productRepository.saveAll(sentProducts);
        }
    }
}
