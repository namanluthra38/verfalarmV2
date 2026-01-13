package com.verf.ProdExp.security;

import com.verf.ProdExp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Primary
@Service("jwtUserDetailsService")
@RequiredArgsConstructor
public class JwtUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrId) throws UsernameNotFoundException {
        // Try by email first, then by id
        return userRepository.findByEmail(usernameOrId)
                .or(() -> userRepository.findById(usernameOrId))
                .map(u -> org.springframework.security.core.userdetails.User.builder()
                        .username(u.getId()) // store id as principal name to be consistent with JWT subject
                        .password(u.getPassword())
                        .disabled(!u.isEnabled())
                        .authorities(toAuthorities(u.getRoles()))
                        .build()
                ).orElseThrow(() -> new UsernameNotFoundException("User '" + usernameOrId + "' not found"));
    }

    private Set<GrantedAuthority> toAuthorities(Set<String> roles) {
        if (roles == null) return Set.of();
        return roles.stream()
                .map(r -> r.startsWith("ROLE_") ? r : "ROLE_" + r)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());
    }
}
