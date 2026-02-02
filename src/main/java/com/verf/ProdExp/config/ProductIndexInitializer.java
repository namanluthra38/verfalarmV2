package com.verf.ProdExp.config;

import com.verf.ProdExp.entity.Product;
import com.verf.ProdExp.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class ProductIndexInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(ProductIndexInitializer.class);

    private final ProductRepository repository;

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking products for missing nameLower field to backfill...");
        List<Product> all = repository.findAll();
        List<Product> toSave = new ArrayList<>();
        for (Product p : all) {
            if (p.getName() != null) {
                String nl = p.getName().toLowerCase().trim();
                if (p.getNameLower() == null || !p.getNameLower().equals(nl)) {
                    p.setNameLower(nl);
                    toSave.add(p);
                }
            }
        }
        if (!toSave.isEmpty()) {
            repository.saveAll(toSave);
            log.info("Backfilled nameLower for {} products", toSave.size());
        } else {
            log.info("No backfill needed for nameLower");
        }
    }
}

