package com.verf.ProdExp.service;

import com.verf.ProdExp.dto.ProductRequest;
import com.verf.ProdExp.dto.ProductResponse;
import com.verf.ProdExp.dto.QuantityConsumedUpdateRequest;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

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

}
