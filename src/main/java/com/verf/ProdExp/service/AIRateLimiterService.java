package com.verf.ProdExp.service;

/**
 * Interface for AI rate limiting operations.
 */
public interface AIRateLimiterService {
    /**
     * Attempt to allow a request for the given user today. Returns true if allowed and counter incremented.
     */
    boolean allowRequest(String userId);

    /**
     * Get remaining allowed requests for the authenticated user for today.
     */
    long getRemaining(String userId);
}
