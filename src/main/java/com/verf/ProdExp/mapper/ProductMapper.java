package com.verf.ProdExp.mapper;

import com.verf.ProdExp.dto.ProductRequest;
import com.verf.ProdExp.dto.ProductResponse;
import com.verf.ProdExp.entity.Product;
import com.verf.ProdExp.entity.Status;

import java.time.Instant;
import java.time.LocalDate;

public class ProductMapper {

    public static Product toEntity(ProductRequest req) {
        return Product.builder()
                .id(null)
                .userId(req.userId())
                .name(req.name())
                .quantityBought(req.quantityBought())
                .quantityConsumed(req.quantityConsumed())
                .unit(req.unit())
                .purchaseDate(req.purchaseDate())
                .expirationDate(req.expirationDate())
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
                p.getStatus()
        );
    }

    public static Status computeStatus(Product p) {
        if (p.getQuantityConsumed() != null && p.getQuantityBought() != null && p.getQuantityConsumed().doubleValue() >= p.getQuantityBought().doubleValue()) {
            return Status.FINISHED;
        }
        if (p.getExpirationDate() != null && p.getExpirationDate().isBefore(LocalDate.now())) {
            return Status.EXPIRED;
        }
        // use AVAILABLE as the neutral state (neither finished nor expired)
        return Status.AVAILABLE;
    }
}
