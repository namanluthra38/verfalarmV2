package com.verf.ProdExp.service.impl;

import com.verf.ProdExp.dto.*;
import com.verf.ProdExp.entity.User;
import com.verf.ProdExp.exception.BadRequestException;
import com.verf.ProdExp.exception.ResourceNotFoundException;
import com.verf.ProdExp.repository.UserRepository;
import com.verf.ProdExp.repository.ProductRepository;
import com.verf.ProdExp.service.MailService;
import com.verf.ProdExp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    @Override
    public UserResponse register(RegisterRequest req) {
        if (req == null) throw new BadRequestException("Request body is required");
        if (req.email() == null || req.email().trim().isEmpty()) throw new BadRequestException("email is required");
        if (req.password() == null || req.password().length() < 6) throw new BadRequestException("password must be at least 6 characters");

        if (userRepository.existsByEmail(req.email())) {
            throw new BadRequestException("Email already registered");
        }

        User u = User.builder()
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .roles(Set.of("USER"))
                .enabled(true)
                .displayName(req.displayName())
                .emailVerified(true)
                .build();

        User saved = userRepository.save(u);
        mailService.sendWelcomeEmail(saved);
        return new UserResponse(saved.getId(), saved.getEmail(), saved.getRoles(), saved.isEnabled(), saved.getDisplayName(), saved.getCreatedAt(), saved.getUpdatedAt());
    }

    @Override
    public UserResponse getById(String id) {
        User u = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return new UserResponse(u.getId(), u.getEmail(), u.getRoles(), u.isEnabled(), u.getDisplayName(), u.getCreatedAt(), u.getUpdatedAt());
    }

    @Override
    public UserResponse update(String id, UpdateUserRequest request) {
        User existing = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (request == null) throw new BadRequestException("Request body is required");

        if (request.email() != null && !request.email().equalsIgnoreCase(existing.getEmail())) {
            if (userRepository.existsByEmail(request.email())) throw new BadRequestException("Email already in use");
            existing.setEmail(request.email());
        }
        if (request.password() != null && request.password().length() >= 6) {
            existing.setPassword(passwordEncoder.encode(request.password()));
        }
        if (request.displayName() != null) {
            existing.setDisplayName(request.displayName());
        }
        if (request.enabled() != null) {
            // only allow admins to change the enabled flag
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = auth != null && auth.getAuthorities() != null && auth.getAuthorities().stream()
                    .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
            if (!isAdmin) {
                throw new AccessDeniedException("Only administrators can change enabled status");
            }
            existing.setEnabled(request.enabled());
        }
        User saved = userRepository.save(existing);
        return new UserResponse(saved.getId(), saved.getEmail(), saved.getRoles(), saved.isEnabled(), saved.getDisplayName(), saved.getCreatedAt(), saved.getUpdatedAt());
    }

    @Override
    @Transactional
    public void delete(String id) {
        if (!userRepository.existsById(id)) throw new ResourceNotFoundException("User not found");

        try {
            productRepository.deleteByUserId(id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete user's products", e);
        }

        userRepository.deleteById(id);
    }

    @Override
    public UserResponse updateEmail(String id, UpdateEmailRequest request) {
        return null;
    }

    @Override
    public void updatePassword(String id, UpdatePasswordRequest request) {
        if (request == null) throw new BadRequestException("Request body is required");
        if (request.currentPassword() == null || request.currentPassword().isBlank()) throw new BadRequestException("currentPassword is required");
        if (request.newPassword() == null || request.newPassword().length() < 6) throw new BadRequestException("newPassword must be at least 6 characters");

        User existing = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // verify current password matches stored one
        if (!passwordEncoder.matches(request.currentPassword(), existing.getPassword())) {
            throw new BadRequestException("currentPassword is incorrect");
        }

        // don't allow setting same password
        if (passwordEncoder.matches(request.newPassword(), existing.getPassword())) {
            throw new BadRequestException("newPassword must be different from current password");
        }

        existing.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(existing);
    }

    @Override
    public UserResponse updateDisplayName(String id, UpdateDisplayNameRequest request) {
        if (request == null) throw new BadRequestException("Request body is required");
        if (request.displayName() == null || request.displayName().isBlank()) throw new BadRequestException("displayName is required");

        User existing = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        existing.setDisplayName(request.displayName());
        User saved = userRepository.save(existing);
        return new UserResponse(saved.getId(), saved.getEmail(), saved.getRoles(), saved.isEnabled(), saved.getDisplayName(), saved.getCreatedAt(), saved.getUpdatedAt());
    }
}
