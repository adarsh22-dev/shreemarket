package com.sreemarket.backend.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class AuthUtil {

    public static Long getAuthenticatedUserId(HttpServletRequest request) {
        Object userIdAttr = request.getSession().getAttribute("userId");
        if (userIdAttr instanceof Number) {
            return ((Number) userIdAttr).longValue();
        }
        return null;
    }

    public static boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated() && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    public static boolean isVendor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated() && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_VENDOR"));
    }

    public static boolean isOwnerOrAdmin(Long targetUserId, HttpServletRequest request) {
        if (isAdmin()) return true;
        Long currentUserId = getAuthenticatedUserId(request);
        return currentUserId != null && currentUserId.equals(targetUserId);
    }
}
