package com.verf.ProdExp.security.oauth2;

import com.verf.ProdExp.entity.User;
import com.verf.ProdExp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomOidcUserService extends OidcUserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);
        OAuthUserInfo info = OAuthUserInfo.fromGoogle(oidcUser);
        User user = findOrCreate(info);
        return new CustomOidcUser(oidcUser, user);
    }

    private User findOrCreate(OAuthUserInfo info) {
        return userRepository.findByEmail(info.email()).map(existing -> {
            if (existing.getOauthProviders() == null) {
                existing.setOauthProviders(new HashSet<>());
            }
            if (!existing.getOauthProviders().contains(info.provider())) {
                existing.getOauthProviders().add(info.provider());
                existing.setEmailVerified(true);
                userRepository.save(existing);
            }
            return existing;
        }).orElseGet(() -> {
            String randomPassword = passwordEncoder.encode(UUID.randomUUID().toString());
            User newUser = User.builder()
                    .email(info.email())
                    .password(randomPassword)
                    .displayName(info.displayName())
                    .roles(Set.of("USER"))
                    .enabled(true)
                    .emailVerified(true)
                    .oauthProviders(new HashSet<>(Set.of(info.provider())))
                    .build();
            return userRepository.save(newUser);
        });
    }
}

