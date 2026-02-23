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

    public String getRecommendation(String productName, long daysLeft) {
        if (productName == null || productName.isBlank()) {
            return "Product name cannot be empty.";
        }
        if (daysLeft <= 0) {
            return "Days left must be greater than 0.";
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
                            Give practical suggestions to prevent wastage.
                            """);
                    u.params(Map.of("productName", productName.trim(), "daysLeft", daysLeft));
                })
                .call()
                .content();
    }
}

