package com.verf.ProdExp.service;

import com.verf.ProdExp.config.NotificationProperties;
import com.verf.ProdExp.entity.NotificationFrequency;
import com.verf.ProdExp.entity.Product;
import com.verf.ProdExp.util.NotificationFrequencyCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class NotificationSchedulePolicy {

    private final NotificationProperties notificationProperties;

    public ZoneId zoneId() {
        return notificationProperties.zoneId();
    }

    public NotificationFrequency calculateAutoFrequency(Product product) {
        if (product == null) return NotificationFrequency.MONTHLY;
        return NotificationFrequencyCalculator.calculate(
                product.getPurchaseDate(),
                product.getExpirationDate(),
                product.getQuantityBought(),
                product.getQuantityConsumed()
        );
    }

    public Instant computeNextNotificationAt(NotificationFrequency frequency, Instant anchor) {
        return computeNextNotificationAt(frequency, anchor, zoneId());
    }

    public Instant computeNextNotificationAt(NotificationFrequency frequency, Instant anchor, ZoneId zoneId) {
        if (frequency == null || frequency == NotificationFrequency.NEVER) {
            return null;
        }

        Instant base = anchor == null ? Instant.now() : anchor;
        ZonedDateTime zdt = ZonedDateTime.ofInstant(base, zoneId);
        return switch (frequency) {
            case DAILY -> zdt.plusDays(1).toInstant();
            case WEEKLY -> zdt.plusWeeks(1).toInstant();
            case MONTHLY -> zdt.plusMonths(1).toInstant();
            case QUARTERLY -> zdt.plusMonths(3).toInstant();
            case NEVER -> null;
        };
    }

    /**
     * Applies schedule/frequency behavior after product data changes (create/update/consumption update).
     * Manual overrides are preserved until explicitly cleared.
     */
    public boolean reconcileAfterDataChange(Product product, Instant now) {
        if (product == null) return false;

        boolean changed = false;
        NotificationFrequency manual = product.getNotificationFrequencyOverride();
        if (manual != null) {
            changed |= setFrequency(product, manual);
            if (manual == NotificationFrequency.NEVER) {
                changed |= setNextNotification(product, null);
            } else if (product.getNextNotificationAt() == null) {
                changed |= setNextNotification(product, computeNextNotificationAt(manual, now));
            }
            return changed;
        }

        NotificationFrequency auto = calculateAutoFrequency(product);
        NotificationFrequency previous = product.getNotificationFrequency();
        if (previous != auto) {
            changed |= setFrequency(product, auto);
            changed |= setNextNotification(product, computeNextNotificationAt(auto, now));
            return changed;
        }

        if (auto == NotificationFrequency.NEVER) {
            changed |= setNextNotification(product, null);
        } else if (product.getNextNotificationAt() == null) {
            changed |= setNextNotification(product, computeNextNotificationAt(auto, now));
        }

        if (previous == null) {
            changed |= setFrequency(product, auto);
        }

        return changed;
    }

    /**
     * Sets a manual override and resets schedule from now.
     */
    public boolean applyManualOverride(Product product, NotificationFrequency override, Instant now) {
        if (product == null) return false;
        boolean changed = false;
        changed |= setFrequencyOverride(product, override);
        changed |= setFrequency(product, override);
        changed |= setNextNotification(product, computeNextNotificationAt(override, now));
        return changed;
    }

    /**
     * Clears manual override and returns product to auto mode.
     * Recomputes next run from last sent timestamp when available, else from now.
     */
    public boolean clearManualOverride(Product product, Instant now) {
        if (product == null) return false;
        boolean changed = false;
        changed |= setFrequencyOverride(product, null);

        NotificationFrequency auto = calculateAutoFrequency(product);
        changed |= setFrequency(product, auto);

        Instant anchor = product.getLastNotificationSentAt() == null ? now : product.getLastNotificationSentAt();
        changed |= setNextNotification(product, computeNextNotificationAt(auto, anchor));
        return changed;
    }

    /**
     * Reconciles frequency/schedule state during scheduler scans.
     * Auto frequencies are recalculated and persisted when changed.
     */
    public boolean refreshForScheduler(Product product, Instant now) {
        if (product == null) return false;

        boolean changed = false;
        NotificationFrequency manual = product.getNotificationFrequencyOverride();

        if (manual != null) {
            changed |= setFrequency(product, manual);
            if (manual == NotificationFrequency.NEVER) {
                changed |= setNextNotification(product, null);
            } else {
                Instant lastSent = product.getLastNotificationSentAt();
                Instant next = product.getNextNotificationAt();
                if (next == null) {
                    Instant anchor = lastSent == null ? now : lastSent;
                    changed |= setNextNotification(product, computeNextNotificationAt(manual, anchor));
                } else if (lastSent != null && !next.isAfter(lastSent)) {
                    changed |= setNextNotification(product, computeNextNotificationAt(manual, lastSent));
                }
            }
            return changed;
        }

        NotificationFrequency auto = calculateAutoFrequency(product);
        NotificationFrequency previous = product.getNotificationFrequency();
        if (previous != auto) {
            changed |= setFrequency(product, auto);
            // Auto frequency changed: reset schedule from now.
            changed |= setNextNotification(product, computeNextNotificationAt(auto, now));
        } else if (previous == null) {
            changed |= setFrequency(product, auto);
        }

        NotificationFrequency effective = product.getNotificationFrequency() == null ? auto : product.getNotificationFrequency();
        if (effective == NotificationFrequency.NEVER) {
            changed |= setNextNotification(product, null);
        } else {
            Instant lastSent = product.getLastNotificationSentAt();
            Instant next = product.getNextNotificationAt();
            if (next == null) {
                Instant anchor = lastSent == null ? now : lastSent;
                changed |= setNextNotification(product, computeNextNotificationAt(effective, anchor));
            } else if (lastSent != null && !next.isAfter(lastSent)) {
                changed |= setNextNotification(product, computeNextNotificationAt(effective, lastSent));
            }
        }

        return changed;
    }

    private boolean setFrequency(Product product, NotificationFrequency frequency) {
        if (product.getNotificationFrequency() == frequency) return false;
        product.setNotificationFrequency(frequency);
        return true;
    }

    private boolean setFrequencyOverride(Product product, NotificationFrequency override) {
        if (product.getNotificationFrequencyOverride() == override) return false;
        product.setNotificationFrequencyOverride(override);
        return true;
    }

    private boolean setNextNotification(Product product, Instant nextNotificationAt) {
        if (Objects.equals(product.getNextNotificationAt(), nextNotificationAt)) return false;
        product.setNextNotificationAt(nextNotificationAt);
        return true;
    }
}

