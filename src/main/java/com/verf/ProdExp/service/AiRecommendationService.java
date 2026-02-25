package com.verf.ProdExp.service;

import com.verf.ProdExp.dto.RecommendationRequest;

/**
 * Interface for AI recommendation operations.
 */
public interface AiRecommendationService {
    /**
     * Get a recommendation for the given request and user.
     * Implementations should attempt to return a cached recommendation when possible.
     * If a fresh recommendation is generated it may consume a rate-limit token for the user.
     */
    String getRecommendation(RecommendationRequest req, String userId);
}
