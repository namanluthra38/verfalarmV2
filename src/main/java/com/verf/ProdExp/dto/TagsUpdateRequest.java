package com.verf.ProdExp.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record TagsUpdateRequest(
        @NotNull List<String> tags
) {
}

