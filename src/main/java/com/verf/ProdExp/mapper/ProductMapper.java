package com.verf.ProdExp.mapper;

import com.verf.ProdExp.dto.ProductRequest;
import com.verf.ProdExp.dto.ProductResponse;
import com.verf.ProdExp.entity.Product;
import com.verf.ProdExp.entity.Status;

import java.time.LocalDate;
import java.time.ZoneId;

public class ProductMapper {

    public static Product toEntity(ProductRequest req) {
        if (req == null) return null;
        Product p = Product.builder()
                .userId(req.userId())
                .name(req.name())
                .quantityBought(req.quantityBought())
                .quantityConsumed(req.quantityConsumed())
                .unit(req.unit())
                .purchaseDate(req.purchaseDate())
                .expirationDate(req.expirationDate())
                .build();
        p.setStatus(computeStatus(p));
        return p;
    }

    public static ProductResponse toResponse(Product p) {
        if (p == null) return null;
        // ensure status is up-to-date when converting
        Status status = computeStatus(p);
        if (p.getStatus() != status) p.setStatus(status);

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
                status
        );
    }

    public static Status computeStatus(Product p) {
        if (p == null) return null;
        // entity fields are annotated @NonNull, so compare directly
        double finishedCmp = p.getQuantityConsumed();
        double boughtCmp = p.getQuantityBought();
        boolean finished = finishedCmp >= boughtCmp;
        boolean expired = p.getExpirationDate().isBefore(LocalDate.now(ZoneId.systemDefault()));

        if (finished && expired) return Status.EXPIRED_AND_FINISHED;
        if (finished) return Status.FINISHED;
        if (expired) return Status.EXPIRED;
        return Status.ACTIVE; // neither finished nor expired
    }
}
