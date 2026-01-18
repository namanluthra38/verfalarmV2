package com.verf.ProdExp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateEmailRequest(
        @Email
        @NotBlank
        String email
) {
}

