package com.sreemarket.backend.repository.wooai;

import com.sreemarket.backend.model.wooai.Agent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AgentRepository extends JpaRepository<Agent, Long> {
    List<Agent> findByStatus(String status);
}
