package com.sreemarket.backend.controller;

import com.sreemarket.backend.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UploadController {

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping("/logo")
    public ResponseEntity<?> uploadLogo(@RequestParam("file") MultipartFile file) {
        try {
            String fileUrl = fileStorageService.storeFile(file, "store-logos");
            return ResponseEntity.ok(Map.of(
                    "message", "Logo uploaded successfully",
                    "url", fileUrl));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
