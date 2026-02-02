package com.verf.ProdExp.mapper;

import com.verf.ProdExp.dto.ProductRequest;
import com.verf.ProdExp.dto.ProductResponse;
import com.verf.ProdExp.entity.Product;
import com.verf.ProdExp.entity.Status;
import com.verf.ProdExp.entity.NotificationFrequency;
import com.verf.ProdExp.util.NotificationFrequencyCalculator;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class ProductMapper {

    public static Product toEntity(ProductRequest req) {
        NotificationFrequency freq = NotificationFrequencyCalculator.calculate(
                req.purchaseDate(), req.expirationDate(), req.quantityBought(), req.quantityConsumed()
        );

        String nameLower = req.name() == null ? null : req.name().toLowerCase().trim();
        List<String> tokens = nameLower == null ? null : tokenizeName(nameLower);

        return Product.builder()
                .id(null)
                .userId(req.userId())
                .name(req.name())
                .nameLower(nameLower)
                .nameTokens(tokens)
                .quantityBought(req.quantityBought())
                .quantityConsumed(req.quantityConsumed())
                .unit(req.unit())
                .purchaseDate(req.purchaseDate())
                .expirationDate(req.expirationDate())
                .notificationFrequency(freq)
                .tags(req.tags() == null || req.tags().isEmpty() ? null : List.copyOf(req.tags()))
                .createdAt(null)
                .updatedAt(null)
                .build();
    }

    public static ProductResponse toResponse(Product p) {

        return new ProductResponse(
                p.getId(),
                p.getUserId(),
                p.getName(),
                p.getQuantityBought(),
                p.getQuantityConsumed(),
                p.getUnit(),
                p.getPurchaseDate(),
                p.getExpirationDate(),
                p.getCreatedAt(),
                p.getUpdatedAt(),
                p.getStatus(),
                p.getNotificationFrequency() == null ? NotificationFrequency.MONTHLY : p.getNotificationFrequency(),
                p.getTags() == null || p.getTags().isEmpty() ? List.of() : List.copyOf(p.getTags())
        );
    }

    public static Status computeStatus(Product p) {
        // Entity enforces non-null for numeric fields and expirationDate, so compare directly
        double bought = p.getQuantityBought();
        double consumed = p.getQuantityConsumed();
        boolean finished = bought > 0.0 && Double.compare(consumed, bought) >= 0;
        boolean expired = p.getExpirationDate().isBefore(LocalDate.now()) || p.getExpirationDate().isEqual(LocalDate.now());

        if (finished) return Status.FINISHED;
        else if (expired) return Status.EXPIRED;
        return Status.AVAILABLE;
    }

    private static List<String> tokenizeName(String lower) {
        // split on non-word characters, keep tokens length >= 1, dedupe preserving order
        String[] parts = lower.split("\\W+");
        Set<String> set = new LinkedHashSet<>();
        for (String p : parts) {
            if (p == null) continue;
            String t = p.trim();
            if (t.isEmpty()) continue;
            set.add(t);
        }
        return set.stream().collect(Collectors.toList());
    }
}
