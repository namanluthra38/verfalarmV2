package com.verf.ProdExp.security.oauth2;

import org.springframework.security.oauth2.core.user.OAuth2User;

/**
 * Normalises differences between GitHub, Google, etc. into one shape.
 * Add a new static factory method for each provider you add later.
 */
public record OAuthUserInfo(String email, String displayName, String provider) {
    public static OAuthUserInfo fromGitHub(OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        String login = oAuth2User.getAttribute("login");
        String name  = oAuth2User.getAttribute("name");
        // GitHub users can have a private (null) email — use login as stable fallback
        String resolvedEmail = (email != null && !email.isBlank())
                ? email
                : login + "@github.noemail";
        return new OAuthUserInfo(
                resolvedEmail,
                name != null ? name : login,
                "GITHUB"
        );
    }

    public static OAuthUserInfo fromGoogle(OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        String name  = oAuth2User.getAttribute("name");
        // Google always provides email, fallback to email if name is missing
        return new OAuthUserInfo(
                email,
                name != null ? name : email,
                "GOOGLE"
        );
    }
}
