package com.verf.ProdExp.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;


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

    private LocalDate purchaseDate;
    @NonNull// optional
    private LocalDate expirationDate;

    private Status status;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
}
