package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    Optional<User> findByResetToken(String resetToken);

    Boolean existsByPhone(String phone);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE u.roleId = :roleId AND (:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    org.springframework.data.domain.Page<User> searchUsersByRole(
            @org.springframework.web.bind.annotation.RequestParam("roleId") Long roleId,
            @org.springframework.web.bind.annotation.RequestParam("search") String search,
            org.springframework.data.domain.Pageable pageable);
}
