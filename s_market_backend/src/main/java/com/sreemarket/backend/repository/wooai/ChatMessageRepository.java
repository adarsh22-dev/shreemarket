package com.sreemarket.backend.repository.wooai;

import com.sreemarket.backend.model.wooai.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    // Additional query methods can be added here if needed
}