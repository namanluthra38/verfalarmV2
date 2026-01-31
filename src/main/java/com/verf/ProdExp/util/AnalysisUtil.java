package com.verf.ProdExp.util;

import com.verf.ProdExp.entity.Product;
import com.verf.ProdExp.entity.Status;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;


public class AnalysisUtil {

    /**
     * Analyze a product and return JSON-compatible metrics.
     *
     * IMPROVED LOGIC:
     * - Accurate daily consumption calculation (excludes purchase day if no consumption yet)
     * - Smart recommendations that consider current pace vs required pace
     * - Better warnings for unrealistic consumption patterns
     * - Clearer separation between "on track" and "needs adjustment" scenarios
     *
     * Returned map contains keys:
     * - remainingQuantity (Double)
     * - percentConsumed (Double 0-100)
     * - percentRemaining (Double 0-100)
     * - daysUntilExpiration (Long) -- null if expirationDate null
     * - monthsUntilExpiration (Long) -- null if expirationDate null
     * - yearsUntilExpiration (Long) -- null if expirationDate null
     * - isExpired (Boolean)
     * - recommendedDailyToFinish (Double) -- null if cannot compute or not needed
     * - recommendedMonthlyToFinish (Double) -- null if cannot compute
     * - currentAvgDailyConsumption (Double) -- null if cannot compute
     * - estimatedFinishDate (String ISO-8601) -- null if cannot compute
     * - statusSuggestion (String)
     * - warnings (List<String>)
     * - daysSincePurchase (Long) -- null if purchaseDate null
     */
    private static Map<String, Object> analyze(Double quantityBought,
                                               Double quantityConsumed,
                                               LocalDate purchaseDate,
                                               LocalDate expirationDate) {
        Objects.requireNonNull(quantityBought, "quantityBought must not be null");
        if (quantityBought <= 0d) {
            throw new IllegalArgumentException("quantityBought must be greater than 0");
        }
        if (quantityConsumed == null) quantityConsumed = 0d;

        Map<String, Object> out = new LinkedHashMap<>();
        List<String> warnings = new ArrayList<>();

        double qb = quantityBought;
        double qc = quantityConsumed;

        // Validate consumed quantity
        if (qc < 0d) {
            warnings.add("Consumed quantity cannot be negative. Treating as 0 for calculations.");
            qc = 0d;
        }

        // Calculate remaining quantity
        double remaining = qb - qc;
        if (remaining < 0d) {
            warnings.add("Consumed quantity exceeds purchased quantity. The product appears to be fully consumed.");
            remaining = 0d;
        }

        out.put("remainingQuantity", round(remaining, 4));

        // Calculate consumption percentages
        double percentConsumed = qb == 0 ? 0d : (qc / qb) * 100d;
        percentConsumed = clamp(percentConsumed, 0d, 100d);
        out.put("percentConsumed", round(percentConsumed, 2));
        out.put("percentRemaining", round(100d - percentConsumed, 2));

        LocalDate now = LocalDate.now();

        // === EXPIRATION ANALYSIS ===
        Long daysUntilExpiration = null;
        Long monthsUntilExpiration = null;
        Long yearsUntilExpiration = null;
        boolean isExpired = false;

        if (expirationDate != null) {
            daysUntilExpiration = ChronoUnit.DAYS.between(now, expirationDate);
            monthsUntilExpiration = ChronoUnit.MONTHS.between(now, expirationDate);
            yearsUntilExpiration = ChronoUnit.YEARS.between(now, expirationDate);
            isExpired = !now.isBefore(expirationDate); // expired if now >= expirationDate

            out.put("daysUntilExpiration", daysUntilExpiration);
            out.put("monthsUntilExpiration", monthsUntilExpiration);
            out.put("yearsUntilExpiration", yearsUntilExpiration);
            out.put("isExpired", isExpired);

            // Add contextual warnings for expiration
            if (isExpired && remaining > 0) {
                warnings.add(" This product has expired with " + round(remaining, 2) + " units remaining. Consider discarding it.");
            } else if (daysUntilExpiration != null && daysUntilExpiration <= 3 && remaining > 0) {
                warnings.add("URGENT: Only " + daysUntilExpiration + " days until expiration!");
            } else if (daysUntilExpiration != null && daysUntilExpiration <= 7 && remaining > 0) {
                warnings.add("⚡ Expiring soon: " + daysUntilExpiration + " days left.");
            }
        } else {
            warnings.add("No expiration date set. Expiration-related metrics unavailable.");
            out.put("daysUntilExpiration", null);
            out.put("monthsUntilExpiration", null);
            out.put("yearsUntilExpiration", null);
            out.put("isExpired", false);
        }

        // === CONSUMPTION RATE ANALYSIS ===
        Double currentAvgDailyConsumption = null;
        Long daysSincePurchase = null;

        if (purchaseDate != null) {
            daysSincePurchase = ChronoUnit.DAYS.between(purchaseDate, now);

            if (daysSincePurchase < 0) {
                warnings.add("Purchase date is in the future. Cannot calculate consumption rate.");
                out.put("daysSincePurchase", null);
            } else if (daysSincePurchase == 0) {
                // Purchased today - no average yet
                out.put("daysSincePurchase", 0L);
                if (qc > 0) {
                    // Started consuming on purchase day
                    currentAvgDailyConsumption = qc; // Assume current day's consumption
                    out.put("currentAvgDailyConsumption", round(currentAvgDailyConsumption, 6));
                } else {
                    out.put("currentAvgDailyConsumption", null);
                }
            } else {
                // Normal case: calculate average over days since purchase
                out.put("daysSincePurchase", daysSincePurchase);
                currentAvgDailyConsumption = qc / (double) daysSincePurchase;
                out.put("currentAvgDailyConsumption", round(currentAvgDailyConsumption, 6));
            }
        } else {
            warnings.add("No purchase date set. Cannot calculate consumption rate.");
            out.put("daysSincePurchase", null);
            out.put("currentAvgDailyConsumption", null);
        }

        // === SMART RECOMMENDATIONS ===
        Double recommendedDailyToFinish = null;
        Double recommendedMonthlyToFinish = null;

        if (expirationDate != null && !isExpired && remaining > 0) {
            long daysLeft = ChronoUnit.DAYS.between(now, expirationDate);

            if (daysLeft <= 0) {
                // Expired or expiring today
                out.put("recommendedDailyToFinish", null);
                out.put("recommendedMonthlyToFinish", null);
            } else {
                // Calculate what's needed to finish before expiration
                recommendedDailyToFinish = remaining / (double) daysLeft;
                out.put("recommendedDailyToFinish", round(recommendedDailyToFinish, 6));

                // Monthly recommendation only makes sense if we have at least 1 month
                long monthsLeft = ChronoUnit.MONTHS.between(now, expirationDate);
                if (monthsLeft > 0) {
                    recommendedMonthlyToFinish = remaining / (double) monthsLeft;
                    out.put("recommendedMonthlyToFinish", round(recommendedMonthlyToFinish, 6));
                } else {
                    // Less than a month - monthly recommendation doesn't make sense
                    out.put("recommendedMonthlyToFinish", null);
                }

                // === SMART PACE ANALYSIS ===
                if (currentAvgDailyConsumption != null && currentAvgDailyConsumption > 0) {
                    double paceRatio = currentAvgDailyConsumption / recommendedDailyToFinish;

                    if (paceRatio < 0.7) {
                        // Consuming too slowly
                        warnings.add("Current pace (" + round(currentAvgDailyConsumption, 2) + "/day) is below recommended (" +
                                round(recommendedDailyToFinish, 2) + "/day). Increase usage to finish before expiration.");
                    } else if (paceRatio > 1.5) {
                        // Consuming too quickly
                        warnings.add("Current pace (" + round(currentAvgDailyConsumption, 2) + "/day) is faster than needed (" +
                                round(recommendedDailyToFinish, 2) + "/day). You can slow down.");
                    } else {
                        // On track
                        warnings.add("You're on track! Current pace will finish the product before expiration.");
                    }
                } else if (daysSincePurchase != null && daysSincePurchase > 2 && qc == 0) {
                    // Haven't started consuming after multiple days
                    warnings.add("Haven't started consuming yet. Begin using " + round(recommendedDailyToFinish, 2) +
                            " units per day to finish before expiration.");
                }
            }
        } else {
            out.put("recommendedDailyToFinish", null);
            out.put("recommendedMonthlyToFinish", null);
        }

        // === ESTIMATED FINISH DATE ===
        if (currentAvgDailyConsumption != null && currentAvgDailyConsumption > 0 && remaining > 0) {
            long daysToFinish = (long) Math.ceil(remaining / currentAvgDailyConsumption);
            LocalDate estimatedFinish = now.plusDays(daysToFinish);
            out.put("estimatedFinishDate", estimatedFinish.toString());
            out.put("estimatedDaysToFinishFromNow", daysToFinish);

            // Warning if estimated finish is after expiration
            if (expirationDate != null && estimatedFinish.isAfter(expirationDate)) {
                long daysLate = ChronoUnit.DAYS.between(expirationDate, estimatedFinish);
                warnings.add("At current pace, you'll finish " + daysLate + " days AFTER expiration. " +
                        "Increase consumption to finish on time.");
            } else if (expirationDate != null && !isExpired) {
                long daysEarly = ChronoUnit.DAYS.between(estimatedFinish, expirationDate);
                if (daysEarly > 7) {
                    warnings.add("At current pace, you'll finish " + daysEarly + " days before expiration. Well done!");
                }
            }
        } else if (remaining > 0 && currentAvgDailyConsumption != null && currentAvgDailyConsumption == 0) {
            out.put("estimatedFinishDate", null);
            out.put("estimatedDaysToFinishFromNow", null);
        } else {
            out.put("estimatedFinishDate", null);
            out.put("estimatedDaysToFinishFromNow", null);
        }

        // === STATUS DETERMINATION ===
        Status suggested;
        if (remaining <= 0.001) { // Using small epsilon for floating point comparison
            suggested = Status.FINISHED;
        } else if (isExpired) {
            suggested = Status.EXPIRED;
        } else {
            suggested = Status.AVAILABLE;
        }
        out.put("statusSuggestion", suggested.name());

        // === SUMMARY ===
        out.put("summary", buildSummary(qb, qc, remaining, expirationDate, now, suggested, daysUntilExpiration));

        if (!warnings.isEmpty()) {
            out.put("warnings", warnings);
        }

        return out;
    }

