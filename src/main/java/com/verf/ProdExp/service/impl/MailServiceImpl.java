// java
package com.verf.ProdExp.service.impl;

import com.verf.ProdExp.entity.NotificationFrequency;
import com.verf.ProdExp.entity.Product;
import com.verf.ProdExp.entity.User;
import com.verf.ProdExp.service.MailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MailServiceImpl implements MailService {

    private final JavaMailSender mailSender;

    // Backend base URL (where /api/auth/verify-email is hosted)
    @Value("${app.backendBaseUrl:http://localhost:8080}")
    private String backendBaseUrl;

    @Value("${mail.from:noreply@example.com}")
    private String fromAddress;

    @Override
    public void sendVerificationEmail(User user, String rawToken) {

        String link = backendBaseUrl + "/api/auth/verify-email?token=" + rawToken;

        try {
            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(user.getEmail());
            helper.setFrom(fromAddress);
            helper.setSubject("Verify your email");

            String html = """
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Hi %s 👋</h2>

                <p>Welcome to <strong>Verfalarm</strong>!</p>

                <p>Please verify your email by clicking the button below:</p>

                <p style="margin: 24px 0;">
                    <a href="%s"
                       style="
                           background-color: #16a34a;
                           color: #ffffff;
                           padding: 12px 20px;
                           text-decoration: none;
                           border-radius: 6px;
                           display: inline-block;
                       ">
                        Verify Email
                    </a>
                </p>

                <p>This link expires in <strong>24 hours</strong>.</p>

                <p>If you didn’t request this, you can safely ignore this email.</p>

                <hr style="margin: 24px 0;" />

                <p style="font-size: 12px; color: #666;">
                    © Verfalarm • Product Expiry Reminder
                </p>
            </div>
            """.formatted(user.getDisplayName(), link);

            helper.setText(html, true);

            mailSender.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send verification email", e);
        }
    }

    @Override
    public void sendWelcomeEmail(User user) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(user.getEmail());
            helper.setFrom(fromAddress);
            helper.setSubject("Thanks for signing up!");

            String html = """
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Welcome %s 🎉</h2>

                <p>Thanks for signing up to <strong>Verfalarm</strong>. We're glad to have you on board.</p>

                <p>Here are some quick links to get started:</p>
                <ul>
                    <li><a href="%s">Open app</a></li>
                    <li><a href="%s/profile">Your profile</a></li>
                </ul>

                <p>If you have any questions, reply to this email and we'll help.</p>

                <hr style="margin: 24px 0;" />

                <p style="font-size: 12px; color: #666;">© Verfalarm • Product Expiry Reminder</p>
            </div>
            """.formatted(user.getDisplayName(), backendBaseUrl, backendBaseUrl);

            helper.setText(html, true);
            mailSender.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send welcome email", e);
        }
    }

    @Override
    public void sendProductReminderDigest(User user, List<Product> dueProducts, ZoneId zoneId) {
        if (user == null || dueProducts == null || dueProducts.isEmpty()) return;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(user.getEmail());
            helper.setFrom(fromAddress);
            helper.setSubject("Verfalarm reminder: " + dueProducts.size() + " products due");

            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(zoneId);

            List<Product> sorted = dueProducts.stream()
                    .sorted(Comparator.comparing(Product::getExpirationDate))
                    .toList();

            StringBuilder rows = new StringBuilder();
            for (Product p : sorted) {
                double bought = p.getQuantityBought() == null ? 0.0 : p.getQuantityBought();
                double consumed = p.getQuantityConsumed() == null ? 0.0 : p.getQuantityConsumed();
                double remaining = Math.max(0.0, bought - consumed);
                String freqLabel = frequencyLabel(p.getNotificationFrequency());
                String expiryLabel = p.getExpirationDate() == null ? "-" : p.getExpirationDate().format(java.time.format.DateTimeFormatter.ISO_DATE);
                String nextLabel = p.getNextNotificationAt() == null ? "-" : dateFormatter.format(p.getNextNotificationAt());

                rows.append("<tr>")
                        .append("<td style=\"padding:8px;border-bottom:1px solid #e5e7eb;\">").append(escapeHtml(p.getName())).append("</td>")
                        .append("<td style=\"padding:8px;border-bottom:1px solid #e5e7eb;\">").append(expiryLabel).append("</td>")
                        .append("<td style=\"padding:8px;border-bottom:1px solid #e5e7eb;\">")
                        .append(String.format(Locale.US, "%.2f %s", remaining, p.getUnit()))
                        .append("</td>")
                        .append("<td style=\"padding:8px;border-bottom:1px solid #e5e7eb;\">").append(freqLabel).append("</td>")
                        .append("<td style=\"padding:8px;border-bottom:1px solid #e5e7eb;\">").append(nextLabel).append("</td>")
                        .append("</tr>");
            }

            String html = """
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                      <h2>Hi %s, reminders are due</h2>
                      <p>These products are due for a reminder in this run:</p>
                      <table style="border-collapse: collapse; width: 100%%; max-width: 760px;">
                        <thead>
                          <tr style="background: #f3f4f6;">
                            <th style="text-align:left;padding:8px;border-bottom:1px solid #d1d5db;">Product</th>
                            <th style="text-align:left;padding:8px;border-bottom:1px solid #d1d5db;">Expires</th>
                            <th style="text-align:left;padding:8px;border-bottom:1px solid #d1d5db;">Remaining</th>
                            <th style="text-align:left;padding:8px;border-bottom:1px solid #d1d5db;">Frequency</th>
                            <th style="text-align:left;padding:8px;border-bottom:1px solid #d1d5db;">Next Reminder</th>
                          </tr>
                        </thead>
                        <tbody>
                          %s
                        </tbody>
                      </table>
                      <p style="margin-top:16px;">You can review or update product details in the app.</p>
                      <hr style="margin: 24px 0;" />
                      <p style="font-size: 12px; color: #666;">Verfalarm - Product Expiry Reminder</p>
                    </div>
                    """.formatted(escapeHtml(user.getDisplayName()), rows.toString());

            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send reminder digest email", e);
        }
    }

    private String frequencyLabel(NotificationFrequency frequency) {
        if (frequency == null) return "Monthly";
        return switch (frequency) {
            case DAILY -> "Daily";
            case WEEKLY -> "Weekly";
            case MONTHLY -> "Monthly";
            case QUARTERLY -> "Quarterly";
            case NEVER -> "Never";
        };
    }

    private String escapeHtml(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;");
    }

}
