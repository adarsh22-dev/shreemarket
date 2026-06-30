package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.GiftCard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GiftCardRepository extends JpaRepository<GiftCard, Long> {
    Optional<GiftCard> findByCode(String code);
    List<GiftCard> findBySenderUserId(Long senderUserId);
    List<GiftCard> findByRecipientEmail(String recipientEmail);
    List<GiftCard> findByVendorId(Long vendorId);
    List<GiftCard> findByStatus(String status);
}
