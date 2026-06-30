package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Role;
import com.sreemarket.backend.service.AdminRoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/roles")
public class AdminRoleController {

    @Autowired private AdminRoleService adminRoleService;

    @GetMapping
    public List<Role> getRoles() { return adminRoleService.getAllRoles(); }

    @PostMapping
    public Role createRole(@RequestBody Role r) { return adminRoleService.saveRole(r); }

    @PutMapping("/{id}")
    public Role updateRole(@PathVariable Long id, @RequestBody Role r) { return adminRoleService.updateRole(id, r); }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRole(@PathVariable Long id) { adminRoleService.deleteRole(id); return ResponseEntity.ok(Map.of("message", "Deleted")); }
}
