package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.User;
import com.sreemarket.backend.model.Vendor;
import com.sreemarket.backend.model.VendorKYC;
import com.sreemarket.backend.repository.VendorRepository;
import com.sreemarket.backend.repository.VendorKYCRepository;
import com.sreemarket.backend.service.UserService;
import com.sreemarket.backend.service.VendorService;
import com.sreemarket.backend.service.UserDeviceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import com.fasterxml.jackson.databind.ObjectMapper;

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

    @Autowired
    private VendorKYCRepository vendorKYCRepository;

    @Autowired
    private UserDeviceService userDeviceService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            // Prevent privilege escalation - force customer role on registration
            user.setRoleId(2L);
            if (user.getStatus() == null) user.setStatus("Active");
            User registeredUser = userService.registerUser(user);
            return ResponseEntity
                    .ok(Map.of("message", "User registered successfully", "userId", registeredUser.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register/vendor")
    public ResponseEntity<?> registerVendor(@RequestBody Map<String, Object> body) {
        try {
            // Map the body to Vendor
            ObjectMapper mapper = new ObjectMapper();
            Vendor vendor = mapper.convertValue(body, Vendor.class);

            // Enforce vendor role and pending status
            vendor.setRoleId(3L);
            if (vendor.getStatus() == null) vendor.setStatus("Pending");

            // Extract PAN and GST from body or from payment-specific fields
            String pan = body.get("pan") != null ? (String) body.get("pan") : null;
            String gst = body.get("gst") != null ? (String) body.get("gst") : null;
            String paymentMethod = body.get("paymentMethod") != null ? (String) body.get("paymentMethod") : "";

            // If PAN not provided at top level, extract from payment fields
            if (pan == null || pan.isEmpty()) {
                if ("upi".equals(paymentMethod)) {
                    pan = body.get("panNumberUpi") != null ? (String) body.get("panNumberUpi") : null;
                } else if ("paypal".equals(paymentMethod)) {
                    pan = body.get("panNumberPaypal") != null ? (String) body.get("panNumberPaypal") : null;
                }
            }
            if (pan != null && !pan.isEmpty()) {
                vendor.setPan(pan);
            }

            Vendor registeredVendor = vendorService.registerVendor(vendor);

            // ── Auto-create KYC record with all provided details ──
            try {
                VendorKYC kyc = new VendorKYC();
                kyc.setVendorId(registeredVendor.getId());
                kyc.setVendorName(registeredVendor.getFullName());

                // Store actual PAN value
                String actualPan = registeredVendor.getPan();
                kyc.setPan((actualPan != null && !actualPan.isEmpty()) ? actualPan : "Not Started");

                // Store actual GST value
                String actualGst = (gst != null && !gst.isEmpty()) ? gst : null;
                kyc.setGst(actualGst != null ? actualGst : "Not Started");

                // Store actual Aadhaar value  
                String aadhaar = body.get("aadhaar") != null ? (String) body.get("aadhaar") : null;
                kyc.setAadhaar((aadhaar != null && !aadhaar.isEmpty()) ? aadhaar.replaceAll("\\s", "") : "Not Started");

                kyc.setAddress("Not Started");
                kyc.setSelfie("Not Started");
                kyc.setOverall("Pending");

                // Store payment details as structured individual fields
                kyc.setPaymentMethod(paymentMethod);
                kyc.setBeneficiaryName(body.get("beneficiaryName") != null ? (String) body.get("beneficiaryName") : null);
                kyc.setAccountNumber(body.get("bankAccountNumber") != null ? (String) body.get("bankAccountNumber") : null);
                kyc.setIfscCode(body.get("ifscCode") != null ? (String) body.get("ifscCode") : null);
                kyc.setUpiId(body.get("upiId") != null ? (String) body.get("upiId") : null);
                kyc.setPaypalEmail(body.get("paypalEmail") != null ? (String) body.get("paypalEmail") : null);
                kyc.setBankName(body.get("verifiedUpiBankName") != null ? (String) body.get("verifiedUpiBankName") : null);
                kyc.setPanNumber(pan);
                kyc.setRemittanceEmail(body.get("remittanceEmail") != null ? (String) body.get("remittanceEmail") :
                    body.get("remittanceEmailUpi") != null ? (String) body.get("remittanceEmailUpi") : null);

                // Also build pipe-delimited bank field for backward compatibility
                StringBuilder bankDetails = new StringBuilder("Pending||");
                bankDetails.append(paymentMethod != null ? paymentMethod : "").append("||");

                if ("bank".equals(paymentMethod)) {
                    bankDetails.append(
                        nullToDash(kyc.getBeneficiaryName()) + "||" +
                        nullToDash(kyc.getAccountNumber()) + "||" +
                        nullToDash(body.get("accountType"), "Savings") + "||" +
                        nullToDash(kyc.getIfscCode()) + "||" +
                        nullToDash(kyc.getRemittanceEmail()) + "||"
                    );
                } else if ("upi".equals(paymentMethod)) {
                    bankDetails.append(
                        nullToDash(kyc.getUpiId()) + "||" +
                        nullToDash(kyc.getBankName()) + "||" +
                        nullToDash(kyc.getPanNumber()) + "||" +
                        nullToDash(kyc.getRemittanceEmail()) + "||" +
                        "-||"
                    );
                } else if ("paypal".equals(paymentMethod)) {
                    bankDetails.append(
                        nullToDash(kyc.getPaypalEmail()) + "||" +
                        nullToDash(body.get("paypalLegalName")) + "||" +
                        nullToDash(kyc.getPanNumber()) + "||" +
                        nullToDash(body.get("purposeCode")) + "||" +
                        "-||"
                    );
                } else {
                    bankDetails.append("-||-||-||-||-||");
                }

                kyc.setBank(bankDetails.toString());
                kyc.setUpdated(LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy")));
                vendorKYCRepository.save(kyc);
            } catch (Exception e) {
                // KYC creation is best-effort; don't fail registration
                System.err.println("KYC auto-creation failed: " + e.getMessage());
            }

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

                if ("Pending".equalsIgnoreCase(vendor.getStatus())) {
                    throw new RuntimeException("Your vendor account is pending approval. Please wait for admin to approve your application.");
                }
                if ("Rejected".equalsIgnoreCase(vendor.getStatus())) {
                    throw new RuntimeException("Your vendor account application has been rejected. Please contact administrator.");
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
                request.getSession().setAttribute("userId", vendor.getId());

                userDeviceService.saveDevice(vendor.getId(), vendor.getRoleId(), request);

                // Fetch KYC record
                VendorKYC kyc = vendorKYCRepository.findByVendorId(vendor.getId()).orElse(null);
                String kycStatus = kyc != null ? kyc.getOverall() : "Not Started";

                Map<String, Object> vendorResp = new HashMap<>();
                vendorResp.put("message", "Login successful");
                vendorResp.put("userId", vendor.getId());
                vendorResp.put("fullName", vendor.getFullName());
                vendorResp.put("email", vendor.getEmail());
                vendorResp.put("phone", vendor.getPhone());
                vendorResp.put("roleId", vendor.getRoleId());
                vendorResp.put("status", vendor.getStatus());
                vendorResp.put("kycStatus", kycStatus);
                vendorResp.put("tier", vendor.getTier());
                vendorResp.put("paymentMethod", vendor.getPaymentMethod());
                vendorResp.put("rating", vendor.getRating());
                vendorResp.put("orderCount", vendor.getOrderCount());
                vendorResp.put("totalRevenue", vendor.getTotalRevenue());
                vendorResp.put("pan", vendor.getPan());
                vendorResp.put("gst", vendor.getGst());
                vendorResp.put("stores", vendor.getStores());
                return ResponseEntity.ok(vendorResp);

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
                request.getSession().setAttribute("userId", user.getId());

                userDeviceService.saveDevice(user.getId(), user.getRoleId(), request);

                Map<String, Object> userResp = new HashMap<>();
                userResp.put("message", "Login successful");
                userResp.put("userId", user.getId());
                userResp.put("fullName", user.getFullName());
                userResp.put("roleId", user.getRoleId());
                return ResponseEntity.ok(userResp);
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

            userDeviceService.saveDevice(user.getId(), user.getRoleId(), request);

            Map<String, Object> googleResp = new HashMap<>();
            googleResp.put("message", "Google Login successful");
            googleResp.put("userId", user.getId());
            googleResp.put("fullName", user.getFullName());
            googleResp.put("roleId", user.getRoleId());
            return ResponseEntity.ok(googleResp);
        } catch (RuntimeException e) {
            Map<String, Object> googleErr = new HashMap<>();
            googleErr.put("error", e.getMessage() != null ? e.getMessage() : "Google login failed");
            return ResponseEntity.badRequest().body(googleErr);
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

    private String nullToDash(Object value) {
        return value != null ? value.toString() : "-";
    }

    private String nullToDash(Object value, String defaultValue) {
        return value != null ? value.toString() : defaultValue;
    }
}
