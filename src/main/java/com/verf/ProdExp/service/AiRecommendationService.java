package com.verf.ProdExp.service;

import com.verf.ProdExp.dto.RecommendationRequest;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AiRecommendationService {
    private final ChatClient chatClient;

    @Autowired
    public AiRecommendationService(ChatClient chatClient) {
        this.chatClient = chatClient;
    }


    // Refactored method to use DTO
    @Cacheable(
            value = "aiRecommendations",
            // Use root.args[0] so SpEL reads properties from the RecommendationRequest parameter
            key = "T(String).format('ai:recommend:%s:%d:%.2f:%s', " +
                    "#root.args[0].productName, " +
                    "#root.args[0].daysLeft, " +
                    "#root.args[0].quantityLeft, " +
                    "#root.args[0].unit)"
    )
    public String getRecommendation(RecommendationRequest req) {
        System.out.println("🔥 AI CALLED");
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
        String systemMessage = """
            You are an assistant that helps users consume products before expiration.
            Rules:
            - Keep response concise and practical.
            - For food: suggest 2-3 realistic recipes or usage ideas.
            - For medicine: briefly state its use with a safety warning to consult a doctor.
            - If the product is unrecognizable, apologize briefly.
            - Do not add unnecessary filler or disclaimers.
            """;
        return chatClient.prompt()
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
    }
}
