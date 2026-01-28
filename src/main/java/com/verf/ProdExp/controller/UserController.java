package com.verf.ProdExp.controller;

import com.verf.ProdExp.dto.*;
import com.verf.ProdExp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Validated
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isUserMatching(#id)")
    public ResponseEntity<UserResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(userService.getById(id));
    }

//    @PutMapping("/{id}")
//    @PreAuthorize("hasRole('ADMIN') or @securityService.isUserMatching(#id)")
//    public ResponseEntity<UserResponse> update(@PathVariable String id, @Valid @RequestBody UpdateUserRequest req) {
//        return ResponseEntity.ok(userService.update(id, req));
//    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isUserMatching(#id)")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/email")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isUserMatching(#id)")
    public ResponseEntity<UserResponse> updateEmail(@PathVariable String id, @Valid @RequestBody UpdateEmailRequest req) {
        return ResponseEntity.ok(userService.updateEmail(id, req));
    }

    @PatchMapping("/{id}/password")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isUserMatching(#id)")
    public ResponseEntity<Void> updatePassword(@PathVariable String id, @Valid @RequestBody UpdatePasswordRequest req) {
        // For security, do not return the user object after password change
        userService.updatePassword(id, req);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/displayName")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isUserMatching(#id)")
    public ResponseEntity<UserResponse> updateDisplayName(@PathVariable String id, @Valid @RequestBody UpdateDisplayNameRequest req) {
        return ResponseEntity.ok(userService.updateDisplayName(id, req));
    }
}
