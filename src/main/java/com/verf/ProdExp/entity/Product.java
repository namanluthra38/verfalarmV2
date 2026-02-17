package com.verf.ProdExp.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;


@Document("products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@CompoundIndexes({
        // Supports (userId, nameTokens) queries for prefix/tag searches
        @CompoundIndex(
                name = "user_name_tokens_idx",
                def = "{'userId': 1, 'nameTokens': 1}"
        )
})
public class Product {

    @Id
    private String id;
    @NonNull
    private String userId;
    @NonNull
    private String name;
    // Normalized copy of name for case-insensitive search
    private String nameLower;
    // Search tokens derived from name/tags (prefix-friendly)
    private List<String> nameTokens;
    @NonNull
    private Double quantityBought;
    @NonNull
    private Double quantityConsumed;
    @NonNull
    private Unit unit;

    @NonNull
    private LocalDate purchaseDate;
    @NonNull
    private LocalDate expirationDate;

    private Status status;

    // Controls reminder cadence for this product
    private NotificationFrequency notificationFrequency;

    // Optional labels used for grouping and search token generation
    private List<String> tags;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
}
