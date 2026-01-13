package com.verf.ProdExp.service.impl;

import com.verf.ProdExp.dto.RegisterRequest;
import com.verf.ProdExp.dto.UserResponse;
import com.verf.ProdExp.entity.User;
import com.verf.ProdExp.exception.BadRequestException;
import com.verf.ProdExp.repository.UserRepository;
import com.verf.ProdExp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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
                .build();

        User saved = userRepository.save(u);
        return new UserResponse(saved.getId(), saved.getEmail(), saved.getRoles(), saved.isEnabled(), saved.getCreatedAt(), saved.getUpdatedAt());
    }
}

