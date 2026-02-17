package com.verf.ProdExp.service;

import com.verf.ProdExp.dto.ProductRequest;
import com.verf.ProdExp.dto.ProductResponse;
import com.verf.ProdExp.dto.QuantityConsumedUpdateRequest;
import com.verf.ProdExp.entity.NotificationFrequency;
import com.verf.ProdExp.entity.Status;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface ProductService {
    ProductResponse create(ProductRequest request);
    ProductResponse getById(String id);
    List<ProductResponse> getAll();
    ProductResponse update(String id, ProductRequest request);
    void delete(String id);
    // Update only the quantityConsumed field with validation
    ProductResponse updateQuantityConsumed(String id, QuantityConsumedUpdateRequest request);
    // Retrieve all products for a given user (paginated)
    Page<ProductResponse> getByUser(Pageable pageable, String userId);
    // Retrieve all products for a given user (paginated) with optional filters
    Page<ProductResponse> getByUser(Pageable pageable, String userId, @Nullable List<Status> statuses, @Nullable List<NotificationFrequency> frequencies);
    // Recompute and persist statuses for all products of a user. Returns number of products updated.
    int recomputeStatusesForUser(String userId);
    // Update notification frequency for a product
    ProductResponse updateNotificationFrequency(String id, NotificationFrequency frequency);
    // Replace the tags list entirely
    ProductResponse replaceTags(String id, List<String> tags);
    // Add tags (ignore duplicates)
    ProductResponse addTags(String id, List<String> tags);
    // Remove tags if present
    ProductResponse removeTags(String id, List<String> tags);
    Map<String, Object> analyzeById(String id);

    // Search products by name for a specific user (paginated). Query is matched against nameLower as a prefix for index-friendly searching.
    Page<ProductResponse> searchByUser(Pageable pageable, String userId, String query);
}

