package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Wholesaler;
import com.sreemarket.backend.service.WholesalerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class WholesalerAuthController {

    @Autowired
    private WholesalerService wholesalerService;

    @PostMapping("/register/wholesaler")
    public ResponseEntity<?> registerWholesaler(@RequestBody Wholesaler wholesaler) {
        try {
            wholesaler.setRoleId(4L);
            if (wholesaler.getStatus() == null) wholesaler.setStatus("Pending");
            Wholesaler registered = wholesalerService.registerWholesaler(wholesaler);
            return ResponseEntity.ok(Map.of(
                "message", "Wholesaler registration submitted for approval",
                "wholesalerId", registered.getId()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login/wholesaler")
    public ResponseEntity<?> loginWholesaler(@RequestBody Map<String, String> loginRequest, HttpServletRequest request) {
        try {
            String email = loginRequest.get("email");
            String password = loginRequest.get("password");

            Wholesaler wholesaler = wholesalerService.loginWholesaler(email, password);

            List<GrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new SimpleGrantedAuthority("ROLE_WHOLESALER"));

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    wholesaler.getEmail(), null, authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);
            request.getSession().setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
            request.getSession().setAttribute("userId", wholesaler.getId());

            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Login successful");
            resp.put("userId", wholesaler.getId());
            resp.put("fullName", wholesaler.getFullName());
            resp.put("email", wholesaler.getEmail());
            resp.put("phone", wholesaler.getPhone());
            resp.put("roleId", wholesaler.getRoleId());
            resp.put("status", wholesaler.getStatus());
            resp.put("businessName", wholesaler.getBusinessName());
            resp.put("gstNumber", wholesaler.getGstNumber());
            resp.put("businessAddress", wholesaler.getBusinessAddress());
            resp.put("businessPhone", wholesaler.getBusinessPhone());
            resp.put("businessType", wholesaler.getBusinessType());
            return ResponseEntity.ok(resp);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
