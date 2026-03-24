package com.verf.ProdExp.security.oauth2;

import com.verf.ProdExp.entity.User;
import com.verf.ProdExp.entity.User;
import lombok.RequiredArgsConstructor;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final OAuth2UserRegistrationService registrationService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 1. Fetch raw user from provider (GitHub API call happens here)
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // 2. Normalise into our OAuthUserInfo shape
        String registrationId = userRequest.getClientRegistration().getRegistrationId().toUpperCase();
        OAuthUserInfo info = switch (registrationId) {
            case "GITHUB" -> OAuthUserInfo.fromGitHub(oAuth2User);
            case "GOOGLE" -> OAuthUserInfo.fromGoogle(oAuth2User);
            default -> throw new OAuth2AuthenticationException("Unsupported provider: " + registrationId);
        };

        // 3. Find-or-create with merge
        User user = registrationService.findOrCreate(info);

        return new CustomOAuth2User(oAuth2User, user);
    }


}