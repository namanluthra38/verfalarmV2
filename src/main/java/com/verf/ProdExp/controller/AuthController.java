package com.verf.ProdExp.controller;

import com.verf.ProdExp.dto.AuthResponse;
import com.verf.ProdExp.dto.LoginRequest;
import com.verf.ProdExp.dto.RegisterRequest;
import com.verf.ProdExp.dto.UserResponse;
import com.verf.ProdExp.entity.User;
import com.verf.ProdExp.repository.UserRepository;
import com.verf.ProdExp.security.JwtProvider;
import com.verf.ProdExp.service.MailService;
import com.verf.ProdExp.service.UserService;
import com.verf.ProdExp.service.VerificationTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    private final VerificationTokenService verificationTokenService;
    private final MailService mailService;

    // Frontend base URL to redirect users after verification. Default points to dev frontend (5173).
    @Value("${app.frontendBaseUrl:http://localhost:5173}")
    private String frontendBaseUrl;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest req) {
        UserResponse created = userService.register(req);

        // find user entity and create/send verification token
//        User user = userRepository.findByEmail(created.email()).orElse(null);
//        if (user != null) {
//            verificationTokenService.createAndSendToken(user);
//        }


        return ResponseEntity.ok(created);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email(), req.password())
            );
            SecurityContextHolder.getContext().setAuthentication(auth);

            // find user by email to fetch id and check verification
            User user = userRepository.findByEmail(req.email()).orElseThrow(() -> new RuntimeException("User not found after authentication"));

            if (!user.isEmailVerified()) {
                return ResponseEntity.status(403).build();
            }

            String token = jwtProvider.generateToken(user.getId());
            return ResponseEntity.ok(new AuthResponse(token, "Bearer", user.getId()));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(HttpServletRequest request) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
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

    @GetMapping("/verify-email")
    public ResponseEntity<String> verify(@RequestParam("token") String token) {
        org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthController.class);
        log.info("/api/auth/verify-email called with token (first 8 chars)={}", token == null ? "(null)" : token.substring(0, Math.min(8, token.length())));
        var optUserId = verificationTokenService.verifyToken(token);
        log.info("Verification result present={}", optUserId.isPresent());
        String target;
        String title;
        String message;
        if (optUserId.isPresent()) {
            String userId = optUserId.get();
            log.info("Token verified for userId={}", userId);
            // generate JWT and include in redirect so frontend can auto-login
            String jwt = jwtProvider.generateToken(userId);
            String encodedJwt = URLEncoder.encode(jwt, StandardCharsets.UTF_8);
            // include token as both query param and fragment to be robust across clients
            target = frontendBaseUrl + "/verify-success?status=success&token=" + encodedJwt + "#status=success&token=" + encodedJwt;
            log.info("Redirect target={}", target);
            title = "Email verified";
            message = "Thank you! Your email has been verified. Redirecting you to the app...";
        } else {
            log.warn("Token verification failed for token (first 8)={}", token == null ? "(null)" : token.substring(0, Math.min(8, token.length())));
            target = frontendBaseUrl + "/verify-success?status=error&message=" + URLEncoder.encode("Verification failed or token expired", StandardCharsets.UTF_8);
            title = "Verification failed";
            message = "The verification link is invalid or has expired. You can request a new verification email from your account settings.";
        }

        String html = "<!doctype html>"
                + "<html><head><meta charset=\"utf-8\"><meta http-equiv=\"refresh\" content=\"3;url=" + target + "\"/>"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>"
                + "<title>" + title + "</title></head>"
                + "<body style=\"font-family:Arial,Helvetica,sans-serif;background:linear-gradient(to bottom right, #fffbeb, #ecfdf5);margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;\">"
                + "<div style=\"max-width:672px;width:100%;padding:32px;background:#fff;border-radius:16px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);text-align:center;\">"
                + "<h2 style=\"color:#065f46;font-size:24px;font-weight:600;margin:0 0 16px 0;\">" + title + "</h2>"
                + "<p style=\"color:#374151;margin:0 0 24px 0;line-height:1.5;\">" + message + "</p>"
                + "<p style=\"margin:0 0 12px 0;\"><a id=\"open-app\" href=\"" + target + "\" style=\"display:inline-block;background:#059669;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:500;\">Open App</a></p>"
                + "<p style=\"margin:12px 0 0 0;font-size:14px;color:#9ca3af;\">If you are not redirected automatically, click the button above.</p>"
                + "</div>\n"
                + "<script>\n"
                + "  try {\n"
                + "    // Attempt immediate client-side redirect to preserve fragments across some clients\n"
                + "    window.location.replace(\"" + target.replace("\"", "\\\"") + "\");\n"
                + "  } catch(e) { console.error('redirect failed', e); }\n"
                + "</script>\n"
                + "</body></html>";

        return ResponseEntity.status(302)
                .header("Location", target)
                .header("Content-Type", "text/html; charset=utf-8")
                .body(html);
    }
}
