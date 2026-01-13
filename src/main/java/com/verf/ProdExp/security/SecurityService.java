package com.verf.ProdExp.security;

import com.verf.ProdExp.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("securityService")
@RequiredArgsConstructor
public class SecurityService {
    private final ProductRepository repository;

    /**
     * Returns true if the current authenticated principal username equals the userId on the product.
     * Returns false if product not found or no authenticated user.
     */
    public boolean isProductOwner(String productId) {
        if (productId == null) return false;
        return repository.findById(productId)
                .map(p -> {
                    String owner = p.getUserId();
                    String current = currentUsername();
                    return current != null && current.equals(owner);
                })
                .orElse(false);
    }

    /**
     * Returns true if current authenticated username equals supplied userId.
     */
    public boolean isUserMatching(String userId) {
        if (userId == null) return false;
        String current = currentUsername();
        return current != null && current.equals(userId);
    }

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        return auth.getName();
    }
}
