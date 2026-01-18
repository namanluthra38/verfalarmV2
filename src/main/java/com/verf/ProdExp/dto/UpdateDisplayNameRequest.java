package com.verf.ProdExp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateDisplayNameRequest(
        @NotBlank
        @Size(min = 1, max = 100)
        String displayName
) {
}

