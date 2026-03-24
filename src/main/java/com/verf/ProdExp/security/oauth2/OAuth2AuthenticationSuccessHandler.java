package com.verf.ProdExp.security.oauth2;

import com.verf.ProdExp.security.JwtProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Value("${app.frontendBaseUrl}")
    private String frontendBaseUrl;

    private final JwtProvider jwtProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        Object principal = authentication.getPrincipal();
        com.verf.ProdExp.entity.User user;
        if (principal instanceof OAuth2AuthenticatedPrincipal authenticatedPrincipal) {
            user = authenticatedPrincipal.getUser();
        } else {
            throw new IllegalStateException("Unsupported principal type: " + principal.getClass());
        }
        String token = jwtProvider.generateToken(user.getId());
        String redirectUrl = UriComponentsBuilder
                .fromUriString(frontendBaseUrl + "/oauth2/callback")
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}