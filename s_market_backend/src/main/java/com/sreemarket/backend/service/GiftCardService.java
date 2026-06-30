package com.sreemarket.backend.service;

import com.sreemarket.backend.model.GiftCard;
import com.sreemarket.backend.repository.GiftCardRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
public class GiftCardService {

    private final GiftCardRepository repository;

    public GiftCardService(GiftCardRepository repository) {
        this.repository = repository;
    }

    public List<GiftCard> getAllGiftCards() {
        return repository.findAll();
    }

    public GiftCard getGiftCard(Long id) {
        return repository.findById(id).orElse(null);
    }

    public GiftCard getGiftCardByCode(String code) {
        return repository.findByCode(code).orElse(null);
    }

    public GiftCard createGiftCard(GiftCard giftCard) {
        giftCard.setCode(generateCode());
        giftCard.setCurrentBalance(giftCard.getInitialBalance());
        giftCard.setStatus("ACTIVE");
        giftCard.setCreatedAt(System.currentTimeMillis());
        return repository.save(giftCard);
    }

    public GiftCard redeemGiftCard(String code, Double amount) {
        GiftCard card = repository.findByCode(code).orElse(null);
        if (card == null || !"ACTIVE".equals(card.getStatus())) return null;
        if (card.getCurrentBalance() < amount) return null;
        card.setCurrentBalance(card.getCurrentBalance() - amount);
        if (card.getCurrentBalance() <= 0) {
            card.setStatus("REDEEMED");
            card.setRedeemedAt(System.currentTimeMillis());
        }
        return repository.save(card);
    }

    public List<GiftCard> getVendorGiftCards(Long vendorId) {
        return repository.findByVendorId(vendorId);
    }

    public List<GiftCard> getCustomerGiftCards(String email) {
        return repository.findByRecipientEmail(email);
    }

    private String generateCode() {
        return "GIFT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
