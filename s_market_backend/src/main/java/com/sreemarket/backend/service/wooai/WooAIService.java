package com.sreemarket.backend.service.wooai;

import com.sreemarket.backend.model.wooai.*;
import java.util.List;
import java.util.Map;

public interface WooAIService {

    // Chat Sessions
    ChatSession createChatSession(Long userId, String userName, String intent);
    ChatSession getChatSessionById(Long sessionId);
    ChatSession getChatSessionBySessionId(String sessionId);
    List<ChatSession> getChatSessionsByUserId(Long userId);
    List<ChatSession> getAllChatSessions(int limit);
    ChatSession addMessage(Long sessionId, String content, String role);
    ChatSession updateSessionStatus(Long sessionId, String status);
    ChatSession updateSessionAgent(Long sessionId, String agent);
    ChatSession endSession(Long sessionId);
    void deleteChatSession(Long sessionId);
    List<ChatSession> searchChatSessions(String query);

    // Analytics
    long getTotalChatsToday();
    long getTotalChatsThisWeek();
    long getTotalChatsThisMonth();
    double getAIResolutionRate();
    int getPendingCallbacksCount();
    double getAverageResponseTime();
    int getActiveAgentsCount();
    int getEscalationsCount();
    Object[] getTopIntents();

    // Agents
    List<Agent> getAllAgents();
    Agent getAgentById(Long id);
    Agent createAgent(Agent agent);
    Agent updateAgent(Long id, Agent agent);
    void deleteAgent(Long id);

    // Routing Rules
    List<RoutingRule> getAllRoutingRules();
    RoutingRule getRoutingRuleById(Long id);
    RoutingRule createRoutingRule(RoutingRule rule);
    RoutingRule updateRoutingRule(Long id, RoutingRule rule);
    void deleteRoutingRule(Long id);

    // Product Assignments
    List<ProductAssignment> getProductAssignmentsBySection(String sectionKey);
    ProductAssignment addProductAssignment(ProductAssignment assignment);
    void removeProductAssignment(Long id);
    void removeProductAssignmentByKey(String sectionKey, String productId);

    // Policies
    List<Policy> getAllPolicies();
    Policy getPolicyById(Long id);
    Policy createPolicy(Policy policy);
    Policy updatePolicy(Long id, Policy policy);
    void deletePolicy(Long id);

    // Quick Actions
    List<QuickAction> getAllQuickActions();
    QuickAction getQuickActionById(Long id);
    QuickAction createQuickAction(QuickAction action);
    QuickAction updateQuickAction(Long id, QuickAction action);
    void deleteQuickAction(Long id);
    QuickAction incrementQuickActionClicks(Long id);

    // Callbacks
    List<Callback> getAllCallbacks();
    Callback getCallbackById(Long id);
    Callback createCallback(Callback callback);
    Callback updateCallback(Long id, Callback callback);
    void deleteCallback(Long id);
    Map<String, Long> getCallbackCounts();

    // Bot Settings
    BotSettings getBotSettings();
    BotSettings saveBotSettings(BotSettings settings);
    void resetBotSettings();
}
