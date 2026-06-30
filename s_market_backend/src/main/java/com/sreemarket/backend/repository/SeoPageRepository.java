package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.SeoPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SeoPageRepository extends JpaRepository<SeoPage, Long> {}
