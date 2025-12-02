package com.verf.ProdExp.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record QuantityConsumedUpdateRequest(
        @NotNull @PositiveOrZero Double quantityConsumed
) {
}

