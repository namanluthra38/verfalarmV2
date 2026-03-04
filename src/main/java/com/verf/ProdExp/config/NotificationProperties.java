package com.verf.ProdExp.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.ZoneId;
import java.time.ZoneOffset;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.notifications")
public class NotificationProperties {
    private boolean enabled = true;
    private String cron = "0 0 * * * *";
    private String timezone = "UTC";
    private int batchSize = 200;

    public ZoneId zoneId() {
        try {
            return ZoneId.of(timezone);
        } catch (Exception ignored) {
            return ZoneOffset.UTC;
        }
    }
}

