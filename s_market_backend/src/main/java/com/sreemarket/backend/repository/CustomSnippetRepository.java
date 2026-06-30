package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.CustomSnippet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomSnippetRepository extends JpaRepository<CustomSnippet, Long> {}
