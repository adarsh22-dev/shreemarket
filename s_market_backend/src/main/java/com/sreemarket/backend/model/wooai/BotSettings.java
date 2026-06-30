package com.sreemarket.backend.model.wooai;

import jakarta.persistence.*;

@Entity
@Table(name = "wooai_bot_settings")
public class BotSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bot_name")
    private String botName;

    private String tagline;

    @Column(name = "welcome_message", columnDefinition = "TEXT")
    private String welcomeMessage;

    @Column(name = "fallback_message", columnDefinition = "TEXT")
    private String fallbackMessage;

    @Column(name = "ai_model")
    private String aiModel;

    @Column(name = "max_turns")
    private int maxTurns;

    @Column(name = "auto_reply")
    private boolean autoReply;

    @Column(name = "typing_indicator")
    private boolean typingIndicator;

    @Column(name = "quick_chips")
    private boolean quickChips;

    @Column(name = "auto_escalation")
    private boolean autoEscalation;

    @Column(name = "offline_mode")
    private boolean offlineMode;

    @Column(name = "chat_history")
    private boolean chatHistory;

    @Column(name = "email_transcript")
    private boolean emailTranscript;

    @Column(name = "proactive_greeting")
    private boolean proactiveGreeting;

    @Column(name = "primary_color")
    private String primaryColor;

    private String position;

    private String theme;

    @Column(name = "avatar_style")
    private String avatarStyle;

    @Column(name = "escalation_alert")
    private boolean escalationAlert;

    @Column(name = "high_volume_alert")
    private boolean highVolumeAlert;

    @Column(name = "missed_callback_alert")
    private boolean missedCallbackAlert;

    @Column(name = "daily_summary")
    private boolean dailySummary;

    @Column(name = "notification_email")
    private String notificationEmail;

    @Column(name = "hours_enabled")
    private boolean hoursEnabled;

    @Column(name = "hours_start")
    private String hoursStart;

    @Column(name = "hours_end")
    private String hoursEnd;

    private String timezone;

    @Column(name = "offline_message", columnDefinition = "TEXT")
    private String offlineMessage;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBotName() { return botName; }
    public void setBotName(String botName) { this.botName = botName; }

    public String getTagline() { return tagline; }
    public void setTagline(String tagline) { this.tagline = tagline; }

    public String getWelcomeMessage() { return welcomeMessage; }
    public void setWelcomeMessage(String welcomeMessage) { this.welcomeMessage = welcomeMessage; }

    public String getFallbackMessage() { return fallbackMessage; }
    public void setFallbackMessage(String fallbackMessage) { this.fallbackMessage = fallbackMessage; }

    public String getAiModel() { return aiModel; }
    public void setAiModel(String aiModel) { this.aiModel = aiModel; }

    public int getMaxTurns() { return maxTurns; }
    public void setMaxTurns(int maxTurns) { this.maxTurns = maxTurns; }

    public boolean isAutoReply() { return autoReply; }
    public void setAutoReply(boolean autoReply) { this.autoReply = autoReply; }

    public boolean isTypingIndicator() { return typingIndicator; }
    public void setTypingIndicator(boolean typingIndicator) { this.typingIndicator = typingIndicator; }

    public boolean isQuickChips() { return quickChips; }
    public void setQuickChips(boolean quickChips) { this.quickChips = quickChips; }

    public boolean isAutoEscalation() { return autoEscalation; }
    public void setAutoEscalation(boolean autoEscalation) { this.autoEscalation = autoEscalation; }

    public boolean isOfflineMode() { return offlineMode; }
    public void setOfflineMode(boolean offlineMode) { this.offlineMode = offlineMode; }

    public boolean isChatHistory() { return chatHistory; }
    public void setChatHistory(boolean chatHistory) { this.chatHistory = chatHistory; }

    public boolean isEmailTranscript() { return emailTranscript; }
    public void setEmailTranscript(boolean emailTranscript) { this.emailTranscript = emailTranscript; }

    public boolean isProactiveGreeting() { return proactiveGreeting; }
    public void setProactiveGreeting(boolean proactiveGreeting) { this.proactiveGreeting = proactiveGreeting; }

    public String getPrimaryColor() { return primaryColor; }
    public void setPrimaryColor(String primaryColor) { this.primaryColor = primaryColor; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public String getAvatarStyle() { return avatarStyle; }
    public void setAvatarStyle(String avatarStyle) { this.avatarStyle = avatarStyle; }

    public boolean isEscalationAlert() { return escalationAlert; }
    public void setEscalationAlert(boolean escalationAlert) { this.escalationAlert = escalationAlert; }

    public boolean isHighVolumeAlert() { return highVolumeAlert; }
    public void setHighVolumeAlert(boolean highVolumeAlert) { this.highVolumeAlert = highVolumeAlert; }

    public boolean isMissedCallbackAlert() { return missedCallbackAlert; }
    public void setMissedCallbackAlert(boolean missedCallbackAlert) { this.missedCallbackAlert = missedCallbackAlert; }

    public boolean isDailySummary() { return dailySummary; }
    public void setDailySummary(boolean dailySummary) { this.dailySummary = dailySummary; }

    public String getNotificationEmail() { return notificationEmail; }
    public void setNotificationEmail(String notificationEmail) { this.notificationEmail = notificationEmail; }

    public boolean isHoursEnabled() { return hoursEnabled; }
    public void setHoursEnabled(boolean hoursEnabled) { this.hoursEnabled = hoursEnabled; }

    public String getHoursStart() { return hoursStart; }
    public void setHoursStart(String hoursStart) { this.hoursStart = hoursStart; }

    public String getHoursEnd() { return hoursEnd; }
    public void setHoursEnd(String hoursEnd) { this.hoursEnd = hoursEnd; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getOfflineMessage() { return offlineMessage; }
    public void setOfflineMessage(String offlineMessage) { this.offlineMessage = offlineMessage; }
}
