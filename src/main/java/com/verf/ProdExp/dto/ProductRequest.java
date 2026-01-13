package com.verf.ProdExp.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record ProductRequest(
        String userId,
        @NotBlank String name,
        @NotNull @PositiveOrZero Double quantityBought,
        @NotNull @PositiveOrZero Double quantityConsumed,
        @NotBlank String unit,
        @NotNull LocalDate purchaseDate,
        @NotNull LocalDate expirationDate
) {
}
