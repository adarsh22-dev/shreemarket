package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    Optional<User> findByResetToken(String resetToken);

    Boolean existsByPhone(String phone);

    @Query("SELECT u FROM User u WHERE u.roleId = :roleId AND (:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchUsersByRole(
            @Param("roleId") Long roleId,
            @Param("search") String search,
            Pageable pageable);

    // Admin queries for customers (roleId = 2)
    long countByRoleId(Long roleId);

    List<User> findByRoleId(Long roleId);

    Page<User> findByRoleId(Long roleId, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.roleId = :roleId AND u.status = :status")
    Page<User> findByRoleIdAndStatus(@Param("roleId") Long roleId, @Param("status") String status, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.roleId = 2 AND (" +
            "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchCustomers(@Param("search") String search, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.roleId = 2 AND u.status = :status AND (" +
            "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchCustomersByStatus(@Param("search") String search,
            @Param("status") String status, Pageable pageable);
}
