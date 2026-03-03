package com.sreemarket.backend.service;

import com.sreemarket.backend.model.User;
import com.sreemarket.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public User registerUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        if (userRepository.existsByPhone(user.getPhone())) {
            throw new RuntimeException("Phone number already in use");
        }

        // Encrypt password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Assign default role (Customer) if not provided
        if (user.getRoleId() == null) {
            user.setRoleId(2L);
        }

        // Set registration time
        user.setCreatedAt(System.currentTimeMillis());

        return userRepository.save(user);
    }

    public User loginUser(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
        return user;
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateUser(Long id, User updatedUser) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate and update Full Name
        if (updatedUser.getFullName() == null || updatedUser.getFullName().trim().isEmpty()) {
            throw new RuntimeException("Full name cannot be empty");
        }
        existingUser.setFullName(updatedUser.getFullName().trim());

        // Validate and update Email
        if (updatedUser.getEmail() != null && !updatedUser.getEmail().trim().isEmpty()
                && !updatedUser.getEmail().equalsIgnoreCase(existingUser.getEmail())) {

            if (userRepository.existsByEmail(updatedUser.getEmail())) {
                throw new RuntimeException("Email already in use");
            }
            existingUser.setEmail(updatedUser.getEmail().trim());
        }

        // Validate and update Phone
        if (updatedUser.getPhone() != null && !updatedUser.getPhone().trim().isEmpty()
                && !updatedUser.getPhone().equals(existingUser.getPhone())) {

            if (userRepository.existsByPhone(updatedUser.getPhone())) {
                throw new RuntimeException("Phone number already in use");
            }
            existingUser.setPhone(updatedUser.getPhone().trim());
        }

        return userRepository.save(existingUser);
    }

    public User loginOrRegisterGoogleUser(String idTokenString) {
        try {
            com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier verifier = new com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier.Builder(
                    new com.google.api.client.http.javanet.NetHttpTransport(),
                    new com.google.api.client.json.gson.GsonFactory())
                    .setAudience(java.util.Collections.singletonList("YOUR_GOOGLE_CLIENT_ID"))
                    .build();

            com.google.api.client.googleapis.auth.oauth2.GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = idToken.getPayload();
                String email = payload.getEmail();
                String name = (String) payload.get("name");

                return userRepository.findByEmail(email).orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setFullName(name);
                    newUser.setPassword("GOOGLE_AUTH_USER");
                    newUser.setPhone("");
                    newUser.setCreatedAt(System.currentTimeMillis());
                    return userRepository.save(newUser);
                });
            } else {
                throw new RuntimeException("Invalid ID token.");
            }
        } catch (Exception e) {
            throw new RuntimeException("Token verification failed: " + e.getMessage());
        }
    }

    public void generateResetToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = "TEST_TOKEN_12345";
        user.setResetToken(token);
        // Set expiry to 1 hour from now (in milliseconds)
        user.setResetTokenExpiry(System.currentTimeMillis() + 3600000);
        userRepository.save(user);

        // Simulate sending email
        System.out.println("--------------------------------------------------");
        System.out.println("PASSWORD RESET LINK: http://localhost:5173/reset-password?token=" + token);
        System.out.println("--------------------------------------------------");

        try (java.io.FileWriter writer = new java.io.FileWriter("reset_token.txt")) {
            writer.write(token);
        } catch (java.io.IOException e) {
            e.printStackTrace();
        }
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        // Check if token is expired
        if (user.getResetTokenExpiry() < System.currentTimeMillis()) {
            throw new RuntimeException("Token expired");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

}
