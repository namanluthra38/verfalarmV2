package com.verf.ProdExp.dto;
// DTO for AI recommendation request
public record RecommendationRequest(
        String productName,
        long daysLeft,
        double quantityLeft,
        String unit
) {}