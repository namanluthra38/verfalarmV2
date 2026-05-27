package com.verf.ProdExp.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.ZoneId;
import java.time.ZoneOffset;

/*
 *This is a Spring Boot configuration binding class
 * It maps the YAML properties to the fields of this class
 * for easy use.
*/

@Getter
@Setter
@ConfigurationProperties(prefix = "app.notifications")
public class NotificationProperties {

    /*
        * Variables are initialized with fallback values, yaml can override them.
    */
    private boolean enabled = true;
    private String cron = "0 0 * * * *";
    private String timezone = "UTC";
    private int batchSize = 200;

    /*
    * timezone is a String, but we want to use it as a ZoneId
    */
    public ZoneId zoneId() {
        try {
            return ZoneId.of(timezone);
        } catch (Exception ignored) {
            return ZoneOffset.UTC;
        }
    }
}

