package com.verf.ProdExp.mapper;

import com.verf.ProdExp.dto.ProductRequest;
import com.verf.ProdExp.dto.ProductResponse;
import com.verf.ProdExp.entity.Product;
import com.verf.ProdExp.entity.Status;
import com.verf.ProdExp.entity.NotificationFrequency;
import com.verf.ProdExp.util.NotificationFrequencyCalculator;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class ProductMapper {

    public static Product toEntity(ProductRequest req) {
        NotificationFrequency freq = NotificationFrequencyCalculator.calculate(
                req.purchaseDate(), req.expirationDate(), req.quantityBought(), req.quantityConsumed()
        );

        String nameLower = req.name() == null ? null : req.name().toLowerCase().trim();
        List<String> tokens = nameLower == null ? null : tokenizeName(nameLower);

        // Merge tag tokens with name tokens (preserve order, avoid duplicates)
        if (req.tags() != null && !req.tags().isEmpty()) {
            List<String> tagTokens = tokensFromTags(req.tags());
            if (tokens == null) tokens = tagTokens;
            else {
                Set<String> merged = new LinkedHashSet<>(tokens);
                merged.addAll(tagTokens);
                tokens = new ArrayList<>(merged);
            }
        }

        return Product.builder()
                .id(null)
                .userId(req.userId())
                .name(req.name())
                .nameLower(nameLower)
                .nameTokens(tokens)
                .quantityBought(req.quantityBought())
                .quantityConsumed(req.quantityConsumed())
                .unit(req.unit())
                .purchaseDate(req.purchaseDate())
                .expirationDate(req.expirationDate())
                .notificationFrequency(freq)
                .tags(req.tags() == null || req.tags().isEmpty() ? null : List.copyOf(req.tags()))
                .createdAt(null)
                .updatedAt(null)
                .build();
    }

    public static ProductResponse toResponse(Product p) {

        return new ProductResponse(
                p.getId(),
                p.getUserId(),
                p.getName(),
                p.getQuantityBought(),
                p.getQuantityConsumed(),
                p.getUnit(),
                p.getPurchaseDate(),
                p.getExpirationDate(),
                p.getCreatedAt(),
                p.getUpdatedAt(),
                p.getStatus(),
                p.getNotificationFrequency() == null ? NotificationFrequency.MONTHLY : p.getNotificationFrequency(),
                p.getTags() == null || p.getTags().isEmpty() ? List.of() : List.copyOf(p.getTags())
        );
    }

    public static Status computeStatus(Product p) {
        // Numeric fields and expirationDate are required on the entity; direct comparisons are safe
        double bought = p.getQuantityBought();
        double consumed = p.getQuantityConsumed();
        boolean finished = bought > 0.0 && Double.compare(consumed, bought) >= 0;
        boolean expired = p.getExpirationDate().isBefore(LocalDate.now()) || p.getExpirationDate().isEqual(LocalDate.now());

        if (finished) return Status.FINISHED;
        else if (expired) return Status.EXPIRED;
        return Status.AVAILABLE;
    }

    public static List<String> tokenizeName(String lowername) {
        if (lowername == null) return List.of();

        String normalized = lowername.toLowerCase().trim();

        String[] words = normalized.split("\\W+");
        Set<String> tokens = new LinkedHashSet<>();

        for (String word : words) {
            if (word.length() < 2) continue;

            // Build all prefixes for quick prefix-based search (a, ap, app, ...)
            for (int i = 1; i <= word.length(); i++) {
                tokens.add(word.substring(0, i));
            }
        }
        return new ArrayList<>(tokens);
    }

    // Generate tokens for tags similar to name tokens (prefix-friendly)
    public static List<String> tokensFromTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) return List.of();
        Set<String> tokens = new LinkedHashSet<>();
        for (String t : tags) {
            if (t == null) continue;
            String lower = t.toLowerCase().trim();
            if (lower.isEmpty()) continue;
            String[] words = lower.split("\\W+");
            for (String w : words) {
                if (w.length() < 2) continue;
                tokens.add(w.substring(0, w.length()/2));
                tokens.add(w);
            }
        }
        return new ArrayList<>(tokens);
    }

    // Recompute and persist combined tokens from nameLower + tags (idempotent)
    public static void recomputeNameTokens(Product product) {
        if (product == null) return;
        Set<String> merged = new LinkedHashSet<>();
        if (product.getNameLower() != null && !product.getNameLower().isBlank()) {
            List<String> nameTokens = tokenizeName(product.getNameLower());
            merged.addAll(nameTokens);
        }
        if (product.getTags() != null && !product.getTags().isEmpty()) {
            List<String> tagTokens = tokensFromTags(product.getTags());
            merged.addAll(tagTokens);
        }
        product.setNameTokens(merged.isEmpty() ? null : new ArrayList<>(merged));
    }

    // Centralize name normalization/token updates on the entity
    public static void applyNameFields(Product product, String name) {
        product.setName(name);
        if (name == null) {
            product.setNameLower(null);
            product.setNameTokens(null);
            return;
        }
        String nameLower = name.toLowerCase().trim();
        product.setNameLower(nameLower);
        // Include existing tags when recomputing tokens
        recomputeNameTokens(product);
    }
}
