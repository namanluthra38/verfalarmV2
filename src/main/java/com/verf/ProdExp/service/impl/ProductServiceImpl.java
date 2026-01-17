package com.verf.ProdExp.service.impl;

import com.verf.ProdExp.dto.ProductRequest;
import com.verf.ProdExp.dto.ProductResponse;
import com.verf.ProdExp.dto.QuantityConsumedUpdateRequest;
import com.verf.ProdExp.entity.Product;
import com.verf.ProdExp.entity.NotificationFrequency;
import com.verf.ProdExp.exception.BadRequestException;
import com.verf.ProdExp.exception.ResourceNotFoundException;
import com.verf.ProdExp.mapper.ProductMapper;
import com.verf.ProdExp.repository.ProductRepository;
import com.verf.ProdExp.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository repository;

    @Override
    public ProductResponse create(ProductRequest request) {
        validateRequest(request);
        Product product = ProductMapper.toEntity(request);
        // ensure status is correct
        product.setStatus(ProductMapper.computeStatus(product));
        Product saved = repository.save(product);
        return ProductMapper.toResponse(saved);
    }

    @Override
    public ProductResponse getById(String id) {
        Product p = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product with id '" + id + "' not found"));
        return ProductMapper.toResponse(p);
    }

    @Override
    public List<ProductResponse> getAll() {
        return repository.findAll()
                .stream()
                .map(ProductMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ProductResponse update(String id, ProductRequest request) {
        validateRequest(request);
        Product existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product with id '" + id + "' not found"));

        // copy updatable fields
        existing.setUserId(request.userId());
        existing.setName(request.name());
        existing.setQuantityBought(request.quantityBought());
        existing.setQuantityConsumed(request.quantityConsumed());
        existing.setUnit(request.unit());
        existing.setPurchaseDate(request.purchaseDate());
        existing.setExpirationDate(request.expirationDate());
        // copy notificationFrequency (default to MONTHLY when client omits)
        existing.setNotificationFrequency(request.notificationFrequency() == null ? NotificationFrequency.MONTHLY : request.notificationFrequency());
        // copy tags (allow null or empty -> set null if empty to avoid storing empty arrays unnecessarily)
        existing.setTags(request.tags() == null || request.tags().isEmpty() ? null : List.copyOf(request.tags()));

        // recompute status
        existing.setStatus(ProductMapper.computeStatus(existing));

        Product saved = repository.save(existing);
        return ProductMapper.toResponse(saved);
    }

    @Override
    public void delete(String id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Product with id '" + id + "' not found");
        }
        repository.deleteById(id);
    }

    @Override
    public ProductResponse updateQuantityConsumed(String id, QuantityConsumedUpdateRequest request) {
        if (request == null) throw new BadRequestException("Request body is required");
        if (request.quantityConsumed() == null) throw new BadRequestException("quantityConsumed is required");
        if (request.quantityConsumed() < 0) throw new BadRequestException("quantityConsumed must be non-negative");

        Product existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product with id '" + id + "' not found"));

        if (request.quantityConsumed() > existing.getQuantityBought()) {
            throw new BadRequestException("quantityConsumed cannot exceed quantityBought");
        }

        existing.setQuantityConsumed(request.quantityConsumed());
        // recompute status after change
        existing.setStatus(ProductMapper.computeStatus(existing));

        Product saved = repository.save(existing);
        return ProductMapper.toResponse(saved);
    }

    @Override
    public Page<ProductResponse> getByUser(Pageable pageable, String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new BadRequestException("userId is required");
        }
        return repository.findByUserId(userId, pageable).map(ProductMapper::toResponse);
    }

    @Override
    public ProductResponse updateNotificationFrequency(String id, NotificationFrequency frequency) {
        if (frequency == null) throw new BadRequestException("notificationFrequency is required");
        Product existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product with id '" + id + "' not found"));
        existing.setNotificationFrequency(frequency);
        Product saved = repository.save(existing);
        return ProductMapper.toResponse(saved);
    }

    @Override
    public ProductResponse replaceTags(String id, List<String> tags) {
        Product existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product with id '" + id + "' not found"));
        existing.setTags(tags == null || tags.isEmpty() ? null : List.copyOf(tags));
        Product saved = repository.save(existing);
        return ProductMapper.toResponse(saved);
    }

    @Override
    public ProductResponse addTags(String id, List<String> tags) {
        if (tags == null || tags.isEmpty()) throw new BadRequestException("tags are required");
        Product existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product with id '" + id + "' not found"));
        Set<String> set = new HashSet<>();
        if (existing.getTags() != null) set.addAll(existing.getTags());
        for (String t : tags) if (t != null && !t.isBlank()) set.add(t.trim());
        existing.setTags(set.isEmpty() ? null : new ArrayList<>(set));
        Product saved = repository.save(existing);
        return ProductMapper.toResponse(saved);
    }

    @Override
    public ProductResponse removeTags(String id, List<String> tags) {
        if (tags == null || tags.isEmpty()) throw new BadRequestException("tags are required");
        Product existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product with id '" + id + "' not found"));
        if (existing.getTags() == null || existing.getTags().isEmpty()) return ProductMapper.toResponse(existing);
        Set<String> set = new HashSet<>(existing.getTags());
        for (String t : tags) if (t != null && !t.isBlank()) set.remove(t.trim());
        existing.setTags(set.isEmpty() ? null : new ArrayList<>(set));
        Product saved = repository.save(existing);
        return ProductMapper.toResponse(saved);
    }

    private void validateRequest(ProductRequest request) {
        if (request == null) throw new BadRequestException("Request body is required");

        if (isBlank(request.userId())) throw new BadRequestException("userId is required");
        if (isBlank(request.name())) throw new BadRequestException("name is required");
        if (isBlank(request.unit())) throw new BadRequestException("unit is required");

        if (request.quantityBought() == null || request.quantityBought() < 0)
            throw new BadRequestException("quantityBought must be non-negative");
        if (request.quantityConsumed() == null || request.quantityConsumed() < 0)
            throw new BadRequestException("quantityConsumed must be non-negative");
        if (request.quantityConsumed() > request.quantityBought())
            throw new BadRequestException("quantityConsumed cannot exceed quantityBought");

        if (request.expirationDate() == null) throw new BadRequestException("expirationDate is required");
        if (request.purchaseDate() != null && request.expirationDate().isBefore(request.purchaseDate()))
            throw new BadRequestException("expirationDate cannot be before purchaseDate");
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
