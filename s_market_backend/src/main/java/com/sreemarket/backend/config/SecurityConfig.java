package com.sreemarket.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.session.SessionRegistryImpl;
import org.springframework.security.web.session.HttpSessionEventPublisher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

import org.springframework.security.config.Customizer;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                        .maximumSessions(1)
                        .sessionRegistry(sessionRegistry()))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(unauthorizedEntryPoint()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/register", "/api/register/vendor", "/api/register/wholesaler",
                                "/api/login", "/api/login/wholesaler", "/api/google",
                                "/api/forgot-password",
                                "/api/reset-password", "/api/logout", "/api/settings", "/uploads/**",
                                "/api/contact", "/api/newsletter/subscribe")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/payment/create-order").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/payment/verify").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/payment/config").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/payment/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/wooai/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/wooai/session").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/wooai/session/*/message").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/wooai/session/*").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/wooai/session/*/end").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/wooai/callbacks").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/orders/track/*", "/api/orders/lookup/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/admin/categories", "/api/admin/categories/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/admin/refunds/process").hasRole("ADMIN")
                        .requestMatchers("/api/admin/refunds/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/payout-processing/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/vendors/payouts/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/payout-schedules/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/shipping-zones/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/announcements/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/bulk-stock/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/maintenance/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/vendors/**").permitAll()
                        .requestMatchers("/api/vendors/**").hasRole("ADMIN")
                        .requestMatchers("/api/vendor/**").hasRole("VENDOR")
                        .requestMatchers("/api/wholesaler/**").hasRole("WHOLESALER")
                        .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/testimonials/active").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tax-rates/public").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/currencies/public").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/currencies/public/default").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/currencies/convert").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/admin/marketplace-fees/calculate").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/homepage-sections").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/instagram/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/orders/*/cancel").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/orders").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/orders/*/invoice").authenticated()
                        .requestMatchers("/api/orders/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/products/*/questions").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/products/*/questions").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/sitemap.xml", "/api/robots.txt").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/announcements/active").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/announcements/audience/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/admin/shipping-zones/active").permitAll()
                        .requestMatchers("/api/shipping/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/product-bundles/active").permitAll()
                        .requestMatchers("/api/payment-methods/**").authenticated()
                        .requestMatchers("/api/recently-viewed/**").authenticated()
                        .requestMatchers("/api/back-in-stock/**").authenticated()
                        .requestMatchers("/api/price-drop-alerts/**").authenticated()
                        .requestMatchers("/api/gift-cards/**").authenticated()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().denyAll());
        return http.build();
    }

    @Bean
    public AuthenticationEntryPoint unauthorizedEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Unauthorized - Please log in\"}");
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(
                Arrays.asList(
                    "http://localhost:5173", "http://localhost:5174",
                    "https://localhost:5173", "https://localhost:5174",
                    "http://127.0.0.1:5173", "http://127.0.0.1:5174",
                    "https://127.0.0.1:5173", "https://127.0.0.1:5174",
                    "http://localhost:3000", "https://localhost:3000",
                    "http://localhost:4173", "https://localhost:4173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SessionRegistry sessionRegistry() {
        return new SessionRegistryImpl();
    }

    @Bean
    public HttpSessionEventPublisher httpSessionEventPublisher() {
        return new HttpSessionEventPublisher();
    }
}
