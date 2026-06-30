package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.GiftWrapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GiftWrappingRepository extends JpaRepository<GiftWrapping, Long> {
    List<GiftWrapping> findByActiveTrue();
}
