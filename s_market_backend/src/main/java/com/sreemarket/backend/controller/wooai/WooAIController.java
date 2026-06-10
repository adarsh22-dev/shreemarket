package com.sreemarket.backend.controller.wooai;

import com.sreemarket.backend.model.wooai.*;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.service.wooai.WooAIService;
import com.sreemarket.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wooai")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class WooAIController {

    @Autowired
    private WooAIService wooAIService;

    @Autowired
    private ProductService productService;

    // ═══════════════ Chat Sessions ═══════════════

    @PostMapping("/session")
    public ResponseEntity<?> createChatSession(@RequestBody Map<String, Object> body) {
        try {
            Long userId = Long.valueOf(body.get("userId").toString());
            String userName = (String) body.get("userName");
            String intent = (String) body.get("intent");
            return new ResponseEntity<>(wooAIService.createChatSession(userId, userName, intent), HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<?> getChatSession(@PathVariable Long sessionId) {
        ChatSession session = wooAIService.getChatSessionById(sessionId);
        if (session == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Not found"));
        return ResponseEntity.ok(session);
    }

    @GetMapping("/session/id/{sessionId}")
    public ResponseEntity<?> getChatSessionBySessionId(@PathVariable String sessionId) {
        ChatSession session = wooAIService.getChatSessionBySessionId(sessionId);
        if (session == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Not found"));
        return ResponseEntity.ok(session);
    }

    @GetMapping("/sessions/user/{userId}")
    public ResponseEntity<?> getChatSessionsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(wooAIService.getChatSessionsByUserId(userId));
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getAllChatSessions(@RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(wooAIService.getAllChatSessions(limit));
    }

    @GetMapping("/sessions/search")
    public ResponseEntity<?> searchChatSessions(@RequestParam String query) {
        return ResponseEntity.ok(wooAIService.searchChatSessions(query));
    }

    @PostMapping("/session/{sessionId}/message")
    public ResponseEntity<?> addMessage(@PathVariable Long sessionId, @RequestBody Map<String, String> body) {
        try {
            ChatSession session = wooAIService.addMessage(sessionId, body.get("content"), body.get("role"));
            if (session == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Session not found"));
            return ResponseEntity.ok(session);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/session/{sessionId}/status")
    public ResponseEntity<?> updateSessionStatus(@PathVariable Long sessionId, @RequestBody Map<String, String> body) {
        try {
            ChatSession session = wooAIService.updateSessionStatus(sessionId, body.get("status"));
            if (session == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Not found"));
            return ResponseEntity.ok(session);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/session/{sessionId}/agent")
    public ResponseEntity<?> updateSessionAgent(@PathVariable Long sessionId, @RequestBody Map<String, String> body) {
        ChatSession session = wooAIService.updateSessionAgent(sessionId, body.get("agent"));
        if (session == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Not found"));
        return ResponseEntity.ok(session);
    }

    @PutMapping("/session/{sessionId}/end")
    public ResponseEntity<?> endSession(@PathVariable Long sessionId) {
        ChatSession session = wooAIService.endSession(sessionId);
        if (session == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Not found"));
        return ResponseEntity.ok(session);
    }

    @DeleteMapping("/session/{sessionId}")
    public ResponseEntity<?> deleteChatSession(@PathVariable Long sessionId) {
        try {
            wooAIService.deleteChatSession(sessionId);
            return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════ Analytics ═══════════════

    @GetMapping("/analytics/total-chats-today")
    public ResponseEntity<?> getTotalChatsToday() {
        return ResponseEntity.ok(Map.of("count", wooAIService.getTotalChatsToday()));
    }

    @GetMapping("/analytics/total-chats-week")
    public ResponseEntity<?> getTotalChatsThisWeek() {
        return ResponseEntity.ok(Map.of("count", wooAIService.getTotalChatsThisWeek()));
    }

    @GetMapping("/analytics/total-chats-month")
    public ResponseEntity<?> getTotalChatsThisMonth() {
        return ResponseEntity.ok(Map.of("count", wooAIService.getTotalChatsThisMonth()));
    }

    @GetMapping("/analytics/ai-resolution-rate")
    public ResponseEntity<?> getAIResolutionRate() {
        return ResponseEntity.ok(Map.of("rate", wooAIService.getAIResolutionRate()));
    }

    @GetMapping("/analytics/pending-callbacks")
    public ResponseEntity<?> getPendingCallbacksCount() {
        return ResponseEntity.ok(Map.of("count", wooAIService.getPendingCallbacksCount()));
    }

    @GetMapping("/analytics/average-response-time")
    public ResponseEntity<?> getAverageResponseTime() {
        return ResponseEntity.ok(Map.of("time", wooAIService.getAverageResponseTime()));
    }

    @GetMapping("/analytics/active-agents")
    public ResponseEntity<?> getActiveAgentsCount() {
        return ResponseEntity.ok(Map.of("count", wooAIService.getActiveAgentsCount()));
    }

    @GetMapping("/analytics/escalations")
    public ResponseEntity<?> getEscalationsCount() {
        return ResponseEntity.ok(Map.of("count", wooAIService.getEscalationsCount()));
    }

    @GetMapping("/analytics/top-intents")
    public ResponseEntity<?> getTopIntents() {
        return ResponseEntity.ok(Map.of("intents", wooAIService.getTopIntents()));
    }

    // ═══════════════ Agents ═══════════════

    @GetMapping("/agents")
    public ResponseEntity<?> getAllAgents() {
        return ResponseEntity.ok(wooAIService.getAllAgents());
    }

    @GetMapping("/agents/{id}")
    public ResponseEntity<?> getAgent(@PathVariable Long id) {
        Agent agent = wooAIService.getAgentById(id);
        if (agent == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Agent not found"));
        return ResponseEntity.ok(agent);
    }

    @PostMapping("/agents")
    public ResponseEntity<?> createAgent(@RequestBody Agent agent) {
        return new ResponseEntity<>(wooAIService.createAgent(agent), HttpStatus.CREATED);
    }

    @PutMapping("/agents/{id}")
    public ResponseEntity<?> updateAgent(@PathVariable Long id, @RequestBody Agent agent) {
        Agent updated = wooAIService.updateAgent(id, agent);
        if (updated == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Agent not found"));
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/agents/{id}")
    public ResponseEntity<?> deleteAgent(@PathVariable Long id) {
        try {
            wooAIService.deleteAgent(id);
            return ResponseEntity.ok(Map.of("message", "Agent deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════ Routing Rules ═══════════════

    @GetMapping("/routing-rules")
    public ResponseEntity<?> getAllRoutingRules() {
        return ResponseEntity.ok(wooAIService.getAllRoutingRules());
    }

    @PostMapping("/routing-rules")
    public ResponseEntity<?> createRoutingRule(@RequestBody RoutingRule rule) {
        return new ResponseEntity<>(wooAIService.createRoutingRule(rule), HttpStatus.CREATED);
    }

    @PutMapping("/routing-rules/{id}")
    public ResponseEntity<?> updateRoutingRule(@PathVariable Long id, @RequestBody RoutingRule rule) {
        RoutingRule updated = wooAIService.updateRoutingRule(id, rule);
        if (updated == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Rule not found"));
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/routing-rules/{id}")
    public ResponseEntity<?> deleteRoutingRule(@PathVariable Long id) {
        try {
            wooAIService.deleteRoutingRule(id);
            return ResponseEntity.ok(Map.of("message", "Rule deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════ Product Assignments ═══════════════

    @GetMapping("/product-assignments/{sectionKey}")
    public ResponseEntity<?> getProductAssignments(@PathVariable String sectionKey) {
        return ResponseEntity.ok(wooAIService.getProductAssignmentsBySection(sectionKey));
    }

    @PostMapping("/product-assignments")
    public ResponseEntity<?> addProductAssignment(@RequestBody ProductAssignment assignment) {
        return new ResponseEntity<>(wooAIService.addProductAssignment(assignment), HttpStatus.CREATED);
    }

    @DeleteMapping("/product-assignments/{id}")
    public ResponseEntity<?> removeProductAssignment(@PathVariable Long id) {
        try {
            wooAIService.removeProductAssignment(id);
            return ResponseEntity.ok(Map.of("message", "Assignment removed"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/product-assignments/{sectionKey}/{productId}")
    public ResponseEntity<?> removeProductAssignmentByKey(@PathVariable String sectionKey, @PathVariable String productId) {
        try {
            wooAIService.removeProductAssignmentByKey(sectionKey, productId);
            return ResponseEntity.ok(Map.of("message", "Assignment removed"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════ Policies ═══════════════

    @GetMapping("/policies")
    public ResponseEntity<?> getAllPolicies() {
        return ResponseEntity.ok(wooAIService.getAllPolicies());
    }

    @GetMapping("/policies/{id}")
    public ResponseEntity<?> getPolicy(@PathVariable Long id) {
        Policy policy = wooAIService.getPolicyById(id);
        if (policy == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Policy not found"));
        return ResponseEntity.ok(policy);
    }

    @PostMapping("/policies")
    public ResponseEntity<?> createPolicy(@RequestBody Policy policy) {
        return new ResponseEntity<>(wooAIService.createPolicy(policy), HttpStatus.CREATED);
    }

    @PutMapping("/policies/{id}")
    public ResponseEntity<?> updatePolicy(@PathVariable Long id, @RequestBody Policy policy) {
        Policy updated = wooAIService.updatePolicy(id, policy);
        if (updated == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Policy not found"));
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/policies/{id}")
    public ResponseEntity<?> deletePolicy(@PathVariable Long id) {
        try {
            wooAIService.deletePolicy(id);
            return ResponseEntity.ok(Map.of("message", "Policy deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════ Quick Actions ═══════════════

    @GetMapping("/quick-actions")
    public ResponseEntity<?> getAllQuickActions() {
        return ResponseEntity.ok(wooAIService.getAllQuickActions());
    }

    @GetMapping("/quick-actions/{id}")
    public ResponseEntity<?> getQuickAction(@PathVariable Long id) {
        QuickAction action = wooAIService.getQuickActionById(id);
        if (action == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Quick action not found"));
        return ResponseEntity.ok(action);
    }

    @PostMapping("/quick-actions")
    public ResponseEntity<?> createQuickAction(@RequestBody QuickAction action) {
        return new ResponseEntity<>(wooAIService.createQuickAction(action), HttpStatus.CREATED);
    }

    @PutMapping("/quick-actions/{id}")
    public ResponseEntity<?> updateQuickAction(@PathVariable Long id, @RequestBody QuickAction action) {
        QuickAction updated = wooAIService.updateQuickAction(id, action);
        if (updated == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Quick action not found"));
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/quick-actions/{id}")
    public ResponseEntity<?> deleteQuickAction(@PathVariable Long id) {
        try {
            wooAIService.deleteQuickAction(id);
            return ResponseEntity.ok(Map.of("message", "Quick action deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/quick-actions/{id}/click")
    public ResponseEntity<?> incrementClick(@PathVariable Long id) {
        QuickAction action = wooAIService.incrementQuickActionClicks(id);
        if (action == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Quick action not found"));
        return ResponseEntity.ok(action);
    }

    // ═══════════════ Callbacks ═══════════════

    @GetMapping("/callbacks")
    public ResponseEntity<?> getAllCallbacks() {
        return ResponseEntity.ok(wooAIService.getAllCallbacks());
    }

    @GetMapping("/callbacks/{id}")
    public ResponseEntity<?> getCallback(@PathVariable Long id) {
        Callback callback = wooAIService.getCallbackById(id);
        if (callback == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Callback not found"));
        return ResponseEntity.ok(callback);
    }

    @PostMapping("/callbacks")
    public ResponseEntity<?> createCallback(@RequestBody Callback callback) {
        return new ResponseEntity<>(wooAIService.createCallback(callback), HttpStatus.CREATED);
    }

    @PutMapping("/callbacks/{id}")
    public ResponseEntity<?> updateCallback(@PathVariable Long id, @RequestBody Callback callback) {
        Callback updated = wooAIService.updateCallback(id, callback);
        if (updated == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Callback not found"));
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/callbacks/{id}")
    public ResponseEntity<?> deleteCallback(@PathVariable Long id) {
        try {
            wooAIService.deleteCallback(id);
            return ResponseEntity.ok(Map.of("message", "Callback deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/callbacks/counts")
    public ResponseEntity<?> getCallbackCounts() {
        return ResponseEntity.ok(wooAIService.getCallbackCounts());
    }

    // ═══════════════ Bot Settings ═══════════════

    @GetMapping("/settings")
    public ResponseEntity<?> getBotSettings() {
        return ResponseEntity.ok(wooAIService.getBotSettings());
    }

    @PutMapping("/settings")
    public ResponseEntity<?> saveBotSettings(@RequestBody BotSettings settings) {
        return ResponseEntity.ok(wooAIService.saveBotSettings(settings));
    }

    @PostMapping("/settings/reset")
    public ResponseEntity<?> resetBotSettings() {
        try {
            wooAIService.resetBotSettings();
            return ResponseEntity.ok(Map.of("message", "Settings reset to defaults"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // Health
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "WooAI service is healthy"));
    }

    // Product search via AI
    @GetMapping("/search-products")
    public ResponseEntity<?> searchProducts(@RequestParam String q) {
        if (q == null || q.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Search query is required"));
        }
        List<Product> results = productService.searchProducts(q.trim());
        return ResponseEntity.ok(Map.of("results", results, "count", results.size()));
    }
}
