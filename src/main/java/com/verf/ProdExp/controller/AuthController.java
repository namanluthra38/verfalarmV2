package com.verf.ProdExp.controller;

import com.verf.ProdExp.dto.AuthResponse;
import com.verf.ProdExp.dto.LoginRequest;
import com.verf.ProdExp.dto.RegisterRequest;
import com.verf.ProdExp.dto.UserResponse;
import com.verf.ProdExp.entity.User;
import com.verf.ProdExp.repository.UserRepository;
import com.verf.ProdExp.security.JwtProvider;
import com.verf.ProdExp.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest req) {
        UserResponse created = userService.register(req);
        return ResponseEntity.ok(created);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email(), req.password())
            );
            SecurityContextHolder.getContext().setAuthentication(auth);

            // find user by email to fetch id
            User user = userRepository.findByEmail(req.email()).orElseThrow(() -> new RuntimeException("User not found after authentication"));
            String token = jwtProvider.generateToken(user.getId());
            return ResponseEntity.ok(new AuthResponse(token, "Bearer", user.getId()));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(HttpServletRequest request) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        // log for debugging
        org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthController.class);
        String header = request.getHeader("Authorization");
        log.debug("/api/auth/me called. Authorization header='{}', SecurityContext.auth={}", header, auth);

        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            log.debug("Unauthenticated request to /me: auth={}", auth);
            return ResponseEntity.status(401).build();
        }
        String userId = auth.getName();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.debug("Authenticated principal but user not found in DB: userId={}", userId);
            return ResponseEntity.status(404).build();
        }
        UserResponse resp = new UserResponse(user.getId(), user.getEmail(), user.getRoles(), user.isEnabled(), user.getDisplayName(), user.getCreatedAt(), user.getUpdatedAt());
        log.debug("/me returning userId={}", userId);
        return ResponseEntity.ok(resp);
    }
}
