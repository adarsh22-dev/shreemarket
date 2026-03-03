package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.PolicyDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PolicyDocumentRepository extends JpaRepository<PolicyDocument, Long> {
}
