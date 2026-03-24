package com.verf.ProdExp.security.oauth2;

import com.verf.ProdExp.entity.User;

/**
 * Shared interface for both CustomOAuth2User and CustomOidcUser
 * to expose the underlying application User entity without instanceof checks.
 */
public interface OAuth2AuthenticatedPrincipal {
    User getUser();
}
