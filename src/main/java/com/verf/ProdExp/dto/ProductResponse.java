package com.verf.ProdExp.dto;

import java.time.Instant;
import java.time.LocalDate;
import com.verf.ProdExp.entity.Status;

public record ProductResponse(
        String id,
        String userId,
        String name,
        Double quantityBought,
        Double quantityConsumed,
        String unit,
        LocalDate purchaseDate,
        LocalDate expirationDate,
        Instant createdAt,
        Instant updatedAt,
        Status status
) {
}
