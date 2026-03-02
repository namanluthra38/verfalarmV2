package com.verf.ProdExp.service.impl;

import com.verf.ProdExp.dto.RecommendationRequest;
import com.verf.ProdExp.service.AiRecommendationService;
import com.verf.ProdExp.service.AIRateLimiterService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
public class AiRecommendationServiceImpl implements AiRecommendationService {
    private final ChatClient chatClient;
    private final CacheManager cacheManager;
    private final AIRateLimiterService aiRateLimiterService;

    @Autowired
    public AiRecommendationServiceImpl(ChatClient chatClient, CacheManager cacheManager, AIRateLimiterService aiRateLimiterService) {
        this.chatClient = chatClient;
        this.cacheManager = cacheManager;
        this.aiRateLimiterService = aiRateLimiterService;
    }

    private String buildCacheKey(RecommendationRequest req) {
        return String.format("ai:recommend:%s:%d:%.2f:%s",
                req.productName().trim(),
                req.daysLeft(),
                req.quantityLeft(),
                req.unit().trim());
    }

    @Override
    public String getRecommendation(RecommendationRequest req, String userId) {
        if (req == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid recommendation request");

        // quick validation
        if (req.productName() == null || req.productName().isBlank()) {
            return "Product name cannot be empty.";
        }
        if (req.daysLeft() <= 0) {
            return "Days left must be greater than 0.";
        }
        if (req.quantityLeft() < 0) {
            return "Quantity left must be non-negative.";
        }
        if (req.unit() == null || req.unit().isBlank()) {
            return "Unit must be provided.";
        }

        String key = buildCacheKey(req);
        Cache cache = cacheManager.getCache("aiRecommendations");
        if (cache != null) {
            Cache.ValueWrapper wrapper = cache.get(key);
            if (wrapper != null) {
                Object cached = wrapper.get();
                if (cached instanceof String) {
                    // Cache HIT: return without consuming rate-limit
                    return (String) cached;
                }
            }
        }

        // Cache miss -> need to consume a rate limit token for this user
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user required for AI recommendation");
        }

        boolean allowed = aiRateLimiterService.allowRequest(userId);
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "AI recommendation rate limit exceeded (5/day)");
        }

        String systemMessage = """
            You are an assistant that helps users consume products before expiration.
            Rules:
            - Keep response concise and practical.
            - For food: suggest 2-3 realistic recipes or usage ideas.
            - For medicine: briefly state its use with a safety warning to consult a doctor.
            - If the product is unrecognizable, apologize briefly.
            - Do not add unnecessary filler or disclaimers.
            """;

        String result = chatClient.prompt()
                .system(systemMessage)
                .user(u -> {
                    u.text("""
                            Product: {productName}
                            Days before expiration: {daysLeft}
                            Quantity left: {quantityLeft} {unit}
                            Give practical suggestions to prevent wastage.
                            """);
                    u.params(Map.of(
                            "productName", req.productName().trim(),
                            "daysLeft", req.daysLeft(),
                            "quantityLeft", req.quantityLeft(),
                            "unit", req.unit()
                    ));
                })
                .call()
                .content();

        if (cache != null && result != null) {
            cache.put(key, result);
        }

        return result;
    }
}

