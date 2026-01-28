package com.verf.ProdExp.util;

import com.verf.ProdExp.entity.NotificationFrequency;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Small heuristic-based calculator for notification frequency.
 * You can replace/extend this with more sophisticated logic.
 */
public final class NotificationFrequencyCalculator {

    private NotificationFrequencyCalculator() {}

    public static NotificationFrequency calculate(LocalDate purchaseDate, LocalDate expirationDate, double quantityBought, double quantityConsumed) {
        if (expirationDate == null || purchaseDate == null) return NotificationFrequency.MONTHLY;

        long daysToExpiry = ChronoUnit.DAYS.between(LocalDate.now(), expirationDate);
        double remaining = Math.max(0.0, quantityBought - quantityConsumed);

        // If already expired -> never
        if (daysToExpiry <= 0) return NotificationFrequency.NEVER;

        // If small quantity left or expires very soon -> daily
        if (remaining <= 2.0 || daysToExpiry <= 7) return NotificationFrequency.DAILY;

        // If moderate timeframe -> weekly
        if (daysToExpiry <= 30) return NotificationFrequency.WEEKLY;

        // Otherwise monthly
        return NotificationFrequency.MONTHLY;
    }
}

