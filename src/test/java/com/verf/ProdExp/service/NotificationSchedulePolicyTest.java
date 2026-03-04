package com.verf.ProdExp.service;

import com.verf.ProdExp.config.NotificationProperties;
import com.verf.ProdExp.entity.NotificationFrequency;
import com.verf.ProdExp.entity.Product;
import com.verf.ProdExp.entity.Status;
import com.verf.ProdExp.entity.Unit;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;

import static org.junit.jupiter.api.Assertions.*;

class NotificationSchedulePolicyTest {

    private NotificationSchedulePolicy newPolicy(String timezone) {
        NotificationProperties props = new NotificationProperties();
        props.setTimezone(timezone);
        return new NotificationSchedulePolicy(props);
    }

    private Product sampleProduct() {
        Product p = new Product();
        p.setUserId("u1");
        p.setName("Milk");
        p.setQuantityBought(10.0);
        p.setQuantityConsumed(1.0);
        p.setUnit(Unit.LITER);
        p.setPurchaseDate(LocalDate.now().minusDays(1));
        p.setExpirationDate(LocalDate.now().plusDays(40));
        p.setStatus(Status.AVAILABLE);
        return p;
    }

    @Test
    void computeNextNotificationAt_supportsAllIntervalsAndNever() {
        NotificationSchedulePolicy policy = newPolicy("UTC");
        ZoneId zoneId = ZoneOffset.UTC;
        Instant anchor = Instant.parse("2026-01-15T10:30:00Z");

        assertEquals(
                Instant.parse("2026-01-16T10:30:00Z"),
                policy.computeNextNotificationAt(NotificationFrequency.DAILY, anchor, zoneId)
        );
        assertEquals(
                Instant.parse("2026-01-22T10:30:00Z"),
                policy.computeNextNotificationAt(NotificationFrequency.WEEKLY, anchor, zoneId)
        );
        assertEquals(
                Instant.parse("2026-02-15T10:30:00Z"),
                policy.computeNextNotificationAt(NotificationFrequency.MONTHLY, anchor, zoneId)
        );
        assertEquals(
                Instant.parse("2026-04-15T10:30:00Z"),
                policy.computeNextNotificationAt(NotificationFrequency.QUARTERLY, anchor, zoneId)
        );
        assertNull(policy.computeNextNotificationAt(NotificationFrequency.NEVER, anchor, zoneId));
    }

    @Test
    void reconcileAfterDataChange_setsAutoFrequencyAndNextForNewProduct() {
        NotificationSchedulePolicy policy = newPolicy("UTC");
        Product p = sampleProduct();
        p.setNotificationFrequency(null);
        p.setNextNotificationAt(null);

        Instant now = Instant.parse("2026-03-01T00:00:00Z");
        boolean changed = policy.reconcileAfterDataChange(p, now);

        assertTrue(changed);
        assertNotNull(p.getNotificationFrequency());
        assertNotNull(p.getNextNotificationAt());
    }

    @Test
    void reconcileAfterDataChange_keepsManualOverrideUntilExplicitClear() {
        NotificationSchedulePolicy policy = newPolicy("UTC");
        Product p = sampleProduct();
        p.setNotificationFrequencyOverride(NotificationFrequency.WEEKLY);
        p.setNotificationFrequency(NotificationFrequency.WEEKLY);
        Instant existingNext = Instant.parse("2026-03-10T00:00:00Z");
        p.setNextNotificationAt(existingNext);

        // Change product data to something that would normally auto-calculate as DAILY.
        p.setExpirationDate(LocalDate.now().plusDays(2));
        p.setQuantityConsumed(9.5);

        policy.reconcileAfterDataChange(p, Instant.parse("2026-03-01T00:00:00Z"));

        assertEquals(NotificationFrequency.WEEKLY, p.getNotificationFrequencyOverride());
        assertEquals(NotificationFrequency.WEEKLY, p.getNotificationFrequency());
        assertEquals(existingNext, p.getNextNotificationAt());
    }

    @Test
    void clearManualOverride_recalculatesAutoAndAnchorsFromLastSentWhenPresent() {
        NotificationSchedulePolicy policy = newPolicy("UTC");
        Product p = sampleProduct();
        p.setNotificationFrequencyOverride(NotificationFrequency.DAILY);
        p.setNotificationFrequency(NotificationFrequency.DAILY);
        Instant lastSent = Instant.parse("2026-03-01T10:00:00Z");
        p.setLastNotificationSentAt(lastSent);
        p.setNextNotificationAt(Instant.parse("2026-03-02T10:00:00Z"));

        policy.clearManualOverride(p, Instant.parse("2026-03-04T00:00:00Z"));

        NotificationFrequency auto = policy.calculateAutoFrequency(p);
        Instant expectedNext = policy.computeNextNotificationAt(auto, lastSent, ZoneOffset.UTC);

        assertNull(p.getNotificationFrequencyOverride());
        assertEquals(auto, p.getNotificationFrequency());
        assertEquals(expectedNext, p.getNextNotificationAt());
    }

    @Test
    void refreshForScheduler_resetsScheduleWhenAutoFrequencyChanges() {
        NotificationSchedulePolicy policy = newPolicy("UTC");
        Product p = sampleProduct();
        p.setNotificationFrequency(NotificationFrequency.MONTHLY);
        p.setNotificationFrequencyOverride(null);
        p.setNextNotificationAt(Instant.parse("2026-05-01T00:00:00Z"));

        // force auto frequency to daily
        p.setExpirationDate(LocalDate.now().plusDays(1));
        p.setQuantityConsumed(9.9);

        Instant now = Instant.parse("2026-03-01T00:00:00Z");
        boolean changed = policy.refreshForScheduler(p, now);

        assertTrue(changed);
        assertEquals(NotificationFrequency.DAILY, p.getNotificationFrequency());
        assertEquals(
                ZonedDateTime.ofInstant(now, ZoneOffset.UTC).plusDays(1).toInstant(),
                p.getNextNotificationAt()
        );
    }
}
