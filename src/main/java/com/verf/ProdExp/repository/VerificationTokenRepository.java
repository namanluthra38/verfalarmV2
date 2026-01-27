package com.verf.ProdExp.repository;

import com.verf.ProdExp.entity.VerificationToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface VerificationTokenRepository extends MongoRepository<VerificationToken, String> {
    Optional<VerificationToken> findByTokenHash(String tokenHash);
    void deleteByUserId(String userId);
}