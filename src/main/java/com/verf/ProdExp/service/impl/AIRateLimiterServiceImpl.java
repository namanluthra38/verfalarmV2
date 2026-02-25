package com.verf.ProdExp.service.impl;

import com.verf.ProdExp.service.AIRateLimiterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.concurrent.TimeUnit;

@Service
public class AIRateLimiterServiceImpl implements AIRateLimiterService {
    private final StringRedisTemplate redis;
    private static final long DAILY_LIMIT = 5; // keep in sync with controller messaging

    @Autowired
    public AIRateLimiterServiceImpl(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    public boolean allowRequest(String userId) {
        if (userId == null || userId.isBlank()) return false;
        String key = buildKey(userId);

        Long counter = redis.opsForValue().increment(key);
        if (counter == null) {
            return false;
        }

        if (counter == 1) {
            long secondsUntilMidnight = secondsUntilNextMidnight();
            redis.expire(key, secondsUntilMidnight, TimeUnit.SECONDS);
        }

        return counter <= DAILY_LIMIT;
    }

    @Override
    public long getRemaining(String userId) {
        if (userId == null || userId.isBlank()) return 0L;
        String key = buildKey(userId);
        String val = redis.opsForValue().get(key);
        if (val == null) return DAILY_LIMIT;
        try {
            long used = Long.parseLong(val);
            long rem = DAILY_LIMIT - used;
            return Math.max(rem, 0L);
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    private String buildKey(String userId) {
        String today = LocalDate.now(ZoneId.systemDefault()).toString(); // yyyy-MM-dd
        return String.format("rate_limit:ai:%s:%s", userId, today);
    }

    private long secondsUntilNextMidnight() {
        ZoneId zone = ZoneId.systemDefault();
        ZonedDateTime now = ZonedDateTime.now(zone);
        ZonedDateTime nextMidnight = now.plusDays(1).toLocalDate().atStartOfDay(zone);
        Duration d = Duration.between(now, nextMidnight);
        long secs = d.getSeconds();
        return Math.max(secs, 1);
    }
}

