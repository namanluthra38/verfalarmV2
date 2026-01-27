package com.verf.ProdExp.service;

import com.verf.ProdExp.entity.User;

import java.util.Optional;

public interface VerificationTokenService {
    String createAndSendToken(User user);
    Optional<String> verifyToken(String rawToken);
}