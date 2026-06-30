package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Ticket;
import com.sreemarket.backend.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository;

    public Ticket createTicket(Ticket ticket) {
        ticket.setTicketNumber("TKT-" + System.currentTimeMillis());
        if (ticket.getStatus() == null) ticket.setStatus("Open");
        if (ticket.getPriority() == null) ticket.setPriority("Normal");
        ticket.setCreatedAt(System.currentTimeMillis());
        ticket.setUpdatedAt(System.currentTimeMillis());
        return ticketRepository.save(ticket);
    }

    public Page<Ticket> getAllTickets(int page, int size, String search) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);
        if (search != null && !search.trim().isEmpty()) {
            return ticketRepository
                    .findBySubjectContainingIgnoreCaseOrCreatedByContainingIgnoreCaseOrTicketNumberContainingIgnoreCase(
                            search, search, search, pageable);
        }
        return ticketRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public Page<Ticket> getTicketsByRole(String role, int page, int size) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);
        return ticketRepository.findByRoleOrderByCreatedAtDesc(role, pageable);
    }

    public Ticket getTicketById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + id));
    }

    public Ticket updateTicketStatus(Long id, String status) {
        Ticket ticket = getTicketById(id);
        ticket.setStatus(status);
        ticket.setUpdatedAt(System.currentTimeMillis());
        return ticketRepository.save(ticket);
    }

    public Ticket updateTicket(Long id, Ticket updated) {
        Ticket ticket = getTicketById(id);
        if (updated.getStatus() != null) ticket.setStatus(updated.getStatus());
        if (updated.getPriority() != null) ticket.setPriority(updated.getPriority());
        if (updated.getAssignedTo() != null) ticket.setAssignedTo(updated.getAssignedTo());
        if (updated.getAssignedToEmail() != null) ticket.setAssignedToEmail(updated.getAssignedToEmail());
        if (updated.getAssignedToId() != null) ticket.setAssignedToId(updated.getAssignedToId());
        if (updated.getNotes() != null) ticket.setNotes(updated.getNotes());
        if (updated.getCategory() != null) ticket.setCategory(updated.getCategory());
        ticket.setUpdatedAt(System.currentTimeMillis());
        return ticketRepository.save(ticket);
    }

    public void deleteTicket(Long id) {
        if (!ticketRepository.existsById(id)) {
            throw new RuntimeException("Ticket not found with id: " + id);
        }
        ticketRepository.deleteById(id);
    }

    public List<Ticket> getTicketsByCreatedById(Long createdById) {
        return ticketRepository.findByCreatedByIdOrderByCreatedAtDesc(createdById);
    }
}
