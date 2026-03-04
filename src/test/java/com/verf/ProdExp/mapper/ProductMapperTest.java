package com.verf.ProdExp.mapper;

import com.verf.ProdExp.dto.ProductResponse;
import com.verf.ProdExp.entity.NotificationFrequency;
import com.verf.ProdExp.entity.NotificationFrequencySource;
import com.verf.ProdExp.entity.Product;
import com.verf.ProdExp.entity.Status;
import com.verf.ProdExp.entity.Unit;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProductMapperTest {

    private Product baseProduct() {
        Product p = new Product();
        p.setId("p1");
        p.setUserId("u1");
        p.setName("Rice");
        p.setQuantityBought(5.0);
        p.setQuantityConsumed(1.0);
        p.setUnit(Unit.KILOGRAM);
        p.setPurchaseDate(LocalDate.now().minusDays(10));
        p.setExpirationDate(LocalDate.now().plusDays(10));
        p.setCreatedAt(Instant.parse("2026-03-01T00:00:00Z"));
        p.setUpdatedAt(Instant.parse("2026-03-01T00:00:00Z"));
        p.setStatus(Status.AVAILABLE);
        p.setNotificationFrequency(NotificationFrequency.WEEKLY);
        return p;
    }

    @Test
    void toResponse_setsAutoSourceWhenOverrideIsNull() {
        Product p = baseProduct();
        p.setNotificationFrequencyOverride(null);

        ProductResponse response = ProductMapper.toResponse(p);

        assertEquals(NotificationFrequencySource.AUTO, response.notificationFrequencySource());
    }

    @Test
    void toResponse_setsManualSourceWhenOverridePresent() {
        Product p = baseProduct();
        p.setNotificationFrequencyOverride(NotificationFrequency.DAILY);
        p.setNotificationFrequency(NotificationFrequency.DAILY);

        ProductResponse response = ProductMapper.toResponse(p);

        assertEquals(NotificationFrequencySource.MANUAL, response.notificationFrequencySource());
    }
}
