package com.verf.ProdExp.dto;

import com.verf.ProdExp.entity.Unit;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;

public record ProductRequest(
        String userId,
        @NotBlank String name,
        @NotNull @PositiveOrZero Double quantityBought,
        @NotNull @PositiveOrZero Double quantityConsumed,
        @NotNull Unit unit,
        @NotNull LocalDate purchaseDate,
        @NotNull LocalDate expirationDate,
        // optional tags to categorize the product
        List<String> tags
) {
    public static ProductRequest of(String userId,
                                    String name,
                                    Double quantityBought,
                                    Double quantityConsumed,
                                    Unit unit,
                                    LocalDate purchaseDate,
                                    LocalDate expirationDate,
                                    List<String> tags) {
        return new ProductRequest(userId, name, quantityBought, quantityConsumed, unit, purchaseDate, expirationDate, tags);
    }
}
