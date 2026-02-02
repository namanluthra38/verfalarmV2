package com.verf.ProdExp.service.impl;

import com.verf.ProdExp.dto.ProductRequest;
import com.verf.ProdExp.dto.ProductResponse;
import com.verf.ProdExp.dto.QuantityConsumedUpdateRequest;
import com.verf.ProdExp.entity.Product;
import com.verf.ProdExp.entity.NotificationFrequency;
import com.verf.ProdExp.entity.Status;
import com.verf.ProdExp.exception.BadRequestException;
import com.verf.ProdExp.exception.ResourceNotFoundException;
import com.verf.ProdExp.mapper.ProductMapper;
import com.verf.ProdExp.repository.ProductRepository;
import com.verf.ProdExp.service.ProductService;
import com.verf.ProdExp.util.AnalysisUtil;
import com.verf.ProdExp.util.NotificationFrequencyCalculator;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
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
        // ensure nameLower is stored for indexed search
        if (product.getName() != null) product.setNameLower(product.getName().toLowerCase().trim());
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
    public Map<String, Object> AnalyzeById(String id) {
        Product p = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product with id '" + id + "' not found"));
        return AnalysisUtil.analyze(p);
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
        // compute notificationFrequency using utility (do not rely on client)
        existing.setNotificationFrequency(NotificationFrequencyCalculator.calculate(
                request.purchaseDate(), request.expirationDate(), request.quantityBought(), request.quantityConsumed()
        ));
        // copy tags (allow null or empty -> set null if empty to avoid storing empty arrays unnecessarily)
        existing.setTags(request.tags() == null || request.tags().isEmpty() ? null : List.copyOf(request.tags()));

        // ensure nameLower is updated when name changes
        if (existing.getName() != null) existing.setNameLower(existing.getName().toLowerCase().trim());

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
    public Page<ProductResponse> getByUser(Pageable pageable, String userId, @Nullable List<Status> statuses, @Nullable List<NotificationFrequency> frequencies) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new BadRequestException("userId is required");
        }

        // if no filters provided, delegate to existing method
        if ((statuses == null || statuses.isEmpty()) && (frequencies == null || frequencies.isEmpty())) {
            return getByUser(pageable, userId);
        }

        return repository.findByUserIdWithFilters(userId, statuses, frequencies, pageable).map(ProductMapper::toResponse);
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

    @Override
    public int recomputeStatusesForUser(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new BadRequestException("userId is required");
        }

        // fetch all products for user
        List<Product> products = repository.findAllByUserId(userId);
        int changed = 0;
        List<Product> toSave = new ArrayList<>();
        for (Product p : products) {
            Status computed = ProductMapper.computeStatus(p);
            if (p.getStatus() != computed) {
                p.setStatus(computed);
                toSave.add(p);
            }
        }
        if (!toSave.isEmpty()) {
            repository.saveAll(toSave);
            changed = toSave.size();
        }
        return changed;
    }

    @Override
    public Page<ProductResponse> searchByUser(Pageable pageable, String userId, String query) {
        if (userId == null || userId.trim().isEmpty()) throw new BadRequestException("userId is required");
        // normalize query to lower-case and trim; empty query returns empty page
        String q = query == null ? "" : query.trim().toLowerCase();
        if (q.isEmpty()) {
            // return empty page rather than all products to avoid expensive queries
            return Page.empty(pageable);
        }

        Page<com.verf.ProdExp.entity.Product> page = repository.searchByUserNamePrefix(userId, q, pageable);
        return page.map(ProductMapper::toResponse);
    }

    private void validateRequest(ProductRequest request) {
        if (request == null) throw new BadRequestException("Request body is required");

        if (isBlank(request.userId())) throw new BadRequestException("userId is required");
        if (isBlank(request.name())) throw new BadRequestException("name is required");
        if (isBlank(String.valueOf(request.unit()))) throw new BadRequestException("unit is required");

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
