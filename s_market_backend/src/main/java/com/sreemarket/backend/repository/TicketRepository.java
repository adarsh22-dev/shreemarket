package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    Page<Ticket> findByRoleOrderByCreatedAtDesc(String role, Pageable pageable);
    Page<Ticket> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Ticket> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    Page<Ticket> findBySubjectContainingIgnoreCaseOrCreatedByContainingIgnoreCaseOrTicketNumberContainingIgnoreCase(
            String subject, String createdBy, String ticketNumber, Pageable pageable);
    List<Ticket> findByCreatedByIdOrderByCreatedAtDesc(Long createdById);
}
