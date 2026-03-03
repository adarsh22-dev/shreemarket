package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.User;
import com.sreemarket.backend.model.Vendor;
import com.sreemarket.backend.repository.VendorRepository;
import com.sreemarket.backend.service.UserService;
import com.sreemarket.backend.service.VendorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private VendorRepository vendorRepository;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            User registeredUser = userService.registerUser(user);
            return ResponseEntity
                    .ok(Map.of("message", "User registered successfully", "userId", registeredUser.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register/vendor")
    public ResponseEntity<?> registerVendor(@RequestBody Vendor vendor) {
        try {
            Vendor registeredVendor = vendorService.registerVendor(vendor);
            return ResponseEntity
                    .ok(Map.of("message", "Vendor registered successfully", "vendorId", registeredVendor.getId()));
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Vendor registration failed.";
            return ResponseEntity.badRequest().body(Map.of("error", "Registration Error", "message", msg));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, Object> loginRequest, HttpServletRequest request) {
        try {
            String email = (String) loginRequest.get("email");
            String password = (String) loginRequest.get("password");

            // Check if the frontend explicitly requested a Vendor login context
            boolean isVendorLogin = false;
            if (loginRequest.containsKey("isVendorLogin")) {
                Object val = loginRequest.get("isVendorLogin");
                if (val instanceof Boolean) {
                    isVendorLogin = ((Boolean) val).booleanValue();
                } else if (val instanceof String) {
                    isVendorLogin = Boolean.parseBoolean((String) val);
                }
            }

            if (isVendorLogin) {
                // EXPLICIT VENDOR LOGIN FLOW - searches only the vendors table
                if (!vendorRepository.existsByEmail(email)) {
                    throw new RuntimeException("Vendor account not found.");
                }

                com.sreemarket.backend.model.Vendor vendor = vendorRepository.findByEmail(email).get();
                if (!new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().matches(password,
                        vendor.getPassword())) {
                    throw new RuntimeException("Invalid password");
                }

                if ("Inactive".equalsIgnoreCase(vendor.getStatus())) {
                    throw new RuntimeException("Account is inactive. Please contact administrator.");
                }

                List<GrantedAuthority> authorities = new ArrayList<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_VENDOR"));

                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(vendor.getEmail(),
                        null,
                        authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
                request.getSession().setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

                return ResponseEntity
                        .ok(Map.of("message", "Login successful", "userId", vendor.getId(), "fullName",
                                vendor.getFullName(),
                                "roleId", vendor.getRoleId()));

            } else {
                // EXPLICIT CUSTOMER/ADMIN LOGIN FLOW - searches only the users table
                User user = userService.loginUser(email, password);

                if ("Inactive".equalsIgnoreCase(user.getStatus())) {
                    throw new RuntimeException("Account is inactive. Please contact administrator.");
                }

                List<GrantedAuthority> authorities = new ArrayList<>();
                if (user.getRoleId() != null) {
                    if (user.getRoleId() == 1L) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                    } else if (user.getRoleId() == 3L) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_VENDOR"));
                    } else {
                        authorities.add(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
                    }
                } else {
                    authorities.add(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
                }

                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(user.getEmail(),
                        null,
                        authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
                request.getSession().setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

                return ResponseEntity
                        .ok(Map.of("message", "Login successful", "userId", user.getId(), "fullName",
                                user.getFullName(),
                                "roleId", user.getRoleId()));
            }

        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Login failed. Please check your credentials.";
            return ResponseEntity.badRequest().body(Map.of("error", "Login Error", "message", msg));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        try {
            boolean isVendorLogin = false;
            if (payload.containsKey("isVendorLogin")) {
                Object val = payload.get("isVendorLogin");
                if (val instanceof Boolean) {
                    isVendorLogin = ((Boolean) val).booleanValue();
                } else if (val instanceof String) {
                    isVendorLogin = Boolean.parseBoolean((String) val);
                }
            }

            if (isVendorLogin) {
                throw new RuntimeException(
                        "Google Sign-in is not supported for Vendor accounts. Please use the standard login form.");
            }

            String token = (String) payload.get("token");
            User user = userService.loginOrRegisterGoogleUser(token);

            List<GrantedAuthority> authorities = new ArrayList<>();
            if (user.getRoleId() != null) {
                if (user.getRoleId() == 1L) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                } else if (user.getRoleId() == 3L) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_VENDOR"));
                } else {
                    authorities.add(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
                }
            } else {
                authorities.add(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
            }

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(user.getEmail(), null,
                    authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);
            request.getSession().setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

            return ResponseEntity
                    .ok(Map.of("message", "Google Login successful", "userId", user.getId(), "fullName",
                            user.getFullName(), "roleId", user.getRoleId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> payload) {
        try {
            String email = payload.get("email");
            userService.generateResetToken(email);
            return ResponseEntity.ok(Map.of("message", "Reset link sent"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(HttpServletRequest request) {
        request.getSession().invalidate();
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        try {
            String token = payload.get("token");
            String newPassword = payload.get("password");
            userService.resetPassword(token, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
