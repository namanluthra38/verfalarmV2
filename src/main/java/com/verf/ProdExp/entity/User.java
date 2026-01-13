package com.verf.ProdExp.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Set;

@Document("users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    @NonNull
    private String email;

    /**
     * Stored encoded (bcrypt) password
     */
    @NonNull
    private String password;

    /**
     * Roles like "ROLE_USER", "ROLE_ADMIN" or without prefix "USER"/"ADMIN" depending on mapping
     */
    @NonNull
    private Set<String> roles;

    private boolean enabled = true;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}

