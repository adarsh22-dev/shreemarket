package com.sreemarket.backend.service;

import com.mailersend.sdk.MailerSend;
import com.mailersend.sdk.emails.Email;
import com.mailersend.sdk.exceptions.MailerSendException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Email service using MailerSend for transactional emails.
 * Handles: password reset, order confirmation, order status updates, newsletter campaigns.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${mailersend.api.key:}")
    private String apiKey;

    @Value("${app.email.from:noreply@sreemarket.com}")
    private String fromEmail;

    @Value("${app.email.from.name:SreeMarket}")
    private String fromName;

    @Value("${app.base.url:http://localhost:5173}")
    private String appBaseUrl;

    private MailerSend mailerSend;

    @PostConstruct
    public void init() {
        if (apiKey != null && !apiKey.isEmpty()) {
            mailerSend = new MailerSend();
            mailerSend.setToken(apiKey);
            log.info("MailerSend email service initialized");
        } else {
            log.warn("MAILERSEND_API_KEY not configured. Emails will be logged to console only.");
        }
    }

    /**
     * Sends an email through MailerSend. Falls back to logging if API key is not configured.
     */
    public void sendEmail(String toEmail, String toName, String subject, String htmlBody, String textBody) {
        if (mailerSend == null) {
            // Fallback: log the email
            log.info("========================================");
            log.info("EMAIL (not sent - no API key configured)");
            log.info("To: {} <{}>", toName, toEmail);
            log.info("Subject: {}", subject);
            log.info("Body: {}", htmlBody != null ? htmlBody : textBody);
            log.info("========================================");
            return;
        }

        try {
            Email message = new Email();
            message.setFrom(fromName, fromEmail);
            message.addRecipient(toName, toEmail);
            message.subject = subject;

            if (htmlBody != null) {
                message.html = htmlBody;
            }
            if (textBody != null) {
                message.text = textBody;
            }

            mailerSend.emails().send(message);
            log.info("Email sent successfully to {} <{}>: {}", toName, toEmail, subject);
        } catch (MailerSendException e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
        }
    }

    // ========== Password Reset ==========

    /**
     * Sends a password reset email with a reset link.
     */
    public void sendPasswordResetEmail(String toEmail, String toName, String resetToken) {
        String resetLink = appBaseUrl + "/reset-password?token=" + resetToken;

        String subject = "Reset Your SreeMarket Password";
        String htmlBody = buildPasswordResetHtml(toName, resetLink);
        String textBody = "Hi " + toName + ",\n\n"
                + "We received a request to reset your SreeMarket password.\n\n"
                + "Click the link below to reset your password:\n"
                + resetLink + "\n\n"
                + "This link expires in 1 hour.\n\n"
                + "If you didn't request this, please ignore this email.\n\n"
                + "Thanks,\nThe SreeMarket Team";

        sendEmail(toEmail, toName, subject, htmlBody, textBody);
    }

    private String buildPasswordResetHtml(String name, String resetLink) {
        return "<!DOCTYPE html>"
                + "<html><head><meta charset='UTF-8'></head>"
                + "<body style='font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;'>"
                + "<div style='max-width: 600px; margin: 0 auto; background-color: #ffffff;'>"
                + "<div style='background: linear-gradient(135deg, #FF5722, #E64A19); padding: 30px; text-align: center;'>"
                + "<h1 style='color: #ffffff; margin: 0; font-size: 24px;'>SreeMarket</h1>"
                + "</div>"
                + "<div style='padding: 40px 30px;'>"
                + "<h2 style='color: #333; margin-top: 0;'>Password Reset Request</h2>"
                + "<p style='color: #666; line-height: 1.6;'>Hi <strong>" + name + "</strong>,</p>"
                + "<p style='color: #666; line-height: 1.6;'>We received a request to reset your SreeMarket password. Click the button below to set a new password.</p>"
                + "<div style='text-align: center; margin: 30px 0;'>"
                + "<a href='" + resetLink + "' style='display: inline-block; background: linear-gradient(135deg, #FF5722, #E64A19); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 6px; font-size: 16px; font-weight: bold;'>Reset Password</a>"
                + "</div>"
                + "<p style='color: #999; font-size: 13px; line-height: 1.5;'>This link expires in <strong>1 hour</strong>. If you didn't request this, please ignore this email.</p>"
                + "</div>"
                + "<div style='background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;'>"
                + "<p style='color: #999; font-size: 12px; margin: 0;'>© 2026 SreeMarket. All rights reserved.</p>"
                + "</div>"
                + "</div></body></html>";
    }

    // ========== Order Confirmation ==========

    /**
     * Sends an order confirmation email to the customer.
     */
    public void sendOrderConfirmationEmail(String toEmail, String toName, String orderNumber,
                                            double totalAmount, String status) {
        String subject = "Order Confirmed - " + orderNumber;
        String htmlBody = buildOrderConfirmationHtml(toName, orderNumber, totalAmount, status);
        String textBody = "Hi " + toName + ",\n\n"
                + "Your order " + orderNumber + " has been placed successfully!\n\n"
                + "Order Summary:\n"
                + "  Order: " + orderNumber + "\n"
                + "  Total: ₹" + String.format("%.2f", totalAmount) + "\n"
                + "  Status: " + status + "\n\n"
                + "You can track your order in your account dashboard.\n\n"
                + "Thanks for shopping with SreeMarket!\nThe SreeMarket Team";

        sendEmail(toEmail, toName, subject, htmlBody, textBody);
    }

    private String buildOrderConfirmationHtml(String name, String orderNumber, double total, String status) {
        return "<!DOCTYPE html>"
                + "<html><head><meta charset='UTF-8'></head>"
                + "<body style='font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;'>"
                + "<div style='max-width: 600px; margin: 0 auto; background-color: #ffffff;'>"
                + "<div style='background: linear-gradient(135deg, #FF5722, #E64A19); padding: 30px; text-align: center;'>"
                + "<h1 style='color: #ffffff; margin: 0; font-size: 24px;'>SreeMarket</h1>"
                + "</div>"
                + "<div style='padding: 40px 30px;'>"
                + "<div style='text-align: center; margin-bottom: 30px;'>"
                + "<div style='display: inline-block; width: 64px; height: 64px; background-color: #E8F5E9; border-radius: 50%; line-height: 64px;'>"
                + "<span style='font-size: 32px; color: #4CAF50;'>&#10003;</span>"
                + "</div>"
                + "</div>"
                + "<h2 style='color: #333; text-align: center; margin-top: 0;'>Order Confirmed!</h2>"
                + "<p style='color: #666; line-height: 1.6; text-align: center;'>Hi <strong>" + name + "</strong>, your order has been placed successfully.</p>"
                + "<div style='background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0;'>"
                + "<table style='width: 100%; border-collapse: collapse;'>"
                + "<tr><td style='padding: 8px 0; color: #888;'>Order Number</td><td style='padding: 8px 0; text-align: right; font-weight: bold;'>" + orderNumber + "</td></tr>"
                + "<tr><td style='padding: 8px 0; color: #888;'>Total Amount</td><td style='padding: 8px 0; text-align: right; font-weight: bold;'>₹" + String.format("%.2f", total) + "</td></tr>"
                + "<tr><td style='padding: 8px 0; color: #888;'>Status</td><td style='padding: 8px 0; text-align: right;'><span style='background-color: #E3F2FD; color: #1565C0; padding: 3px 10px; border-radius: 12px; font-size: 13px;'>" + status + "</span></td></tr>"
                + "</table>"
                + "</div>"
                + "<div style='text-align: center; margin: 30px 0;'>"
                + "<a href='" + appBaseUrl + "/orders' style='display: inline-block; background: linear-gradient(135deg, #FF5722, #E64A19); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 6px; font-size: 16px; font-weight: bold;'>View My Orders</a>"
                + "</div>"
                + "</div>"
                + "<div style='background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;'>"
                + "<p style='color: #999; font-size: 12px; margin: 0;'>© 2026 SreeMarket. All rights reserved.</p>"
                + "</div>"
                + "</div></body></html>";
    }

    // ========== Order Status Update ==========

    /**
     * Sends an order status update email to the customer.
     */
    public void sendOrderStatusEmail(String toEmail, String toName, String orderNumber,
                                      String newStatus, String trackingInfo) {
        String subject = "Order Update - " + orderNumber + " is now " + newStatus;
        String htmlBody = buildOrderStatusHtml(toName, orderNumber, newStatus, trackingInfo);
        String textBody = "Hi " + toName + ",\n\n"
                + "Your order " + orderNumber + " status has been updated to: " + newStatus + "\n"
                + (trackingInfo != null ? "Tracking: " + trackingInfo + "\n" : "")
                + "\nYou can view your order details in your account dashboard.\n\n"
                + "Thanks,\nThe SreeMarket Team";

        sendEmail(toEmail, toName, subject, htmlBody, textBody);
    }

    // ========== Abandoned Cart Recovery ==========

    /**
     * Sends an abandoned cart recovery email with cart items and a link to complete checkout.
     */
    public void sendAbandonedCartRecoveryEmail(String toEmail, String toName, double cartTotal,
                                                int itemCount, String itemsHtml, String cartUrl) {
        String subject = "Your cart is waiting for you! Complete your order now";
        String htmlBody = buildAbandonedCartHtml(toName, cartTotal, itemCount, itemsHtml, cartUrl);
        String textBody = "Hi " + toName + ",\n\n"
                + "You left some items in your cart. Complete your order before they're gone!\n\n"
                + "Cart Total: ₹" + String.format("%.2f", cartTotal) + " (" + itemCount + " items)\n\n"
                + "Complete your order: " + cartUrl + "\n\n"
                + "Thanks,\nThe SreeMarket Team";

        sendEmail(toEmail, toName, subject, htmlBody, textBody);
    }

    private String buildAbandonedCartHtml(String name, double cartTotal, int itemCount,
                                          String itemsHtml, String cartUrl) {
        return "<!DOCTYPE html>"
                + "<html><head><meta charset='UTF-8'></head>"
                + "<body style='font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;'>"
                + "<div style='max-width: 600px; margin: 0 auto; background-color: #ffffff;'>"
                + "<div style='background: linear-gradient(135deg, #FF5722, #E64A19); padding: 30px; text-align: center;'>"
                + "<h1 style='color: #ffffff; margin: 0; font-size: 24px;'>SreeMarket</h1>"
                + "</div>"
                + "<div style='padding: 40px 30px;'>"
                + "<div style='text-align: center; margin-bottom: 24px;'>"
                + "<div style='display: inline-block; width: 64px; height: 64px; background-color: #FFF3E0; border-radius: 50%; line-height: 64px;'>"
                + "<span style='font-size: 32px;'>&#128722;</span>"
                + "</div>"
                + "</div>"
                + "<h2 style='color: #333; text-align: center; margin-top: 0;'>Don't leave your cart behind!</h2>"
                + "<p style='color: #666; line-height: 1.6; text-align: center;'>Hi <strong>" + name + "</strong>, you have items waiting in your cart. Complete your order before they're gone!</p>"
                + itemsHtml
                + "<div style='background-color: #f9f9f9; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;'>"
                + "<p style='margin: 0; color: #888;'>Cart Total</p>"
                + "<p style='margin: 4px 0 0; font-size: 24px; font-weight: bold; color: #FF5722;'>₹" + String.format("%.2f", cartTotal) + "</p>"
                + "<p style='margin: 4px 0 0; color: #999; font-size: 13px;'>" + itemCount + " item" + (itemCount != 1 ? "s" : "") + " in your cart</p>"
                + "</div>"
                + "<div style='text-align: center; margin: 30px 0;'>"
                + "<a href='" + cartUrl + "' style='display: inline-block; background: linear-gradient(135deg, #FF5722, #E64A19); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 6px; font-size: 16px; font-weight: bold;'>Complete Your Order</a>"
                + "</div>"
                + "<p style='color: #999; font-size: 13px; text-align: center; line-height: 1.5;'>Hurry! Items in your cart are not reserved and may sell out.</p>"
                + "</div>"
                + "<div style='background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;'>"
                + "<p style='color: #999; font-size: 12px; margin: 0;'>© 2026 SreeMarket. All rights reserved.</p>"
                + "</div>"
                + "</div></body></html>";
    }

    // ========== Back in Stock Notification ==========

    public void sendBackInStockNotification(String toEmail, String productName) {
        String subject = productName + " is back in stock!";
        String htmlBody = "<!DOCTYPE html><html><head><meta charset='UTF-8'></head>"
                + "<body style='font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;'>"
                + "<div style='max-width: 600px; margin: 0 auto; background-color: #ffffff;'>"
                + "<div style='background: linear-gradient(135deg, #FF5722, #E64A19); padding: 30px; text-align: center;'>"
                + "<h1 style='color: #ffffff; margin: 0; font-size: 24px;'>SreeMarket</h1></div>"
                + "<div style='padding: 40px 30px;'>"
                + "<h2 style='color: #333; margin-top: 0;'>Back in Stock!</h2>"
                + "<p style='color: #666; line-height: 1.6;'>Great news! <strong>" + productName + "</strong> is now back in stock.</p>"
                + "<div style='text-align: center; margin: 30px 0;'>"
                + "<a href='" + appBaseUrl + "/shop' style='display: inline-block; background: linear-gradient(135deg, #FF5722, #E64A19); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 6px; font-size: 16px; font-weight: bold;'>Shop Now</a>"
                + "</div></div>"
                + "<div style='background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;'>"
                + "<p style='color: #999; font-size: 12px; margin: 0;'>© 2026 SreeMarket. All rights reserved.</p>"
                + "</div></div></body></html>";
        String textBody = "Hi,\n\n" + productName + " is back in stock! Shop now at " + appBaseUrl + "\n\nThanks,\nSreeMarket";
        sendEmail(toEmail, "", subject, htmlBody, textBody);
    }

    // ========== Price Drop Notification ==========

    public void sendPriceDropNotification(String toEmail, String productName, double newPrice, double targetPrice) {
        String subject = "Price Drop Alert - " + productName;
        String htmlBody = "<!DOCTYPE html><html><head><meta charset='UTF-8'></head>"
                + "<body style='font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;'>"
                + "<div style='max-width: 600px; margin: 0 auto; background-color: #ffffff;'>"
                + "<div style='background: linear-gradient(135deg, #FF5722, #E64A19); padding: 30px; text-align: center;'>"
                + "<h1 style='color: #ffffff; margin: 0; font-size: 24px;'>SreeMarket</h1></div>"
                + "<div style='padding: 40px 30px;'>"
                + "<h2 style='color: #333; margin-top: 0;'>Price Drop Alert!</h2>"
                + "<p style='color: #666; line-height: 1.6;'><strong>" + productName + "</strong> has dropped to ₹" + String.format("%.2f", newPrice) + "</p>"
                + "<p style='color: #666; line-height: 1.6;'>You wanted it at ₹" + String.format("%.2f", targetPrice) + " or less.</p>"
                + "<div style='text-align: center; margin: 30px 0;'>"
                + "<a href='" + appBaseUrl + "/shop' style='display: inline-block; background: linear-gradient(135deg, #FF5722, #E64A19); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 6px; font-size: 16px; font-weight: bold;'>Shop Now</a>"
                + "</div></div>"
                + "<div style='background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;'>"
                + "<p style='color: #999; font-size: 12px; margin: 0;'>© 2026 SreeMarket. All rights reserved.</p>"
                + "</div></div></body></html>";
        String textBody = "Hi,\n\n" + productName + " price dropped to ₹" + String.format("%.2f", newPrice) + ".\n\nThanks,\nSreeMarket";
        sendEmail(toEmail, "", subject, htmlBody, textBody);
    }

    private String buildOrderStatusHtml(String name, String orderNumber, String status, String tracking) {
        String statusColor;
        switch (status.toUpperCase()) {
            case "SHIPPED": statusColor = "#1565C0"; break;
            case "DELIVERED": statusColor = "#2E7D32"; break;
            case "CANCELLED": statusColor = "#C62828"; break;
            default: statusColor = "#F57F17";
        }

        return "<!DOCTYPE html>"
                + "<html><head><meta charset='UTF-8'></head>"
                + "<body style='font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;'>"
                + "<div style='max-width: 600px; margin: 0 auto; background-color: #ffffff;'>"
                + "<div style='background: linear-gradient(135deg, #FF5722, #E64A19); padding: 30px; text-align: center;'>"
                + "<h1 style='color: #ffffff; margin: 0; font-size: 24px;'>SreeMarket</h1>"
                + "</div>"
                + "<div style='padding: 40px 30px;'>"
                + "<h2 style='color: #333; margin-top: 0;'>Order Status Update</h2>"
                + "<p style='color: #666; line-height: 1.6;'>Hi <strong>" + name + "</strong>,</p>"
                + "<p style='color: #666; line-height: 1.6;'>Your order <strong>" + orderNumber + "</strong> status has been updated.</p>"
                + "<div style='text-align: center; margin: 25px 0;'>"
                + "<span style='display: inline-block; background-color: " + statusColor + "; color: #ffffff; padding: 10px 28px; border-radius: 20px; font-size: 16px; font-weight: bold; text-transform: uppercase;'>" + status + "</span>"
                + "</div>"
                + (tracking != null ? "<p style='color: #666; line-height: 1.6;'>Tracking Info: <strong>" + tracking + "</strong></p>" : "")
                + "<div style='text-align: center; margin: 30px 0;'>"
                + "<a href='" + appBaseUrl + "/orders' style='display: inline-block; background: linear-gradient(135deg, #FF5722, #E64A19); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 6px; font-size: 16px; font-weight: bold;'>Track Your Order</a>"
                + "</div>"
                + "</div>"
                + "<div style='background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;'>"
                + "<p style='color: #999; font-size: 12px; margin: 0;'>© 2026 SreeMarket. All rights reserved.</p>"
                + "</div>"
                + "</div></body></html>";
    }
}
