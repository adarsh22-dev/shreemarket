package com.sreemarket.backend.repository.wooai;

import com.sreemarket.backend.model.wooai.ChatSession;
import com.sreemarket.backend.model.wooai.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    
    ChatSession findBySessionId(String sessionId);
    
    List<ChatSession> findByUserIdOrderByStartTimeDesc(Long userId);
    
    List<ChatSession> findByStatusIn(List<SessionStatus> statuses);
    
    @Query("SELECT COUNT(c) FROM ChatSession c WHERE c.startTime >= :startTime")
    long countByStartTimeAfter(@Param("startTime") LocalDateTime startTime);
    
    @Query("SELECT COUNT(c) FROM ChatSession c WHERE c.status = :status")
    long countByStatus(@Param("status") SessionStatus status);
    
    @Query("SELECT c FROM ChatSession c ORDER BY c.startTime DESC")
    List<ChatSession> findTopNByOrderByStartTimeDesc(int limit);

    @Query("SELECT c FROM ChatSession c WHERE LOWER(c.userName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(c.intent) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(c.sessionId) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<ChatSession> searchByQuery(@Param("query") String query);

    @Query("SELECT c.intent, COUNT(c) FROM ChatSession c GROUP BY c.intent ORDER BY COUNT(c) DESC")
    List<Object[]> findTopIntents();
}