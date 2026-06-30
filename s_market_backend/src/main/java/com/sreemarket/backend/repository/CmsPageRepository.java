package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.CmsPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CmsPageRepository extends JpaRepository<CmsPage, Long> {}
