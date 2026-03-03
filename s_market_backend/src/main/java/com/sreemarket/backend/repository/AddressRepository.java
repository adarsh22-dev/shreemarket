package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByUserId(Long userId);

    List<Address> findByUserIdAndRoleId(Long userId, Long roleId);

    Optional<Address> findByIdAndUserId(Long id, Long userId);

    List<Address> findByUserIdAndDefaultAddressTrue(Long userId);
}
