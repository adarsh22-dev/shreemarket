package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Wholesaler;
import com.sreemarket.backend.service.WholesalerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping(value = "/register/wholesaler", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registerWholesaler(
            @RequestParam("fullName") String fullName,
            @RequestParam("email") String email,
            @RequestParam("phone") String phone,
            @RequestParam("password") String password,
            @RequestParam("businessName") String businessName,
            @RequestParam("gstNumber") String gstNumber,
            @RequestParam("businessAddress") String businessAddress,
            @RequestParam("businessPhone") String businessPhone,
            @RequestParam("businessType") String businessType,
            @RequestParam(value = "agreeTerms", defaultValue = "false") boolean agreeTerms,
            @RequestParam(value = "agreePolicies", defaultValue = "false") boolean agreePolicies,
            @RequestParam(value = "gstCertificate", required = false) MultipartFile gstCertificate,
            @RequestParam(value = "businessProof", required = false) MultipartFile businessProof,
            @RequestParam(value = "addressProof", required = false) MultipartFile addressProof) {
        try {
            Wholesaler wholesaler = new Wholesaler();
            wholesaler.setFullName(fullName);
            wholesaler.setEmail(email);
            wholesaler.setPhone(phone);
            wholesaler.setPassword(password);
            wholesaler.setBusinessName(businessName);
            wholesaler.setGstNumber(gstNumber);
            wholesaler.setBusinessAddress(businessAddress);
            wholesaler.setBusinessPhone(businessPhone);
            wholesaler.setBusinessType(businessType);
            wholesaler.setAgreeTerms(agreeTerms);
            wholesaler.setAgreePolicies(agreePolicies);
            wholesaler.setRoleId(4L);
            wholesaler.setStatus("Pending");
            Wholesaler registered = wholesalerService.registerWholesaler(wholesaler, gstCertificate, businessProof, addressProof);
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
