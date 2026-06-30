package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.model.Store;
import com.sreemarket.backend.model.Vendor;
import com.sreemarket.backend.repository.OrderRepository;
import com.sreemarket.backend.repository.ProductRepository;
import com.sreemarket.backend.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Map;
import java.util.List;

@Service
public class InvoiceService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private VendorRepository vendorRepository;

    /**
     * Generates an HTML invoice that can be printed/saved as PDF.
     * Uses clean HTML/CSS so the browser's "Print to PDF" produces a professional result.
     */
    public String generateInvoiceHtml(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        html.append("<title>Invoice ").append(escapeHtml(order.getOrderNumber())).append("</title>");
        html.append("<style>");
        html.append("@page { margin: 20mm; }");
        html.append("body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; margin: 0; padding: 0; }");
        html.append(".invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; }");
        html.append("h1 { color: #E03E1A; font-size: 28px; margin: 0 0 5px; }");
        html.append(".header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E03E1A; padding-bottom: 20px; margin-bottom: 20px; }");
        html.append(".header-right { text-align: right; }");
        html.append(".invoice-details { margin-bottom: 30px; }");
        html.append(".invoice-details td { padding: 4px 12px 4px 0; font-size: 14px; }");
        html.append(".invoice-details td:first-child { color: #666; font-weight: 600; }");
        html.append("table.items { width: 100%; border-collapse: collapse; margin: 20px 0; }");
        html.append("table.items th { background: #f8f8f8; text-align: left; padding: 12px 10px; font-size: 13px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd; }");
        html.append("table.items td { padding: 12px 10px; border-bottom: 1px solid #eee; font-size: 14px; }");
        html.append("table.items td:last-child, table.items th:last-child { text-align: right; }");
        html.append(".totals { margin-top: 30px; }");
        html.append(".totals table { width: 300px; margin-left: auto; }");
        html.append(".totals td { padding: 6px 10px; font-size: 14px; }");
        html.append(".totals td:last-child { text-align: right; font-weight: 600; }");
        html.append(".totals .grand-total td { font-size: 18px; font-weight: 700; color: #E03E1A; border-top: 2px solid #333; padding-top: 10px; }");
        html.append(".footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }");
        html.append("</style></head><body>");
        html.append("<div class='invoice-box'>");

        // Header
        html.append("<div class='header'>");
        html.append("<div><h1>SREE MARKET</h1><div style='color:#666;font-size:13px;'>Invoice</div></div>");
        html.append("<div class='header-right'><h2 style='margin:0;font-size:18px;color:#333;'>").append(escapeHtml(order.getOrderNumber())).append("</h2></div>");
        html.append("</div>");

        // Invoice Details
        html.append("<table class='invoice-details'>");
        html.append("<tr><td>Invoice Date:</td><td>").append(formatDate(order.getDatePlaced())).append("</td></tr>");
        html.append("<tr><td>Customer:</td><td>").append(escapeHtml(order.getCustomerName() != null ? order.getCustomerName() : "N/A")).append("</td></tr>");
        html.append("<tr><td>Delivery:</td><td>").append(escapeHtml(order.getDeliveryLocation() != null ? order.getDeliveryLocation() : "N/A")).append("</td></tr>");
        html.append("<tr><td>Payment Method:</td><td>").append(escapeHtml(order.getPaymentMethod() != null ? order.getPaymentMethod() : "N/A")).append("</td></tr>");
        html.append("<tr><td>Order Status:</td><td>").append(escapeHtml(order.getStatus() != null ? order.getStatus() : "N/A")).append("</td></tr>");
        html.append("</table>");

        // Items Table
        html.append("<table class='items'><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>");
        if (order.getProductQuantities() != null) {
            for (Map.Entry<Long, Integer> entry : order.getProductQuantities().entrySet()) {
                Long productId = entry.getKey();
                Integer qty = entry.getValue();
                String productName = "Product #" + productId;
                double price = 0;
                try {
                    Product p = productRepository.findById(productId).orElse(null);
                    if (p != null) {
                        productName = p.getName() != null ? p.getName() : productName;
                        price = p.getDiscountPrice() != null ? p.getDiscountPrice() : (p.getRegularPrice() != null ? p.getRegularPrice() : 0);
                    }
                } catch (Exception ignored) {}
                double total = price * qty;
                html.append("<tr><td>").append(escapeHtml(productName)).append("</td>");
                html.append("<td>").append(qty).append("</td>");
                html.append("<td>₹").append(String.format("%.2f", price)).append("</td>");
                html.append("<td>₹").append(String.format("%.2f", total)).append("</td></tr>");
            }
        }
        html.append("</tbody></table>");

        // Totals
        double subtotal = order.getTotalAmount() != null ? order.getTotalAmount() : 0;
        double tax = order.getTaxAmount() != null ? order.getTaxAmount() : 0;
        double shipping = 0; // free for now
        double total = subtotal;

        html.append("<div class='totals'><table>");
        html.append("<tr><td>Subtotal</td><td>₹").append(String.format("%.2f", subtotal - tax - shipping)).append("</td></tr>");
        html.append("<tr><td>Shipping</td><td>FREE</td></tr>");
        if (tax > 0) {
            html.append("<tr><td>GST (").append(order.getTaxRate() != null ? order.getTaxRate().intValue() : 0).append("%)</td>");
            html.append("<td>₹").append(String.format("%.2f", tax)).append("</td></tr>");
        }
        html.append("<tr class='grand-total'><td>Total</td><td>₹").append(String.format("%.2f", total)).append("</td></tr>");
        html.append("</table></div>");

        // Footer
        html.append("<div class='footer'>");
        html.append("Sree Market · Thank you for your purchase!<br>");
        html.append("This is a computer-generated invoice.");
        html.append("</div>");

        html.append("</div></body></html>");
        return html.toString();
    }

    /**
     * Generates a vendor-branded HTML invoice using the vendor's store name and info.
     */
    public String generateVendorInvoiceHtml(Long orderId, Long vendorId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        // Get vendor store info
        Vendor vendor = vendorRepository.findById(vendorId).orElse(null);
        String storeName = "My Store";
        String storeAddress = "";
        String storePhone = "";
        String storeEmail = "";
        String storeCity = "";
        String storeState = "";
        String storeLogo = "";

        if (vendor != null && vendor.getStores() != null && !vendor.getStores().isEmpty()) {
            Store store = vendor.getStores().get(0);
            storeName = store.getStoreName() != null ? store.getStoreName() : vendor.getFullName();
            storeAddress = store.getFullAddress() != null ? store.getFullAddress() : "";
            storePhone = store.getPhoneNumber() != null ? store.getPhoneNumber() : "";
            storeEmail = store.getEmailAddress() != null ? store.getEmailAddress() : "";
            storeCity = store.getCity() != null ? store.getCity() : "";
            storeState = store.getState() != null ? store.getState() : "";
            storeLogo = store.getStoreLogo() != null ? store.getStoreLogo() : "";
        } else if (vendor != null) {
            storeName = vendor.getFullName() != null ? vendor.getFullName() : "My Store";
            storeEmail = vendor.getEmail() != null ? vendor.getEmail() : "";
            storePhone = vendor.getPhone() != null ? vendor.getPhone() : "";
        }

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        html.append("<title>Invoice ").append(escapeHtml(order.getOrderNumber())).append(" - ").append(escapeHtml(storeName)).append("</title>");
        html.append("<style>");
        html.append("@page { margin: 20mm; }");
        html.append("body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; margin: 0; padding: 0; }");
        html.append(".invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; }");
        html.append("h1 { color: #1a1a2e; font-size: 28px; margin: 0 0 5px; }");
        html.append(".header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a1a2e; padding-bottom: 20px; margin-bottom: 20px; }");
        html.append(".header-right { text-align: right; }");
        html.append(".store-info { font-size: 13px; color: #666; margin-top: 4px; line-height: 1.5; }");
        html.append(".invoice-details { margin-bottom: 30px; }");
        html.append(".invoice-details td { padding: 4px 12px 4px 0; font-size: 14px; }");
        html.append(".invoice-details td:first-child { color: #666; font-weight: 600; }");
        html.append("table.items { width: 100%; border-collapse: collapse; margin: 20px 0; }");
        html.append("table.items th { background: #f8f8f8; text-align: left; padding: 12px 10px; font-size: 13px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd; }");
        html.append("table.items td { padding: 12px 10px; border-bottom: 1px solid #eee; font-size: 14px; }");
        html.append("table.items td:last-child, table.items th:last-child { text-align: right; }");
        html.append(".totals { margin-top: 30px; }");
        html.append(".totals table { width: 300px; margin-left: auto; }");
        html.append(".totals td { padding: 6px 10px; font-size: 14px; }");
        html.append(".totals td:last-child { text-align: right; font-weight: 600; }");
        html.append(".totals .grand-total td { font-size: 18px; font-weight: 700; color: #1a1a2e; border-top: 2px solid #333; padding-top: 10px; }");
        html.append(".footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }");
        html.append("</style></head><body>");
        html.append("<div class='invoice-box'>");

        // Header with store name
        html.append("<div class='header'>");
        html.append("<div><h1>").append(escapeHtml(storeName)).append("</h1>");
        html.append("<div style='color:#666;font-size:13px;'>Tax Invoice</div>");
        if (!storeAddress.isEmpty()) {
            html.append("<div class='store-info'>").append(escapeHtml(storeAddress));
            if (!storeCity.isEmpty() || !storeState.isEmpty()) {
                html.append("<br>").append(escapeHtml(storeCity));
                if (!storeCity.isEmpty() && !storeState.isEmpty()) html.append(", ");
                html.append(escapeHtml(storeState));
            }
            html.append("</div>");
        }
        if (!storePhone.isEmpty()) {
            html.append("<div class='store-info'>Phone: ").append(escapeHtml(storePhone)).append("</div>");
        }
        if (!storeEmail.isEmpty()) {
            html.append("<div class='store-info'>Email: ").append(escapeHtml(storeEmail)).append("</div>");
        }
        html.append("</div>");
        html.append("<div class='header-right'><h2 style='margin:0;font-size:18px;color:#333;'>").append(escapeHtml(order.getOrderNumber())).append("</h2></div>");
        html.append("</div>");

        // Invoice Details
        html.append("<table class='invoice-details'>");
        html.append("<tr><td>Invoice Date:</td><td>").append(formatDate(order.getDatePlaced())).append("</td></tr>");
        html.append("<tr><td>Customer:</td><td>").append(escapeHtml(order.getCustomerName() != null ? order.getCustomerName() : "N/A")).append("</td></tr>");
        html.append("<tr><td>Delivery:</td><td>").append(escapeHtml(order.getDeliveryLocation() != null ? order.getDeliveryLocation() : "N/A")).append("</td></tr>");
        html.append("<tr><td>Payment Method:</td><td>").append(escapeHtml(order.getPaymentMethod() != null ? order.getPaymentMethod() : "N/A")).append("</td></tr>");
        html.append("<tr><td>Order Status:</td><td>").append(escapeHtml(order.getStatus() != null ? order.getStatus() : "N/A")).append("</td></tr>");
        html.append("</table>");

        // Items Table
        html.append("<table class='items'><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>");
        if (order.getProductQuantities() != null) {
            for (Map.Entry<Long, Integer> entry : order.getProductQuantities().entrySet()) {
                Long productId = entry.getKey();
                Integer qty = entry.getValue();
                String productName = "Product #" + productId;
                double price = 0;
                try {
                    Product p = productRepository.findById(productId).orElse(null);
                    if (p != null) {
                        productName = p.getName() != null ? p.getName() : productName;
                        price = p.getDiscountPrice() != null ? p.getDiscountPrice() : (p.getRegularPrice() != null ? p.getRegularPrice() : 0);
                    }
                } catch (Exception ignored) {}
                double total = price * qty;
                html.append("<tr><td>").append(escapeHtml(productName)).append("</td>");
                html.append("<td>").append(qty).append("</td>");
                html.append("<td>₹").append(String.format("%.2f", price)).append("</td>");
                html.append("<td>₹").append(String.format("%.2f", total)).append("</td></tr>");
            }
        }
        html.append("</tbody></table>");

        // Totals
        double subtotal = order.getTotalAmount() != null ? order.getTotalAmount() : 0;
        double tax = order.getTaxAmount() != null ? order.getTaxAmount() : 0;
        double shipping = 0;
        double total = subtotal;

        html.append("<div class='totals'><table>");
        html.append("<tr><td>Subtotal</td><td>₹").append(String.format("%.2f", subtotal - tax - shipping)).append("</td></tr>");
        html.append("<tr><td>Shipping</td><td>FREE</td></tr>");
        if (tax > 0) {
            html.append("<tr><td>GST (").append(order.getTaxRate() != null ? order.getTaxRate().intValue() : 0).append("%)</td>");
            html.append("<td>₹").append(String.format("%.2f", tax)).append("</td></tr>");
        }
        html.append("<tr class='grand-total'><td>Total</td><td>₹").append(String.format("%.2f", total)).append("</td></tr>");
        html.append("</table></div>");

        // Footer
        html.append("<div class='footer'>");
        html.append(escapeHtml(storeName)).append(" · Thank you for your purchase!<br>");
        html.append("This is a computer-generated invoice from Sree Market.");
        html.append("</div>");

        html.append("</div></body></html>");
        return html.toString();
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }

    private String formatDate(Long timestamp) {
        if (timestamp == null) return "N/A";
        return new SimpleDateFormat("dd MMM yyyy, HH:mm").format(new Date(timestamp));
    }
}
