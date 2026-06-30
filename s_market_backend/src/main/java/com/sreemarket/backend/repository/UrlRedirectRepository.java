package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.UrlRedirect;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UrlRedirectRepository extends JpaRepository<UrlRedirect, Long> {}
