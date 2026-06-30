package com.sreemarket.backend.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

@Component
@Order(1)
public class MaintenanceFilter implements Filter {

    private static boolean maintenanceMode = false;
    private static final Set<String> bypassPaths = new HashSet<>();

    static {
        bypassPaths.add("/api/login");
        bypassPaths.add("/api/logout");
        bypassPaths.add("/api/admin/maintenance");
        bypassPaths.add("/api/settings");
    }

    public static void setMaintenanceMode(boolean mode) {
        maintenanceMode = mode;
    }

    public static boolean isMaintenanceMode() {
        return maintenanceMode;
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        String path = request.getRequestURI();

        if (maintenanceMode && !bypassPaths.contains(path) && !path.startsWith("/uploads/")) {
            response.setStatus(503);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Platform is under maintenance. Please try again later.\", \"maintenance\": true}");
            return;
        }

        chain.doFilter(request, response);
    }
}
