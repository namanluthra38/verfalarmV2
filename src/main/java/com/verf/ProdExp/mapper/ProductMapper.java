package com.verf.ProdExp.mapper;

import com.verf.ProdExp.dto.ProductRequest;
import com.verf.ProdExp.dto.ProductResponse;
import com.verf.ProdExp.entity.Product;
import com.verf.ProdExp.entity.Status;
import com.verf.ProdExp.entity.NotificationFrequency;

import java.time.LocalDate;
import java.util.List;

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
                .notificationFrequency(req.notificationFrequency() == null ? NotificationFrequency.MONTHLY : req.notificationFrequency())
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
        // Entity enforces non-null for numeric fields and expirationDate, so compare directly
        double bought = p.getQuantityBought();
        double consumed = p.getQuantityConsumed();
        boolean finished = bought > 0.0 && Double.compare(consumed, bought) >= 0;
        boolean expired = p.getExpirationDate().isBefore(LocalDate.now());

        if (finished && expired) return Status.EXPIRED_AND_FINISHED;
        if (finished) return Status.FINISHED;
        if (expired) return Status.EXPIRED;
        // use AVAILABLE as the neutral state (neither finished nor expired)
        return Status.AVAILABLE;
    }
}
