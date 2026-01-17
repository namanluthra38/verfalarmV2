package com.verf.ProdExp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Email String email,
        @Size(min = 6, max = 100) String password,
        String displayName,
        Boolean enabled
) {
}

