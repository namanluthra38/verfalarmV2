package com.verf.ProdExp.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document("verification_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationToken {

    @Id
    private String id;

    // reference to user id
    private String userId;

    // SHA-256 hex of the token
    private String tokenHash;

    private Instant expiresAt;

    @CreatedDate
    private Instant createdAt;
}
