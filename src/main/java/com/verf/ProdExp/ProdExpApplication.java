package com.verf.ProdExp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class ProdExpApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProdExpApplication.class, args);
	}

}
