package com.sreemarket.backend.config;

import com.sreemarket.backend.model.*;
import com.sreemarket.backend.model.wooai.*;
import com.sreemarket.backend.repository.*;
import com.sreemarket.backend.repository.wooai.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(RoleRepository roleRepository, UserRepository userRepository,
            PasswordEncoder passwordEncoder, QuickActionRepository quickActionRepository,
            PolicyRepository policyRepository, RoutingRuleRepository routingRuleRepository,
            AgentRepository agentRepository) {
        return args -> {
            // Initialize Roles
            if (roleRepository.count() == 0) {
                Role admin = new Role();
                admin.setName("ADMIN");
                roleRepository.save(admin);

                Role customer = new Role();
                customer.setName("CUSTOMER");
                roleRepository.save(customer);

                Role vendor = new Role();
                vendor.setName("VENDOR");
                roleRepository.save(vendor);

                Role wholesaler = new Role();
                wholesaler.setName("WHOLESALER");
                wholesaler.setDescription("Wholesale buyer");
                roleRepository.save(wholesaler);

                System.out.println("Default roles initialized: ADMIN (1), CUSTOMER (2), VENDOR (3), WHOLESALER (4)");
            }

            // Initialize Admin User
            if (!userRepository.existsByEmail("admin@smarket.com")) {
                User admin = new User();
                admin.setFullName("Admin");
                admin.setEmail("admin@smarket.com");
                String adminPassword = System.getenv("ADMIN_PASSWORD") != null ? System.getenv("ADMIN_PASSWORD") : "admin123";
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setRoleId(1L);
                admin.setCreatedAt(System.currentTimeMillis());
                userRepository.save(admin);
                System.out.println("Default Admin User created: admin@smarket.com / " + adminPassword);
            }

            // Initialize Default WooAI Quick Actions
            initializeQuickActions(quickActionRepository);

            // Initialize Default WooAI Policies
            initializePolicies(policyRepository);

            // Initialize Default WooAI Routing Rules
            initializeRoutingRules(routingRuleRepository);

            // Initialize Default WooAI Agents
            initializeAgents(agentRepository);
        };
    }

    private void initializeQuickActions(QuickActionRepository repo) {
        if (repo.count() > 0) return;
        String[][] defaults = {
            {"Bestselling",  "Star",     "product", "Show best selling products"},
            {"Recommended",  "ThumbsUp", "product", "Show recommended products"},
            {"New Arrivals", "Zap",      "product", "Show newly arrived products"},
            {"Offers",       "Tag",      "product", "Show current offers and deals"},
            {"Track Order",  "Search",   "order",   "Track your order status"},
            {"My Account",   "User",     "account", "Manage your account"},
            {"Callbacks",    "Phone",    "callback","Request a callback from support"},
            {"Policies",     "FileText", "policy",  "View store policies"},
        };
        for (String[] d : defaults) {
            QuickAction qa = new QuickAction();
            qa.setLabel(d[0]);
            qa.setIcon(d[1]);
            qa.setActionType(d[2]);
            qa.setDescription(d[3]);
            qa.setActive(true);
            qa.setClicks(0);
            repo.save(qa);
        }
        System.out.println("WooAI quick actions initialized: " + defaults.length + " actions");
    }

    private void initializePolicies(PolicyRepository repo) {
        if (repo.count() > 0) return;
        Object[][] defaults = {
            {"Return Policy", "Returns",
                "We accept returns within 30 days of delivery. Items must be unused and in their original packaging with all tags attached. "
                + "To initiate a return, please visit your account orders section or contact our support team. "
                + "Refunds will be processed within 5-7 business days after we receive the returned item."},
            {"Shipping Policy", "Shipping",
                "We offer free shipping on orders above ₹499. Standard delivery takes 3-7 business days across India. "
                + "Express shipping is available at ₹99 for delivery within 1-2 business days. "
                + "International shipping is available for select products with delivery times varying by destination. "
                + "All orders are dispatched within 24 hours of placement on business days."},
            {"Privacy Policy", "Privacy",
                "Your privacy is important to us. We collect only the information necessary to process your orders and improve your shopping experience. "
                + "We do not share your personal data with third parties without your consent. "
                + "All payment information is encrypted and processed securely. You can request deletion of your data at any time by contacting our support team."},
            {"Cancellation Policy", "Custom",
                "Orders can be cancelled within 24 hours of placement, provided they have not been shipped yet. "
                + "To cancel, go to your orders in your account dashboard or contact support with your order number. "
                + "Once an order has been shipped, it cannot be cancelled but can be returned after delivery."},
            {"Warranty Policy", "Custom",
                "All products come with a manufacturer's warranty. Warranty periods vary by product category: "
                + "Electronics: 1 year, Home Appliances: 2 years, Fashion: 30 days. "
                + "Warranty covers manufacturing defects only. Damage due to misuse or normal wear and tear is not covered. "
                + "For warranty claims, please contact our support team with your order details."},
        };
        for (Object[] d : defaults) {
            Policy p = new Policy();
            p.setName((String) d[0]);
            p.setCategory((String) d[1]);
            p.setContent((String) d[2]);
            p.setActive(true);
            p.setUpdatedAt(LocalDateTime.now());
            repo.save(p);
        }
        System.out.println("WooAI policies initialized: " + defaults.length + " policies");
    }

    private void initializeRoutingRules(RoutingRuleRepository repo) {
        if (repo.count() > 0) return;
        Object[][] defaults = {
            {"order",      "AI Bot", "high"},
            {"track",      "AI Bot", "high"},
            {"return",     "AI Bot", "high"},
            {"refund",     "AI Bot", "high"},
            {"exchange",   "AI Bot", "medium"},
            {"shipping",   "AI Bot", "medium"},
            {"delivery",   "AI Bot", "medium"},
            {"payment",    "AI Bot", "medium"},
            {"cancel",     "AI Bot", "high"},
            {"damaged",    "AI Bot", "high"},
            {"warranty",   "AI Bot", "medium"},
            {"discount",   "AI Bot", "low"},
            {"complaint",  "Sneha R.", "high"},
            {"escalate",   "Arjun M.", "high"},
        };
        for (Object[] d : defaults) {
            RoutingRule r = new RoutingRule();
            r.setIntent((String) d[0]);
            r.setAssignee((String) d[1]);
            r.setPriority((String) d[2]);
            r.setActive(true);
            repo.save(r);
        }
        System.out.println("WooAI routing rules initialized: " + defaults.length + " rules");
    }

    private void initializeAgents(AgentRepository repo) {
        if (repo.count() > 0) return;
        String[][] defaults = {
            {"Sneha R.",   "Support Lead",       "online",   "3", "25", "#6d28d9"},
            {"Arjun M.",   "Senior Support",     "online",   "2", "20", "#0891b2"},
            {"Preethi K.", "Support",            "away",     "1", "20", "#16a34a"},
            {"Rahul N.",   "Technical Support",  "offline",  "0", "15", "#d97706"},
        };
        for (String[] d : defaults) {
            Agent a = new Agent();
            a.setName(d[0]);
            a.setRole(d[1]);
            a.setStatus(d[2]);
            a.setActiveChats(Integer.parseInt(d[3]));
            a.setCapacity(Integer.parseInt(d[4]));
            a.setColor(d[5]);
            repo.save(a);
        }
        System.out.println("WooAI agents initialized: " + defaults.length + " agents");
    }

}
