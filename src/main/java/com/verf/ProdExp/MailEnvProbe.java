package com.verf.ProdExp;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class MailEnvProbe {

    public MailEnvProbe(Environment env) {
        System.out.println("MAIL_USERNAME = " + env.getProperty("MAIL_USERNAME"));
        System.out.println("MAIL_PASSWORD = " + env.getProperty("MAIL_PASSWORD"));
        System.out.println("spring.mail.host = " + env.getProperty("spring.mail.host"));
        System.out.println("spring.mail.port = " + env.getProperty("spring.mail.port"));
    }
}

