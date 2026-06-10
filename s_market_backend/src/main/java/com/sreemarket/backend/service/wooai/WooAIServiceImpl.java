package com.sreemarket.backend.service.wooai;

import com.sreemarket.backend.model.wooai.*;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.model.ProductMedia;
import com.sreemarket.backend.repository.wooai.*;
import com.sreemarket.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
public class WooAIServiceImpl implements WooAIService {

    @Autowired private ChatSessionRepository chatSessionRepository;
    @Autowired private ChatMessageRepository chatMessageRepository;
    @Autowired private AgentRepository agentRepository;
    @Autowired private RoutingRuleRepository routingRuleRepository;
    @Autowired private ProductAssignmentRepository productAssignmentRepository;
    @Autowired private PolicyRepository policyRepository;
    @Autowired private QuickActionRepository quickActionRepository;
    @Autowired private CallbackRepository callbackRepository;
    @Autowired private BotSettingsRepository botSettingsRepository;
    @Autowired private ProductService productService;

    @Override
    public ChatSession createChatSession(Long userId, String userName, String intent) {
        ChatSession session = new ChatSession();
        session.setSessionId("wooai_" + System.currentTimeMillis() + "_" + userId);
        session.setUserId(userId);
        session.setUserName(userName);
        session.setIntent(intent);
        session.setStatus(SessionStatus.ACTIVE);
        session.setAgent("WooAI Bot");
        session.setStartTime(LocalDateTime.now());
        return chatSessionRepository.save(session);
    }

    @Override
    public ChatSession getChatSessionById(Long sessionId) {
        return chatSessionRepository.findById(sessionId).orElse(null);
    }

    @Override
    public ChatSession getChatSessionBySessionId(String sessionId) {
        return chatSessionRepository.findBySessionId(sessionId);
    }

    @Override
    public List<ChatSession> getChatSessionsByUserId(Long userId) {
        return chatSessionRepository.findByUserIdOrderByStartTimeDesc(userId);
    }

    @Override
    public List<ChatSession> getAllChatSessions(int limit) {
        return chatSessionRepository.findTopNByOrderByStartTimeDesc(limit);
    }

    @Override
    public List<ChatSession> searchChatSessions(String query) {
        return chatSessionRepository.searchByQuery(query);
    }

    @Override
    public ChatSession addMessage(Long sessionId, String content, String role) {
        ChatSession session = getChatSessionById(sessionId);
        if (session == null) return null;

        String roleUpper = role.toUpperCase();
        ChatMessage message = new ChatMessage();
        message.setChatSession(session);
        message.setRole(MessageRole.valueOf(roleUpper));
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now());

        chatMessageRepository.save(message);
        session.addMessage(message);

        if ("USER".equals(roleUpper)) {
            BotSettings settings = getBotSettings();
            if (settings.isAutoReply()) {
                int messageCount = session.getMessages().size();
                if (settings.getMaxTurns() <= 0 || messageCount < settings.getMaxTurns() * 2) {
                    String botReply = generateAutoReply(content, session);
                    ChatMessage botMsg = new ChatMessage();
                    botMsg.setChatSession(session);
                    botMsg.setRole(MessageRole.BOT);
                    botMsg.setContent(botReply);
                    botMsg.setTimestamp(LocalDateTime.now().plusSeconds(1));
                    chatMessageRepository.save(botMsg);
                    session.addMessage(botMsg);
                } else {
                    String escalationMsg = "I have reached the limit of our conversation. Let me connect you to a team member who can assist further.";
                    ChatMessage botMsg = new ChatMessage();
                    botMsg.setChatSession(session);
                    botMsg.setRole(MessageRole.BOT);
                    botMsg.setContent(escalationMsg);
                    botMsg.setTimestamp(LocalDateTime.now().plusSeconds(1));
                    chatMessageRepository.save(botMsg);
                    session.addMessage(botMsg);
                    session.setStatus(SessionStatus.ESCALATED);
                }
            }
        }

