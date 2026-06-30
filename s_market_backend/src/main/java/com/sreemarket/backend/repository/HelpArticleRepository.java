package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.HelpArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HelpArticleRepository extends JpaRepository<HelpArticle, Long> {}