    public static Map<String, Object> analyze(Product p) {
        if (p == null) throw new IllegalArgumentException("product must not be null");
        return analyze(p.getQuantityBought(), p.getQuantityConsumed(), p.getPurchaseDate(), p.getExpirationDate());
    }

    // === HELPER METHODS ===

    private static double round(double value, int places) {
        if (Double.isNaN(value) || Double.isInfinite(value)) return value;
        BigDecimal bd = BigDecimal.valueOf(value);
        bd = bd.setScale(places, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }

    private static double clamp(double val, double min, double max) {
        return Math.max(min, Math.min(max, val));
    }

    private static String buildSummary(double qb, double qc, double remaining, LocalDate expirationDate,
                                       LocalDate now, Status suggested, Long daysUntilExpiration) {
        StringBuilder sb = new StringBuilder();

        // Basic quantities
        sb.append("Bought: ").append(round(qb, 2))
                .append(" | Consumed: ").append(round(qc, 2))
                .append(" (").append(round((qc/qb)*100, 1)).append("%)")
                .append(" | Remaining: ").append(round(remaining, 2));

        // Expiration info
        if (expirationDate != null && daysUntilExpiration != null) {
            if (daysUntilExpiration < 0) {
                sb.append(" | Expired ").append(Math.abs(daysUntilExpiration)).append(" days ago");
            } else if (daysUntilExpiration == 0) {
                sb.append(" |  Expires TODAY");
            } else if (daysUntilExpiration <= 3) {
                sb.append(" | Expires in ").append(daysUntilExpiration).append(" days");
            } else if (daysUntilExpiration <= 7) {
                sb.append(" | Expires in ").append(daysUntilExpiration).append(" days");
            } else {
                sb.append(" | Expires in ").append(daysUntilExpiration).append(" days");
            }
        } else {
            sb.append(" | No expiration date");
        }

        // Status
        sb.append(" | Status: ");
        switch (suggested) {
            case FINISHED:
                sb.append("FINISHED");
                break;
            case EXPIRED:
                sb.append("EXPIRED");
                break;
            case AVAILABLE:
                sb.append("AVAILABLE");
                break;
        }

        return sb.toString();
    }
}