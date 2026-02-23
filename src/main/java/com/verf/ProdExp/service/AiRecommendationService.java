package com.verf.ProdExp.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AiRecommendationService {
    private final ChatClient chatClient;

    @Autowired
    public AiRecommendationService(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    public String getRecommendation(String productName, long daysLeft, double quantityLeft, String unit) {
        if (productName == null || productName.isBlank()) {
            return "Product name cannot be empty.";
        }
        if (daysLeft <= 0) {
            return "Days left must be greater than 0.";
        }
        if (quantityLeft < 0) {
            return "Quantity left must be non-negative.";
        }
        if (unit == null || unit.isBlank()) {
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
                        "productName", productName.trim(),
                        "daysLeft", daysLeft,
                        "quantityLeft", quantityLeft,
                        "unit", unit
                    ));
                })
                .call()
                .content();
    }
}
