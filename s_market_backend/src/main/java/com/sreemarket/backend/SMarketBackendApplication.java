package com.sreemarket.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SMarketBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(SMarketBackendApplication.class, args);
	}

}
