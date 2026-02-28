package com.sreemarket.backend.config;

import com.sreemarket.backend.model.Role;
import com.sreemarket.backend.model.User;
import com.sreemarket.backend.repository.RoleRepository;
import com.sreemarket.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(RoleRepository roleRepository, UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // Initialize Roles
            if (roleRepository.count() == 0) {
                // ID 1: ADMIN
                Role admin = new Role();
                admin.setName("ADMIN");
                roleRepository.save(admin);

                // ID 2: CUSTOMER
                Role customer = new Role();
                customer.setName("CUSTOMER");
                roleRepository.save(customer);

                System.out.println("Default roles initialized: ADMIN (1), CUSTOMER (2)");
            }

            // Initialize Admin User
            if (!userRepository.existsByEmail("admin@smarket.com")) {
                User admin = new User();
                admin.setFullName("Admin");
                admin.setEmail("admin@smarket.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRoleId(1L); // ADMIN role
                admin.setCreatedAt(System.currentTimeMillis());
                // Phone is null by default

                userRepository.save(admin);
                System.out.println("Default Admin User created: admin@smarket.com / admin123");
            }
        };
    }
}
