package com.verf.ProdExp.security.oauth2;

import com.verf.ProdExp.entity.User;
import com.verf.ProdExp.entity.User;
import lombok.RequiredArgsConstructor;

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
    private final OAuth2UserRegistrationService registrationService;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);
        OAuthUserInfo info = OAuthUserInfo.fromGoogle(oidcUser);
        User user = registrationService.findOrCreate(info);
        return new CustomOidcUser(oidcUser, user);
    }


}

