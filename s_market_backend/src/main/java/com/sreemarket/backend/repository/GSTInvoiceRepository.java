package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.GSTInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GSTInvoiceRepository extends JpaRepository<GSTInvoice, Long> {
    List<GSTInvoice> findByStatus(String status);
    List<GSTInvoice> findByInvoiceIdContainingIgnoreCaseOrVendorContainingIgnoreCaseOrGstinContainingIgnoreCase(
            String invoiceId, String vendor, String gstin);
}
