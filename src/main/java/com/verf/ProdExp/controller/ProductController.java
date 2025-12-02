package com.verf.ProdExp.controller;

import com.verf.ProdExp.dto.ProductRequest;
import com.verf.ProdExp.dto.ProductResponse;
import com.verf.ProdExp.dto.QuantityConsumedUpdateRequest;
import com.verf.ProdExp.exception.BadRequestException;
import com.verf.ProdExp.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.Set;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Validated
public class ProductController {

    private final ProductService productService;

    // allowed sortable fields — keep in sync with Product entity/dto fields
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id", "userId", "name", "quantityBought", "quantityConsumed", "unit",
            "purchaseDate", "expirationDate", "createdAt", "updatedAt", "status"
    );

    @PostMapping
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        ProductResponse created = productService.create(request);
        return ResponseEntity.created(URI.create("/api/products/" + created.id())).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<ProductResponse>> getByUserId(@PathVariable String userId,
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
        PageRequest pageable = PageRequest.of(pageNumber, pageSize, sort);
        return ResponseEntity.ok(productService.getByUserId(pageable, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> update(@PathVariable String id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.update(id, request));
    }

    @PatchMapping("/{id}/quantity-consumed")
    public ResponseEntity<ProductResponse> updateQuantityConsumed(@PathVariable String id,
                                                                  @Valid @RequestBody QuantityConsumedUpdateRequest request) {
        return ResponseEntity.ok(productService.updateQuantityConsumed(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
