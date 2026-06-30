package com.sreemarket.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreemarket.backend.model.User;
import com.sreemarket.backend.repository.UserRepository;
import com.sreemarket.backend.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api")
public class SettingsController {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    private final ObjectMapper mapper = new ObjectMapper();

    private File getSettingsFile() {
        return new File(Paths.get(uploadDir, "settings.json").toAbsolutePath().normalize().toString());
    }

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private UserRepository userRepository;

    private Map<String, Object> readSettings() {
        try {
            File f = getSettingsFile();
            if (f.exists()) {
                return mapper.readValue(f, new TypeReference<Map<String, Object>>() {});
            }
        } catch (IOException e) {
            // fall through to defaults
        }
        return getDefaults();
    }

    private Map<String, Object> getDefaults() {
        Map<String, Object> defaults = new HashMap<>();
        Map<String, Object> instagram = new HashMap<>();
        instagram.put("homePageEnabled", true);
        instagram.put("homePageMaxPosts", 3);
        instagram.put("homePageTitle", "Real-Life Looks");
        instagram.put("productPageEnabled", true);
        instagram.put("productPageLayout", "slider");
        instagram.put("storyShape", "circle");
        defaults.put("instagram", instagram);
        return defaults;
    }

    @GetMapping("/settings")
    public ResponseEntity<?> getSettings() {
        try {
            Map<String, Object> settings = readSettings();
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            return ResponseEntity.ok(getDefaults());
        }
    }

    @PutMapping("/admin/settings")
    public ResponseEntity<?> updateSettings(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        try {
            File f = getSettingsFile();
            f.getParentFile().mkdirs();
            mapper.writerWithDefaultPrettyPrinter().writeValue(f, body);

            // Log audit
            try {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated()) {
                    String email = auth.getName();
                    String adminName = email;
                    Long adminId = null;
                    User admin = userRepository.findByEmail(email).orElse(null);
                    if (admin != null) {
                        adminName = admin.getFullName();
                        adminId = admin.getId();
                    }
                    String ip = request.getHeader("X-Forwarded-For");
                    if (ip == null || ip.isEmpty()) ip = request.getRemoteAddr();
                    auditLogService.logActivity(adminId, adminName, "Updated platform settings",
                            "Settings", ip, "low", "Settings were updated via the admin panel");
                }
            } catch (Exception ignored) {}

            return ResponseEntity.ok(Map.of("message", "Settings saved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
