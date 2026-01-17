package com.verf.ProdExp.dto;

import java.time.Instant;
import java.util.Set;

public record UserResponse(
        String id,
        String email,
        Set<String> roles,
        boolean enabled,
        String displayName,
        Instant createdAt,
        Instant updatedAt
) {
}
