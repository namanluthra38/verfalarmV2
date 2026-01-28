package com.verf.ProdExp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdatePasswordRequest(
        @NotBlank
        String currentPassword,

        @NotBlank
        @Size(min = 6, max = 100)
        String newPassword
) {
}
