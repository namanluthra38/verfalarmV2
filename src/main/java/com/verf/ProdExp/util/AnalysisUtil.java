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
     * Returned map contains keys:
     * - remainingQuantity (Double)
     * - percentConsumed (Double 0-100)
     * - percentRemaining (Double 0-100)
     * - daysUntilExpiration (Long) -- null if expirationDate null
     * - monthsUntilExpiration (Long) -- null if expirationDate null
     * - yearsUntilExpiration (Long) -- null if expirationDate null
     * - isExpired (Boolean)
     * - recommendedDailyToFinish (Double) -- null if cannot compute
     * - recommendedMonthlyToFinish (Double) -- null if cannot compute
     * - currentAvgDailyConsumption (Double) -- null if cannot compute
     * - estimatedFinishDate (String ISO-8601) -- null if cannot compute
     * - statusSuggestion (String)
     * - warnings (List<String>)
     *
     * This method validates inputs and throws IllegalArgumentException for clearly invalid mandatory values
     * (for example: null or non-positive quantityBought). For softer problems (missing dates), it returns
     * computed values where possible and populates warnings.
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

        if (qc < 0d) {
            warnings.add("quantityConsumed is negative; treating as 0 for calculations");
            qc = 0d;
        }

        double remaining = qb - qc;
        if (remaining < 0d) {
            warnings.add("quantityConsumed exceeds quantityBought; remaining reported as 0 and status may be FINISHED");
            remaining = 0d;
        }

        out.put("remainingQuantity", round(remaining, 4));

        double percentConsumed = qb == 0 ? 0d : (qc / qb) * 100d;
        percentConsumed = clamp(percentConsumed, 0d, 100d);
        out.put("percentConsumed", round(percentConsumed, 2));
        out.put("percentRemaining", round(100d - percentConsumed, 2));

        LocalDate now = LocalDate.now();

        // Expiration related
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
        } else {
            warnings.add("expirationDate is null; expiration-related metrics are unavailable");
            out.put("daysUntilExpiration", null);
            out.put("monthsUntilExpiration", null);
            out.put("yearsUntilExpiration", null);
            out.put("isExpired", false);
        }

        // Current average consumption per day
        Double currentAvgDailyConsumption = null;
        if (purchaseDate != null) {
            long daysSincePurchase = ChronoUnit.DAYS.between(purchaseDate, now) + 1;
            if (daysSincePurchase <= 0) {
                // If purchased today, we can't compute average yet
                warnings.add("purchaseDate is today or in the future; average daily consumption is unavailable");
            } else {
                currentAvgDailyConsumption = qc / (double) daysSincePurchase;
                out.put("currentAvgDailyConsumption", round(currentAvgDailyConsumption, 6));
                out.put("daysSincePurchase", daysSincePurchase);
            }
        } else {
            warnings.add("purchaseDate is null; cannot compute average consumption");
        }

        // Recommended consumption to finish before expiration
        Double recommendedDailyToFinish = null;
        Double recommendedMonthlyToFinish = null;
        if (expirationDate != null) {
            long daysLeft = ChronoUnit.DAYS.between(now, expirationDate);
            if (daysLeft <= 0) {
                // already expired
                recommendedDailyToFinish = null;
                recommendedMonthlyToFinish = null;
            } else {
                recommendedDailyToFinish = remaining / (double) daysLeft;
                recommendedMonthlyToFinish = (remaining / (double) Math.max(1, ChronoUnit.MONTHS.between(now, expirationDate)));
                out.put("recommendedDailyToFinish", round(recommendedDailyToFinish, 6));
                out.put("recommendedMonthlyToFinish", round(recommendedMonthlyToFinish, 6));
            }
        } else {
            out.put("recommendedDailyToFinish", null);
            out.put("recommendedMonthlyToFinish", null);
        }

        // Estimated finish date based on currentAvgDailyConsumption
        if (currentAvgDailyConsumption != null && currentAvgDailyConsumption > 0d) {
            long daysToFinish = (long) Math.ceil(remaining / currentAvgDailyConsumption);
            LocalDate estimatedFinish = now.plusDays(daysToFinish);
            out.put("estimatedFinishDate", estimatedFinish.toString());
            out.put("estimatedDaysToFinishFromNow", daysToFinish);
        } else {
            out.put("estimatedFinishDate", null);
            out.put("estimatedDaysToFinishFromNow", null);
        }

        // Status suggestion using Status enum logic
        Status suggested;
        if (remaining <= 0d && (expirationDate == null || !isExpired)) {
            suggested = Status.FINISHED;
        } else if (isExpired) {
            suggested = Status.EXPIRED;
        } else {
            suggested = Status.AVAILABLE;
        }
        out.put("statusSuggestion", suggested.name());

        // Helpful summary strings
        out.put("summary", buildSummary(qb, qc, remaining, expirationDate, now, suggested));

        if (!warnings.isEmpty()) out.put("warnings", warnings);

        return out;
    }

    public static Map<String, Object> analyze(Product p) {
        if (p == null) throw new IllegalArgumentException("product must not be null");
        return analyze(p.getQuantityBought(), p.getQuantityConsumed(), p.getPurchaseDate(), p.getExpirationDate());
    }

    // small helpers
    private static double round(double value, int places) {
        if (Double.isNaN(value) || Double.isInfinite(value)) return value;
        BigDecimal bd = BigDecimal.valueOf(value);
        bd = bd.setScale(places, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }

    private static double clamp(double val, double min, double max) {
        return Math.max(min, Math.min(max, val));
    }

    private static String buildSummary(double qb, double qc, double remaining, LocalDate expirationDate, LocalDate now, Status suggested) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bought: ").append(qb).append(" | Consumed: ").append(qc).append(" | Remaining: ").append(round(remaining,4));
        if (expirationDate != null) {
            long daysLeft = ChronoUnit.DAYS.between(now, expirationDate);
            sb.append(" | Days until expiry: ").append(daysLeft);
        } else {
            sb.append(" | No expiration date");
        }
        sb.append(" | Suggested status: ").append(suggested.name());
        return sb.toString();
    }

}
