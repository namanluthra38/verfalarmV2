package com.verf.ProdExp;

import io.mailtrap.client.MailtrapClient;
import io.mailtrap.config.MailtrapConfig;
import io.mailtrap.factory.MailtrapClientFactory;
import io.mailtrap.model.request.emails.Address;
import io.mailtrap.model.request.emails.MailtrapMail;

import java.util.List;

public class MailTrapJavaSDKTest {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(MailTrapJavaSDKTest.class);
    private static final String TOKEN = "ded30c614d693193664962ba0cac6a4a";

    public static void main(String[] args) {
        final MailtrapConfig config = new MailtrapConfig.Builder()
                .token(TOKEN)
                .build();

        final MailtrapClient client = MailtrapClientFactory.createMailtrapClient(config);

        final MailtrapMail mail = MailtrapMail.builder()
                .from(new Address("hello@demomailtrap.co", "Mailtrap Test"))
                .to(List.of(new Address("namanluthra70@gmail.com")))
                .subject("You are awesome!")
                .text("Congrats for sending test email with Mailtrap!")
                .html("<h1>Hey!</h1><p>Thanks for sending test email with Mailtrap!</p>")
                .category("Integration Test")
                .build();

        try {
            log.info("Mailtrap send response: {}", client.send(mail));
        } catch (Exception e) {
            log.error("Mailtrap send failed", e);
        }
    }
}