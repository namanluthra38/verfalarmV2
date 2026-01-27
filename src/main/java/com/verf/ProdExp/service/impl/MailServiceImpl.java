// java
package com.verf.ProdExp.service.impl;

import com.verf.ProdExp.entity.User;
import com.verf.ProdExp.service.MailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

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

}