        return chatSessionRepository.save(session);
    }

    private String generateAutoReply(String userMessage, ChatSession session) {
        String msg = userMessage.trim().toLowerCase();

        // -- Greetings --
        if (isGreeting(msg)) {
            String name = session.getUserName() != null && !"Guest".equals(session.getUserName())
                ? session.getUserName() : "there";
            return "Hello " + name + "! Welcome to SreeMarket. How can I help you today? You can browse our products, track an order, or ask about store policies.";
        }

        // -- Thank you --
        if (isThankYou(msg)) {
            return "You are welcome! Happy to help. If you need anything else, just let me know.";
        }

        // -- Farewell --
        if (isFarewell(msg)) {
            return "Thank you for chatting with us! Have a great day ahead. Feel free to come back anytime.";
        }

        // -- Order tracking --
        if (matchesAny(msg, "track", "tracking", "where is my order", "order status", "shipment status", "order tracking", "track order", "my order", "order number", "order id", "track package")) {
            return "I can help you track your order. Please share your order number and I will look up the latest status for you.";
        }

        // -- Returns --
        if (matchesAny(msg, "return", "returning", "return item", "send back", "want to return", "return policy", "refund", "money back", "get refund", "refund status")) {
            return "Our return policy allows returns within 30 days of delivery. Items must be unused and in original packaging. Refunds are processed within 5 to 7 business days after we receive the item. Would you like help initiating a return?";
        }

        // -- Exchange --
        if (matchesAny(msg, "exchange", "replace", "replacement", "swap", "different size", "different color", "size issue")) {
            return "Exchanges are available within 7 days of delivery based on product availability. Our team can assist you with size or variant changes. Would you like to proceed with an exchange?";
        }

        // -- Shipping --
        if (matchesAny(msg, "shipping", "delivery", "shipping time", "delivery time", "when will i get", "shipping charge", "shipping cost", "free shipping", "express delivery", "dispatch")) {
            return "We offer free shipping on orders above Rs 499. Standard delivery takes 3 to 7 business days. Express shipping is available at Rs 99 and delivers within 1 to 2 business days. International shipping is also available for select products. Would you like more details?";
        }

        // -- Payment --
        if (matchesAny(msg, "payment", "pay", "paying", "credit card", "debit card", "upi", "net banking", "cod", "cash on delivery", "paytm", "google pay", "phonepe", "payment method", "payment option", "secure payment")) {
            return "We accept all major payment methods: Credit and Debit Cards, UPI (Google Pay, PhonePe, Paytm), Net Banking, and Cash on Delivery. All transactions are secure and encrypted. Is there a specific payment method you need help with?";
        }

        // -- Cancel order --
        if (matchesAny(msg, "cancel", "cancellation", "cancel order", "cancel my order", "stop order")) {
            return "You can cancel an order within 24 hours of placing it, as long as it has not been shipped yet. To cancel, go to your orders in your account or contact support with your order number. Would you like assistance?";
        }

        // -- Damaged / Wrong item --
        if (matchesAny(msg, "damaged", "broken", "defective", "wrong item", "incorrect", "missing", "damage", "not working", "faulty")) {
            return "I am sorry to hear that. If you received a damaged or incorrect item, please contact our support team within 48 hours of delivery with photos of the issue. We will arrange a replacement or refund immediately. You can also request a callback using the menu option above.";
        }

        // -- Warranty --
        if (matchesAny(msg, "warranty", "guarantee", "manufacturer warranty", "cover", "repair")) {
            return "Our products come with a manufacturer warranty. The warranty period varies by product category: Electronics carry a 1-year warranty, Home Appliances carry a 2-year warranty, and Fashion items carry a 30-day warranty. For claims, please contact our support team with your order details.";
        }

        // -- Discounts / Offers --
        if (matchesAny(msg, "discount", "offer", "sale", "coupon", "promo", "promotion", "deal", "cheap", "affordable", "discount code")) {
            return "We have exciting offers and discounts available. Check out our Offers section for current deals. You can also sign up for our newsletter to receive exclusive discount codes and early access to sales.";
        }

        // -- Contact / Human agent --
        if (matchesAny(msg, "contact", "support", "speak to", "human", "agent", "representative", "talk to", "customer care", "help desk", "phone number", "email support")) {
            session.setStatus(SessionStatus.ESCALATED);
            return "I will connect you with a human agent shortly. In the meantime, you can also request a callback using the Callbacks option and our team will reach out to you.";
        }

        // -- Store hours --
        if (matchesAny(msg, "hours", "open", "timing", "when are you open", "store hours", "business hours", "working hours", "what time")) {
            BotSettings settings = getBotSettings();
            if (settings.isHoursEnabled()) {
                return "Our operating hours are " + settings.getHoursStart() + " to " + settings.getHoursEnd() + " (" + settings.getTimezone() + "). We are available during these hours to assist you.";
            }
            return "We are available to help you. You can reach out anytime and we will get back to you as soon as possible.";
        }

        // -- Account / Login --
        if (matchesAny(msg, "account", "login", "sign in", "sign up", "register", "password", "forgot", "profile", "my account", "my details")) {
            return "You can manage your account by visiting the My Account section. There you can view your details, order history, wishlist, saved addresses, and more. If you need help with login or password reset, please let me know.";
        }

        // -- Direct product search (e.g., "find iPhone", "search for shoes", "show me laptops") --
        String searchTerm = extractSearchTerm(msg);
        if (searchTerm != null) {
            List<Product> results = productService.searchProducts(searchTerm);
            if (!results.isEmpty()) {
                return formatProductResults(results, searchTerm);
            }
        }

        // -- Product Search quick action --
        if (msg.equals("search product")) {
            session.setIntent("PRODUCT_SEARCH");
            return "Sure! Please tell me the name of the product you are looking for and I will search our catalog for you.";
        }

        if ("PRODUCT_SEARCH".equals(session.getIntent()) && !matchesAny(msg, "hi", "hello", "hey", "thanks", "bye", "no", "nope", "nah", "yes", "ok", "okay", "sure")) {
            List<Product> results = productService.searchProducts(msg);
            if (results.isEmpty()) {
                session.setIntent("General Inquiry");
                return "I searched for \"" + msg + "\" but could not find any matching products. Please try a different name or browse our catalog using the quick actions above.";
            }
            session.setIntent("General Inquiry");
            return formatProductResults(results, msg);
        }

        // -- Product / Catalog --
        if (matchesAny(msg, "product", "products", "catalog", "category", "shop", "browse", "recommend", "suggestion", "what do you sell", "available")) {
            return "We have a wide range of products across categories like Electronics, Fashion, Home, Beauty, Sports, and Grocery. You can browse our Best Selling, Recommended, New Arrivals, and Offers sections using the quick actions above. What type of product are you looking for?";
        }

        // -- Pricing --
        if (matchesAny(msg, "price", "cost", "how much", "rate", "pricing", "expensive", "budget", "cheapest")) {
            return "We have products at various price points to suit every budget. You can browse our collections using the quick actions or visit our shop page. Could you tell me what type of product you are looking for? I can help find options within your budget.";
        }

        // -- Help / Menu --
        if (matchesAny(msg, "help", "what can you do", "capabilities", "menu", "options", "what do you do", "how can you help")) {
            return "I am WooAI, your SreeMarket shopping assistant. Here is what I can help with:\n\n\uD83D\uDECD\uFE0F Browse Products - Best Selling, Recommended, New Arrivals, Offers\n\uD83D\uDCE6 Track Order - Check your order status\n\uD83D\uDCCB Policies - View store policies\n\uD83D\uDCDE Callback - Request a callback\n\uD83D\uDC64 My Account - View details, orders, wishlist\n\nJust let me know what you need.";
        }

        // -- Positive feedback --
        if (matchesAny(msg, "great", "awesome", "nice", "good", "love", "amazing", "wonderful", "excellent", "fantastic", "superb", "brilliant", "perfect", "best")) {
            return "Thank you for your kind words! We are happy to help. Is there anything else you would like to know?";
        }

        // -- Negative feedback / Complaint --
        if (matchesAny(msg, "bad", "terrible", "worst", "disappointed", "frustrated", "angry", "issue", "problem", "complaint", "unhappy", "unsatisfied", "not good", "poor")) {
            session.setStatus(SessionStatus.ESCALATED);
            return "I am sorry to hear that you are not satisfied. I have escalated this to our team who will look into it right away. You can also request a callback so we can resolve this personally.";
        }

        // -- Product availability / Stock --
        if (matchesAny(msg, "available", "in stock", "out of stock", "stock", "availability", "restock", "when will it be available")) {
            return "Product availability varies by item. You can check the product page for current stock status. If an item is out of stock, you can sign up for a restock notification. Is there a specific product you are looking for?";
        }

        // -- Size / Fit --
        if (matchesAny(msg, "size", "fit", "measurement", "sizing", "small", "medium", "large", "xl", "xxl")) {
            return "Each product page includes a detailed size guide and measurements. If you need help with sizing for a specific product, please share the product name and I can assist you further.";
        }

        // -- Bulk / Wholesale --
        if (matchesAny(msg, "bulk", "wholesale", "bulk order", "bulk purchase", "wholesale price", "business", "reseller", "distributor")) {
            session.setStatus(SessionStatus.ESCALATED);
            return "Thank you for your interest in bulk ordering. I will connect you with our wholesale team who can provide pricing and details. You can also request a callback and our team will reach out.";
        }

        // -- Feedback / Suggestion --
        if (matchesAny(msg, "feedback", "suggestion", "recommendation", "improve", "feature request")) {
            return "Thank you for your feedback! We value your input and will share it with our team to improve your shopping experience. Is there anything else you would like to share?";
        }

        // -- Affirmations --
        if (matchesAny(msg, "yes", "okay", "ok", "sure", "alright", "fine", "go ahead", "proceed", "correct", "right")) {
            return "Great! Please let me know how I can assist you further. You can also use the quick actions above for common tasks.";
        }

        // -- Negations --
        if (matchesAny(msg, "no", "nope", "nah", "not now", "maybe later", "later", "nothing", "all good", "that is all", "thats all", "nothing else")) {
            return "Alright! If you need anything in the future, feel free to come back. Have a wonderful day.";
        }

        // Fallback
        BotSettings settings = getBotSettings();
        String fallback = settings.getFallbackMessage() != null
            ? settings.getFallbackMessage()
            : "I am not sure about that. Let me connect you to a team member.";
        return fallback + " In the meantime, you can check our Policies or request a Callback using the menu options.";
    }

    private boolean isGreeting(String msg) {
        return matchesAny(msg, "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
            "morning", "evening", "yo", "sup", "howdy", "namaste", "heyy", "hii", "hiii", "hola");
    }

    private boolean isThankYou(String msg) {
        return matchesAny(msg, "thank", "thanks", "thx", "ty", "thank you", "thankyou", "thank u", "appreciate", "grateful");
    }

    private boolean isFarewell(String msg) {
        return matchesAny(msg, "bye", "goodbye", "see you", "talk later", "cya", "gtg", "ttyl", "take care", "see ya", "bye bye", "have a good day");
    }

    private boolean matchesAny(String msg, String... keywords) {
        for (String keyword : keywords) {
            if (msg.contains(keyword)) return true;
        }
        return false;
    }

    @Override
    public ChatSession updateSessionStatus(Long sessionId, String status) {
        ChatSession session = getChatSessionById(sessionId);
        if (session == null) return null;
        session.setStatus(SessionStatus.valueOf(status.toUpperCase()));
        return chatSessionRepository.save(session);
    }

    @Override
    public ChatSession updateSessionAgent(Long sessionId, String agent) {
        ChatSession session = getChatSessionById(sessionId);
        if (session == null) return null;
        session.setAgent(agent);
        return chatSessionRepository.save(session);
    }

    @Override
    public ChatSession endSession(Long sessionId) {
        ChatSession session = getChatSessionById(sessionId);
        if (session == null) return null;
        session.setEndTime(LocalDateTime.now());
        session.setStatus(SessionStatus.CLOSED);
        return chatSessionRepository.save(session);
    }

    @Override
    public void deleteChatSession(Long sessionId) {
        chatSessionRepository.deleteById(sessionId);
    }

    // ═══════════════ Analytics ═══════════════

    @Override
    public long getTotalChatsToday() {
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        return chatSessionRepository.countByStartTimeAfter(todayStart);
    }

    @Override
    public long getTotalChatsThisWeek() {
        LocalDateTime weekStart = LocalDateTime.now().minusDays(7);
        return chatSessionRepository.countByStartTimeAfter(weekStart);
    }

    @Override
    public long getTotalChatsThisMonth() {
        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        return chatSessionRepository.countByStartTimeAfter(monthStart);
    }

    @Override
    public double getAIResolutionRate() {
        long total = chatSessionRepository.count();
        if (total == 0) return 0.0;
        long resolved = chatSessionRepository.countByStatus(SessionStatus.RESOLVED);
        return Math.round((double) resolved / total * 100.0 * 10.0) / 10.0;
    }

    @Override
    public int getPendingCallbacksCount() {
        return (int) callbackRepository.countByStatus("pending");
    }

    @Override
    public double getAverageResponseTime() {
        List<ChatSession> sessions = chatSessionRepository.findAll();
        if (sessions.isEmpty()) return 0.0;

        long totalResponseTime = 0;
        int messagePairs = 0;

        for (ChatSession session : sessions) {
            List<ChatMessage> messages = session.getMessages();
            if (messages.size() >= 2) {
                ChatMessage firstUserMsg = messages.stream()
                        .filter(m -> m.getRole() == MessageRole.USER).findFirst().orElse(null);
                ChatMessage firstBotMsg = messages.stream()
                        .filter(m -> m.getRole() == MessageRole.BOT).findFirst().orElse(null);

                if (firstUserMsg != null && firstBotMsg != null) {
                    long diffSeconds = ChronoUnit.SECONDS.between(firstUserMsg.getTimestamp(), firstBotMsg.getTimestamp());
                    if (diffSeconds >= 0) { totalResponseTime += diffSeconds; messagePairs++; }
                }
            }
        }
        return messagePairs > 0 ? Math.round((double) totalResponseTime / messagePairs * 10.0) / 10.0 : 0.0;
    }

    @Override
    public int getActiveAgentsCount() {
        List<ChatSession> activeSessions = chatSessionRepository.findByStatusIn(
                List.of(SessionStatus.ACTIVE, SessionStatus.PENDING));
        return (int) activeSessions.stream().map(ChatSession::getAgent).distinct().count();
    }

    @Override
    public int getEscalationsCount() {
        return (int) chatSessionRepository.countByStatus(SessionStatus.ESCALATED);
    }

    @Override
    public Object[] getTopIntents() {
        List<Object[]> results = chatSessionRepository.findTopIntents();
        return results.toArray(new Object[0]);
    }

    // ═══════════════ Agents ═══════════════

    @Override
    public List<Agent> getAllAgents() { return agentRepository.findAll(); }

    @Override
    public Agent getAgentById(Long id) { return agentRepository.findById(id).orElse(null); }

    @Override
    public Agent createAgent(Agent agent) { return agentRepository.save(agent); }

    @Override
    public Agent updateAgent(Long id, Agent agent) {
        Agent existing = getAgentById(id);
        if (existing == null) return null;
        agent.setId(id);
        return agentRepository.save(agent);
    }

    @Override
    public void deleteAgent(Long id) { agentRepository.deleteById(id); }

    // ═══════════════ Routing Rules ═══════════════

    @Override
    public List<RoutingRule> getAllRoutingRules() { return routingRuleRepository.findAll(); }

    @Override
    public RoutingRule getRoutingRuleById(Long id) { return routingRuleRepository.findById(id).orElse(null); }

    @Override
    public RoutingRule createRoutingRule(RoutingRule rule) { return routingRuleRepository.save(rule); }

    @Override
    public RoutingRule updateRoutingRule(Long id, RoutingRule rule) {
        RoutingRule existing = getRoutingRuleById(id);
        if (existing == null) return null;
        rule.setId(id);
        return routingRuleRepository.save(rule);
    }

    @Override
    public void deleteRoutingRule(Long id) { routingRuleRepository.deleteById(id); }

    // ═══════════════ Product Assignments ═══════════════

    @Override
    public List<ProductAssignment> getProductAssignmentsBySection(String sectionKey) {
        return productAssignmentRepository.findBySectionKey(sectionKey);
    }

    @Override
    public ProductAssignment addProductAssignment(ProductAssignment assignment) {
        return productAssignmentRepository.save(assignment);
    }

    @Override
    public void removeProductAssignment(Long id) { productAssignmentRepository.deleteById(id); }

    @Override
    public void removeProductAssignmentByKey(String sectionKey, String productId) {
        productAssignmentRepository.deleteBySectionKeyAndProductId(sectionKey, productId);
    }

    // ═══════════════ Policies ═══════════════

    @Override
    public List<Policy> getAllPolicies() { return policyRepository.findAll(); }

    @Override
    public Policy getPolicyById(Long id) { return policyRepository.findById(id).orElse(null); }

    @Override
    public Policy createPolicy(Policy policy) { return policyRepository.save(policy); }

    @Override
    public Policy updatePolicy(Long id, Policy policy) {
        Policy existing = getPolicyById(id);
        if (existing == null) return null;
        policy.setId(id);
        return policyRepository.save(policy);
    }

    @Override
    public void deletePolicy(Long id) { policyRepository.deleteById(id); }

    // ═══════════════ Quick Actions ═══════════════

    @Override
    public List<QuickAction> getAllQuickActions() { return quickActionRepository.findAll(); }

    @Override
    public QuickAction getQuickActionById(Long id) { return quickActionRepository.findById(id).orElse(null); }

    @Override
    public QuickAction createQuickAction(QuickAction action) { return quickActionRepository.save(action); }

    @Override
    public QuickAction updateQuickAction(Long id, QuickAction action) {
        QuickAction existing = getQuickActionById(id);
        if (existing == null) return null;
        action.setId(id);
        return quickActionRepository.save(action);
    }

    @Override
    public void deleteQuickAction(Long id) { quickActionRepository.deleteById(id); }

    @Override
    public QuickAction incrementQuickActionClicks(Long id) {
        QuickAction action = getQuickActionById(id);
        if (action == null) return null;
        action.setClicks(action.getClicks() + 1);
        return quickActionRepository.save(action);
    }

    // ═══════════════ Callbacks ═══════════════

    @Override
    public List<Callback> getAllCallbacks() { return callbackRepository.findAll(); }

    @Override
    public Callback getCallbackById(Long id) { return callbackRepository.findById(id).orElse(null); }

    @Override
    public Callback createCallback(Callback callback) { return callbackRepository.save(callback); }

    @Override
    public Callback updateCallback(Long id, Callback callback) {
        Callback existing = getCallbackById(id);
        if (existing == null) return null;
        callback.setId(id);
        return callbackRepository.save(callback);
    }

    @Override
    public void deleteCallback(Long id) { callbackRepository.deleteById(id); }

    @Override
    public Map<String, Long> getCallbackCounts() {
        Map<String, Long> counts = new HashMap<>();
        counts.put("pending", callbackRepository.countByStatus("pending"));
        counts.put("completed", callbackRepository.countByStatus("completed"));
        counts.put("missed", callbackRepository.countByStatus("missed"));
        counts.put("total", callbackRepository.count());
        return counts;
    }

    // ═══════════════ Bot Settings ═══════════════

    @Override
    public BotSettings getBotSettings() {
        List<BotSettings> all = botSettingsRepository.findAll();
        if (all.isEmpty()) {
            BotSettings defaults = new BotSettings();
            defaults.setBotName("WooAI Assistant");
            defaults.setTagline("Powered by WooAI Assistant");
            defaults.setWelcomeMessage("Hello! Welcome to SreeMarket. How can I help you today?");
            defaults.setFallbackMessage("I'm not sure about that. Let me connect you to a team member.");
            defaults.setAiModel("claude-sonnet-4-6");
            defaults.setMaxTurns(5);
            defaults.setAutoReply(true);
            defaults.setTypingIndicator(true);
            defaults.setQuickChips(true);
            defaults.setAutoEscalation(true);
            defaults.setOfflineMode(false);
            defaults.setChatHistory(true);
            defaults.setEmailTranscript(false);
            defaults.setProactiveGreeting(true);
            defaults.setPrimaryColor("#6d28d9");
            defaults.setPosition("bottom-right");
            defaults.setTheme("light");
            defaults.setAvatarStyle("initials");
            defaults.setEscalationAlert(true);
            defaults.setHighVolumeAlert(true);
            defaults.setMissedCallbackAlert(true);
            defaults.setDailySummary(false);
            defaults.setNotificationEmail("admin@sreemarket.com");
            defaults.setHoursEnabled(true);
            defaults.setHoursStart("09:00");
            defaults.setHoursEnd("21:00");
            defaults.setTimezone("Asia/Kolkata");
            defaults.setOfflineMessage("We are currently offline. Leave a message and we'll get back to you!");
            return botSettingsRepository.save(defaults);
        }
        return all.get(0);
    }

    @Override
    public BotSettings saveBotSettings(BotSettings settings) {
        BotSettings existing = getBotSettings();
        settings.setId(existing.getId());
        return botSettingsRepository.save(settings);
    }

    @Override
    public void resetBotSettings() {
        botSettingsRepository.deleteAll();
        getBotSettings();
    }

    // ─── Product Search Helpers ──────────────────────────────────────

    private String extractSearchTerm(String msg) {
        String[] patterns = {
            "find ", "search for ", "search ", "show me ", "looking for ",
            "i want ", "i need ", "show ", "display ", "got any "
        };
        for (String pattern : patterns) {
            if (msg.startsWith(pattern)) {
                String term = msg.substring(pattern.length()).trim();
                if (!term.isEmpty() && term.length() > 1) return term;
            }
        }
        // Also catch "find ..." anywhere in the message
        for (String pattern : patterns) {
            int idx = msg.indexOf(pattern);
            if (idx > 0) {
                String after = msg.substring(idx + pattern.length()).trim();
                if (!after.isEmpty() && after.length() > 1) return after;
            }
        }
        return null;
    }

    private String formatProductResults(List<Product> results, String query) {
        int limit = Math.min(results.size(), 12);
        StringBuilder reply = new StringBuilder();
        reply.append("Here are the products I found for \"").append(query).append("\":\n\n");
        for (int i = 0; i < limit; i++) {
            Product p = results.get(i);
            String price = p.getDiscountPrice() != null
                ? "₹" + String.format("%.0f", p.getDiscountPrice())
                : "₹" + String.format("%.0f", p.getRegularPrice());
            reply.append("• ").append(p.getName()).append(" - ").append(price).append("\n");
        }
        if (results.size() > limit) {
            reply.append("\n...and ").append(results.size() - limit).append(" more results.");
        }
        reply.append("\n\n__AI_PRODUCTS__").append(toJsonProducts(results.subList(0, limit)))
             .append("__AI_PRODUCTS__");
        reply.append("\n\nClick any product above or visit our Shop page for more details.");
        return reply.toString();
    }

    private String toJsonProducts(List<Product> products) {
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < products.size(); i++) {
            Product p = products.get(i);
            String imageUrl = "";
            if (p.getMedia() != null && !p.getMedia().isEmpty()) {
                ProductMedia primary = p.getMedia().stream()
                    .filter(m -> "gallery".equals(m.getMediaType()) && Boolean.TRUE.equals(m.getIsPrimary()))
                    .findFirst().orElse(null);
                if (primary == null) {
                    primary = p.getMedia().stream()
                        .filter(m -> "gallery".equals(m.getMediaType()))
                        .findFirst().orElse(null);
                }
                if (primary != null && primary.getFileName() != null) {
                    imageUrl = "/uploads/products/" + primary.getFileName();
                }
            }
            double price = p.getDiscountPrice() != null ? p.getDiscountPrice() : p.getRegularPrice();
            json.append("{")
                .append("\"id\":").append(p.getId()).append(",")
                .append("\"name\":").append(escapeJson(p.getName())).append(",")
                .append("\"price\":").append(String.format("%.0f", price)).append(",")
                .append("\"image\":").append(escapeJson(imageUrl)).append(",")
                .append("\"category\":").append(escapeJson(p.getCategory()))
                .append("}");
            if (i < products.size() - 1) json.append(",");
        }
        json.append("]");
        return json.toString();
    }

    private String escapeJson(String value) {
        if (value == null) return "\"\"";
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"")
            .replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t") + "\"";
    }
}
