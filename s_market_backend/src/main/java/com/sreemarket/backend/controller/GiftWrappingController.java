package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.GiftWrapping;
import com.sreemarket.backend.repository.GiftWrappingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class GiftWrappingController {

    @Autowired
    private GiftWrappingRepository giftWrappingRepository;

    @GetMapping("/gift-wrapping/options")
    public ResponseEntity<List<GiftWrapping>> getActiveOptions() {
        return ResponseEntity.ok(giftWrappingRepository.findByActiveTrue());
    }

    @GetMapping("/admin/gift-wrapping")
    public ResponseEntity<List<GiftWrapping>> getAllOptions() {
        return ResponseEntity.ok(giftWrappingRepository.findAll());
    }

    @PostMapping("/admin/gift-wrapping")
    public ResponseEntity<GiftWrapping> createOption(@RequestBody GiftWrapping option) {
        return ResponseEntity.ok(giftWrappingRepository.save(option));
    }

    @DeleteMapping("/admin/gift-wrapping/{id}")
    public ResponseEntity<Void> deleteOption(@PathVariable Long id) {
        giftWrappingRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
