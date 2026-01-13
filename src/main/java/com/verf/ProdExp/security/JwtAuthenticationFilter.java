package com.verf.ProdExp.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtProvider jwtProvider;
    private final UserDetailsService userDetailsService; // should be the repo-backed service (Primary)

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        try {
            String header = request.getHeader("Authorization");
            String token = null;

            if (header != null && !header.isBlank()) {
                // case-insensitive Bearer prefix
                token = header.replaceFirst("(?i)Bearer\\s+", "").trim();
                // remove surrounding quotes if any
                if ((token.startsWith("\"") && token.endsWith("\"")) || (token.startsWith("\'") && token.endsWith("\'"))) {
                    token = token.substring(1, token.length() - 1);
                }
                log.debug("Authorization header found, extracted token length={}", token.length());
            }

            // fallback: accept token as query parameter `token` (useful for debugging/testing)
            if ((token == null || token.isBlank()) && request.getParameter("token") != null) {
                token = request.getParameter("token").trim();
                log.debug("Found token in query parameter, length={}", token.length());
            }

            if (token != null && !token.isBlank()) {
                String subject = jwtProvider.validateAndGetSubject(token);
                log.debug("JWT validated, subject={}", subject);
                UserDetails userDetails = userDetailsService.loadUserByUsername(subject);
                if (userDetails != null) {
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    log.debug("Authentication set for user id={}", subject);
                } else {
                    log.warn("UserDetailsService returned null for subject={}", subject);
                }
            } else {
                log.debug("No JWT token provided in request");
            }
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            log.warn("JWT processing failed: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
