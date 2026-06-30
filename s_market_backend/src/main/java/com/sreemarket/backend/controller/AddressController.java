package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Address;
import com.sreemarket.backend.service.AddressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/addresses")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true") // Allow local React frontend
public class AddressController {

    @Autowired
    private AddressService addressService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Address>> getAddressesByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(addressService.getAddressesByUserId(userId));
    }

    @GetMapping("/{id}/user/{userId}")
    public ResponseEntity<Address> getAddressById(@PathVariable Long id, @PathVariable Long userId) {
        Optional<Address> address = addressService.getAddressByIdAndUserId(id, userId);
        return address.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Address> createAddress(@RequestBody Address address) {
        try {
            Address created = addressService.createAddress(address);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/user/{userId}")
    public ResponseEntity<Address> updateAddress(@PathVariable Long id, @PathVariable Long userId,
            @RequestBody Address address) {
        try {
            Address updated = addressService.updateAddress(id, userId, address);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}/user/{userId}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long id, @PathVariable Long userId) {
        try {
            addressService.deleteAddress(id, userId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/default/user/{userId}")
    public ResponseEntity<Address> setAddressAsDefault(@PathVariable Long id, @PathVariable Long userId) {
        try {
            Address updated = addressService.setAddressAsDefault(id, userId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
