package com.verf.ProdExp.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;
import com.verf.ProdExp.entity.NotificationFrequency;

public record ProductRequest(
        String userId,
        @NotBlank String name,
        @NotNull @PositiveOrZero Double quantityBought,
        @NotNull @PositiveOrZero Double quantityConsumed,
        @NotBlank String unit,
        @NotNull LocalDate purchaseDate,
        @NotNull LocalDate expirationDate,
        // optional: if omitted, controller/mapper will default to MONTHLY
        NotificationFrequency notificationFrequency,
        // optional tags to categorize the product
        List<String> tags
) {
    public static ProductRequest of(String userId,
                                    String name,
                                    Double quantityBought,
                                    Double quantityConsumed,
                                    String unit,
                                    LocalDate purchaseDate,
                                    LocalDate expirationDate,
                                    NotificationFrequency notificationFrequency,
                                    List<String> tags) {
        return new ProductRequest(userId, name, quantityBought, quantityConsumed, unit, purchaseDate, expirationDate, notificationFrequency, tags);
    }
}
