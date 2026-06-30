package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Role;
import com.sreemarket.backend.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminRoleService {

    @Autowired private RoleRepository roleRepository;

    public List<Role> getAllRoles() { return roleRepository.findAll(); }

    public Role saveRole(Role r) { return roleRepository.save(r); }

    public Role updateRole(Long id, Role r) {
        Role e = roleRepository.findById(id).orElseThrow(() -> new RuntimeException("Role not found"));
        e.setName(r.getName());
        e.setDescription(r.getDescription());
        e.setPermissions(r.getPermissions());
        e.setColor(r.getColor());
        return roleRepository.save(e);
    }

    public void deleteRole(Long id) { roleRepository.deleteById(id); }
}
