package com.verf.ProdExp.service;

import com.verf.ProdExp.entity.User;

public interface MailService {
    void sendVerificationEmail(User user, String rawToken);
    void sendWelcomeEmail(User user);
}