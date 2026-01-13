package com.verf.ProdExp.security;


import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Date;

@Component
public class JwtProvider {

    private final Algorithm algorithm;
    private final JWTVerifier verifier;
    private final long expirationSeconds;

    public JwtProvider(@Value("${app.jwt.secret:default_jwt_change_me}") String secret,
                       @Value("${app.jwt.expiration-seconds:3600}") long expirationSeconds) {
        this.algorithm = Algorithm.HMAC256(secret);
        this.verifier = JWT.require(algorithm).build();
        this.expirationSeconds = expirationSeconds;
    }

    public String generateToken(String subject) {
        Instant now = Instant.now();
        return JWT.create()
                .withSubject(subject)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(now.plusSeconds(expirationSeconds)))
                .sign(algorithm);
    }

    public String validateAndGetSubject(String token) {
        try {
            DecodedJWT decoded = verifier.verify(token);
            return decoded.getSubject();
        } catch (JWTVerificationException e) {
            throw new RuntimeException("Invalid JWT token", e);
        }
    }
}
