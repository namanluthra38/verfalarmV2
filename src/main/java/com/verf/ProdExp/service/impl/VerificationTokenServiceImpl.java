package com.verf.ProdExp.service.impl;

import com.verf.ProdExp.entity.User;
import com.verf.ProdExp.entity.VerificationToken;
import com.verf.ProdExp.repository.UserRepository;
import com.verf.ProdExp.repository.VerificationTokenRepository;
import com.verf.ProdExp.service.MailService;
import com.verf.ProdExp.service.VerificationTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VerificationTokenServiceImpl implements VerificationTokenService {

    private static final int TOKEN_BYTE_LENGTH = 32; // strong token
    private static final long EXPIRY_HOURS = 24;

    private final VerificationTokenRepository tokenRepository;
    private final MailService mailService;
    private final UserRepository userRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    public String createAndSendToken(User user) {
        // remove previous tokens for user
        if (user.getId() != null) {
            tokenRepository.deleteByUserId(user.getId());
        }

        // generate raw token (url-safe base64-like by hex) - return raw ascii hex for email link
        byte[] bytes = new byte[TOKEN_BYTE_LENGTH];
        secureRandom.nextBytes(bytes);
        String rawToken = HexFormat.of().formatHex(bytes);

        String tokenHash = sha256Hex(rawToken);

        VerificationToken vt = VerificationToken.builder()
                .userId(user.getId())
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plus(EXPIRY_HOURS, ChronoUnit.HOURS))
                .createdAt(Instant.now())
                .build();

        tokenRepository.save(vt);

        // ensure user.emailVerified is false and persisted
        if (Boolean.TRUE.equals(user.isEmailVerified())) {
            user.setEmailVerified(false);
            userRepository.save(user);
        }

        // send email with raw token
        mailService.sendVerificationEmail(user, rawToken);

        return rawToken;
    }

    @Override
    public Optional<String> verifyToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return Optional.empty();
        String tokenHash = sha256Hex(rawToken);

        Optional<VerificationToken> found = tokenRepository.findByTokenHash(tokenHash);
        if (found.isEmpty()) return Optional.empty();

        VerificationToken vt = found.get();
        if (vt.getExpiresAt() != null && vt.getExpiresAt().isBefore(Instant.now())) {
            tokenRepository.deleteByUserId(vt.getUserId());
            return Optional.empty();
        }

        // mark user verified
        Optional<User> maybeUser = userRepository.findById(vt.getUserId());
        if (maybeUser.isEmpty()) {
            tokenRepository.deleteByUserId(vt.getUserId());
            return Optional.empty();
        }

        User user = maybeUser.get();
        user.setEmailVerified(true);
        userRepository.save(user);

        // delete token(s)
        tokenRepository.deleteByUserId(vt.getUserId());

        return Optional.of(user.getId());
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash token", e);
        }
    }
}
