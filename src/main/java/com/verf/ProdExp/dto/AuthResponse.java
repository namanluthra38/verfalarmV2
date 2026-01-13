package com.verf.ProdExp.dto;

public record AuthResponse(
        String token,
        String tokenType,
        String userId
) {
}
