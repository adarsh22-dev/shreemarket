package com.sreemarket.backend.repository.wooai;

import com.sreemarket.backend.model.wooai.Callback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CallbackRepository extends JpaRepository<Callback, Long> {
    List<Callback> findByStatus(String status);
    long countByStatus(String status);
}
