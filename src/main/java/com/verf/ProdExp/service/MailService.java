package com.verf.ProdExp.service;

import com.verf.ProdExp.entity.Product;
import com.verf.ProdExp.entity.User;

import java.time.ZoneId;
import java.util.List;

public interface MailService {
    void sendVerificationEmail(User user, String rawToken);
    void sendWelcomeEmail(User user);
    void sendProductReminderDigest(User user, List<Product> dueProducts, ZoneId zoneId);
}
