package com.verf.ProdExp.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;


@Document("products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    private String id;
    @NonNull
    private String userId;
    @NonNull
    private String name;
    @NonNull
    private Double quantityBought;
    @NonNull
    private Double quantityConsumed;
    @NonNull
    private String unit;

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
