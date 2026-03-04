package com.sreemarket.backend.service;

import com.sreemarket.backend.model.UserDevice;
import com.sreemarket.backend.repository.UserDeviceRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.session.SessionInformation;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserDeviceService {

    @Autowired
    private UserDeviceRepository userDeviceRepository;

    @Autowired
    private SessionRegistry sessionRegistry;

    @Transactional
    public void saveDevice(Long userId, Long roleId, HttpServletRequest request) {
        HttpSession session = request.getSession();
        String sessionId = session.getId();
        String userAgent = request.getHeader("User-Agent");
        String ipAddress = request.getRemoteAddr();

        Optional<UserDevice> existingDeviceOpt = userDeviceRepository.findBySessionId(sessionId);
        UserDevice device;

        if (existingDeviceOpt.isPresent()) {
            device = existingDeviceOpt.get();
        } else {
            device = new UserDevice();
            device.setSessionId(sessionId);
            device.setUserId(userId);
            device.setRoleId(roleId);
            device.setCreatedAt(System.currentTimeMillis());
        }

        device.setBrowser(parseBrowser(userAgent));
        device.setOs(parseOS(userAgent));
        device.setDeviceType(parseDeviceType(userAgent));
        device.setIpAddress(ipAddress);
        device.setLastActive(System.currentTimeMillis());

        userDeviceRepository.save(device);
    }

    public List<UserDevice> getDevicesForUser(Long userId, Long roleId) {
        return userDeviceRepository.findByUserIdAndRoleId(userId, roleId);
    }

    @Transactional
    public void logoutDevice(Long deviceId, Long userId, Long roleId) {
        UserDevice device = userDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        // Security check
        if (!device.getUserId().equals(userId) || !device.getRoleId().equals(roleId)) {
            throw new RuntimeException("Unauthorized to log out this device");
        }

        // Invalidate the Spring session
        SessionInformation sessionInformation = sessionRegistry.getSessionInformation(device.getSessionId());
        if (sessionInformation != null) {
            sessionInformation.expireNow();
        }

        // Remove from our tracking DB
        userDeviceRepository.delete(device);
    }

    private String parseBrowser(String userAgent) {
        if (userAgent == null)
            return "Unknown";
        if (userAgent.contains("Edg"))
            return "Edge";
        if (userAgent.contains("Chrome"))
            return "Chrome";
        if (userAgent.contains("Firefox"))
            return "Firefox";
        if (userAgent.contains("Safari"))
            return "Safari";
        return "Unknown Browser";
    }

    private String parseOS(String userAgent) {
        if (userAgent == null)
            return "Unknown";
        if (userAgent.contains("Windows"))
            return "Windows";
        if (userAgent.contains("Mac OS X"))
            return "macOS";
        if (userAgent.contains("Linux"))
            return "Linux";
        if (userAgent.contains("Android"))
            return "Android";
        if (userAgent.contains("iPhone") || userAgent.contains("iPad"))
            return "iOS";
        return "Unknown OS";
    }

    private String parseDeviceType(String userAgent) {
        if (userAgent == null)
            return "Desktop";
        if (userAgent.contains("Mobile") || userAgent.contains("Android") || userAgent.contains("iPhone")) {
            return "Mobile";
        }
        if (userAgent.contains("iPad") || userAgent.contains("Tablet")) {
            return "Tablet";
        }
        return "Desktop";
    }
}
