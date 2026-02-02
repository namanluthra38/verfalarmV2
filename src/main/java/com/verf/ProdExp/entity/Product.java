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
        @CompoundIndex(
                name = "user_name_idx",
                def = "{'userId': 1, 'nameLower': 1}"
        )
})
public class Product {

    @Id
    private String id;
    @NonNull
    private String userId;
    @NonNull
    private String name;
    private String nameLower;
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

    private NotificationFrequency notificationFrequency;

    private List<String> tags;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
}
