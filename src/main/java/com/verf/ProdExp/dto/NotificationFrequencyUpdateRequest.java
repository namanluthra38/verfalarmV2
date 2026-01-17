package com.verf.ProdExp.dto;

import com.verf.ProdExp.entity.NotificationFrequency;
import jakarta.validation.constraints.NotNull;

public record NotificationFrequencyUpdateRequest(
        @NotNull NotificationFrequency notificationFrequency
) {
}

