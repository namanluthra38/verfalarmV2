package com.verf.ProdExp.controller;

import com.verf.ProdExp.dto.ProductRequest;
import com.verf.ProdExp.dto.ProductResponse;
import com.verf.ProdExp.dto.QuantityConsumedUpdateRequest;
import com.verf.ProdExp.entity.NotificationFrequency;
import com.verf.ProdExp.entity.Status;
import com.verf.ProdExp.exception.BadRequestException;
import com.verf.ProdExp.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.*;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Validated
public class ProductController {

    private static final Logger log = LoggerFactory.getLogger(ProductController.class);

    private final ProductService productService;

    // allowed sortable fields — keep in sync with Product entity/dto fields
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "name",
            "purchaseDate", "expirationDate", "createdAt",
            "percentageLeft" // computed: (bought - consumed)/bought * 100
    );

    private String getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("User is not authenticated");
        }

        Object principal = auth.getPrincipal();
        log.debug("Authenticated principal type={} principal={}", principal == null ? "null" : principal.getClass().getName(), principal);

        if (principal instanceof String s) {
            if ("anonymousUser".equals(s)) throw new AuthenticationCredentialsNotFoundException("User is not authenticated");
            return s;
        }
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        // fallback: try toString()
        if (principal != null) {
            return principal.toString();
        }
        throw new AuthenticationCredentialsNotFoundException("Unable to determine authenticated user id");
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        String currentUserId = getAuthenticatedUserId();
        ProductRequest toSave = ProductRequest.of(
                currentUserId,
                request.name(),
                request.quantityBought(),
                request.quantityConsumed(),
                request.unit(),
                request.purchaseDate(),
                request.expirationDate(),
                request.tags()
        );
        log.debug("Creating product for userId={} name={}", currentUserId, request.name());
        ProductResponse created = productService.create(toSave);
        return ResponseEntity.created(URI.create("/api/products/" + created.id())).body(created);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isProductOwner(#id)")
    public ResponseEntity<ProductResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @GetMapping("/analyze/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isProductOwner(#id)")
    public ResponseEntity<Map<String, Object>> AnalyzeById(@PathVariable String id) {
        return ResponseEntity.ok(productService.AnalyzeById(id));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isUserMatching(#userId)")
    public ResponseEntity<Page<ProductResponse>> getByUser(@PathVariable String userId,
                                                           @RequestParam(required = false, defaultValue = "0") int pageNumber,
                                                           @RequestParam(required = false, defaultValue = "10") int pageSize,
                                                           @RequestParam(required = false, defaultValue = "name") String sortBy,
                                                           @RequestParam(required = false, defaultValue = "asc") String sortDirection,
                                                           // filters — can be provided multiple times: ?status=AVAILABLE&status=FINISHED
                                                           @RequestParam(required = false) List<String> status,
                                                           @RequestParam(required = false) List<String> notificationFrequency) {
        if (pageNumber < 0) throw new BadRequestException("pageNumber must be >= 0");
        if (pageSize <= 0) throw new BadRequestException("pageSize must be > 0");

        if (!ALLOWED_SORT_FIELDS.contains(sortBy)) {
            throw new BadRequestException("Invalid sortBy field: " + sortBy + ". Allowed: " + ALLOWED_SORT_FIELDS);
        }

        List<Status> statuses = null;
        if (status != null && !status.isEmpty()) {
            statuses = new ArrayList<>();
            for (String s : status) {
                try {
                    statuses.add(Status.valueOf(s.toUpperCase()));
                } catch (IllegalArgumentException e) {
                    throw new BadRequestException("Invalid status value: " + s);
                }
            }
        }

        List<NotificationFrequency> frequencies = null;
        if (notificationFrequency != null && !notificationFrequency.isEmpty()) {
            frequencies = new ArrayList<>();
            for (String nf : notificationFrequency) {
                try {
                    frequencies.add(NotificationFrequency.valueOf(nf.toUpperCase()));
                } catch (IllegalArgumentException e) {
                    throw new BadRequestException("Invalid notificationFrequency value: " + nf);
                }
            }
        }

        // special-case computed field: percentageLeft
        if ("percentageLeft".equals(sortBy)) {
            // Fetch ALL products for this user with filters applied
            PageRequest fetchAll = PageRequest.of(0, Integer.MAX_VALUE);
            Page<ProductResponse> allProducts = productService.getByUser(fetchAll, userId, statuses, frequencies);

            // Sort all products by percentage
            List<ProductResponse> allSorted = new ArrayList<>(allProducts.getContent());
            allSorted.sort(Comparator.comparingDouble(p -> {
                Double bought = p.quantityBought() == null ? 0.0 : p.quantityBought().doubleValue();
                Double consumed = p.quantityConsumed() == null ? 0.0 : p.quantityConsumed().doubleValue();
                if (bought == 0.0) return 0.0;
                return ((bought - consumed) / bought) * 100.0;
            }));

            if ("desc".equalsIgnoreCase(sortDirection)) {
                Collections.reverse(allSorted);
            }

            // Now extract the requested page from the sorted list
            int start = pageNumber * pageSize;
            int end = Math.min(start + pageSize, allSorted.size());
            List<ProductResponse> pageContent = start < allSorted.size()
                    ? allSorted.subList(start, end)
                    : Collections.emptyList();

            PageRequest pageable = PageRequest.of(pageNumber, pageSize);
            Page<ProductResponse> result = new PageImpl<>(pageContent, pageable, allSorted.size());
            return ResponseEntity.ok(result);
        }

        Sort sort = sortDirection.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PageRequest pageable = PageRequest.of(pageNumber, pageSize, sort);
        return ResponseEntity.ok(productService.getByUser(pageable, userId, statuses, frequencies));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isProductOwner(#id)")
    public ResponseEntity<ProductResponse> update(@PathVariable String id, @Valid @RequestBody ProductRequest request) {
        // use helper to safely obtain authenticated user id (throws nicely if unauthenticated)
        String currentUserId = getAuthenticatedUserId();
        ProductRequest toUpdate = ProductRequest.of(
                currentUserId,
                request.name(),
                request.quantityBought(),
                request.quantityConsumed(),
                request.unit(),
                request.purchaseDate(),
                request.expirationDate(),
                request.tags()
        );
        return ResponseEntity.ok(productService.update(id, toUpdate));
    }

    @PatchMapping("/{id}/quantity-consumed")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isProductOwner(#id)")
    public ResponseEntity<ProductResponse> updateQuantityConsumed(@PathVariable String id,
                                                                  @Valid @RequestBody QuantityConsumedUpdateRequest request) {
        return ResponseEntity.ok(productService.updateQuantityConsumed(id, request));
    }

    @PatchMapping("/{id}/notification-frequency")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isProductOwner(#id)")
    public ResponseEntity<ProductResponse> updateNotificationFrequency(@PathVariable String id,
                                                                       @Valid @RequestBody com.verf.ProdExp.dto.NotificationFrequencyUpdateRequest request) {
        return ResponseEntity.ok(productService.updateNotificationFrequency(id, request.notificationFrequency()));
    }

    @PutMapping("/{id}/tags")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isProductOwner(#id)")
    public ResponseEntity<ProductResponse> replaceTags(@PathVariable String id,
                                                       @Valid @RequestBody com.verf.ProdExp.dto.TagsUpdateRequest request) {
        return ResponseEntity.ok(productService.replaceTags(id, request.tags()));
    }

    @PostMapping("/{id}/tags")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isProductOwner(#id)")
    public ResponseEntity<ProductResponse> addTags(@PathVariable String id,
                                                   @Valid @RequestBody com.verf.ProdExp.dto.TagsUpdateRequest request) {
        return ResponseEntity.ok(productService.addTags(id, request.tags()));
    }

    @DeleteMapping("/{id}/tags")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isProductOwner(#id)")
    public ResponseEntity<ProductResponse> removeTags(@PathVariable String id,
                                                      @Valid @RequestBody com.verf.ProdExp.dto.TagsUpdateRequest request) {
        return ResponseEntity.ok(productService.removeTags(id, request.tags()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isProductOwner(#id)")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/user/{userId}/recompute-statuses")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isUserMatching(#userId)")
    public ResponseEntity<Map<String, Object>> recomputeStatusesForUser(@PathVariable String userId) {
        int updated = productService.recomputeStatusesForUser(userId);
        Map<String, Object> resp = new HashMap<>();
        resp.put("updatedCount", updated);
        resp.put("userId", userId);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/user/{userId}/search")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isUserMatching(#userId)")
    public ResponseEntity<org.springframework.data.domain.Page<ProductResponse>> searchByUser(@PathVariable String userId,
                                                                                             @RequestParam(required = false, defaultValue = "") String q,
                                                                                             @RequestParam(required = false, defaultValue = "0") int pageNumber,
                                                                                             @RequestParam(required = false, defaultValue = "10") int pageSize,
                                                                                             @RequestParam(required = false, defaultValue = "name") String sortBy,
                                                                                             @RequestParam(required = false, defaultValue = "asc") String sortDirection) {
        if (pageNumber < 0) throw new BadRequestException("pageNumber must be >= 0");
        if (pageSize <= 0) throw new BadRequestException("pageSize must be > 0");

        if (!ALLOWED_SORT_FIELDS.contains(sortBy)) {
            throw new BadRequestException("Invalid sortBy field: " + sortBy + ". Allowed: " + ALLOWED_SORT_FIELDS);
        }

        Sort sort = sortDirection.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        org.springframework.data.domain.PageRequest pageable = org.springframework.data.domain.PageRequest.of(pageNumber, pageSize, sort);

        return ResponseEntity.ok(productService.searchByUser(pageable, userId, q == null ? "" : q));
    }
}
