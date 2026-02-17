package com.verf.ProdExp.repository;

import com.verf.ProdExp.entity.Product;
import com.verf.ProdExp.entity.Status;
import com.verf.ProdExp.entity.NotificationFrequency;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends MongoRepository<Product, String>, ProductRepositoryCustom {
    Page<Product> findByUserId(String userId, Pageable pageable);
    List<Product> findAllByUserId(String userId);
    void deleteByUserId(String userId);
    List<Product> findByUserIdAndNameLowerStartingWith(
            String userId,
            String nameLower
    );

    // Indexed prefix search by normalized name for simple use-cases
    Page<Product> findByUserIdAndNameLowerStartingWith(String userId, String nameLower, Pageable pageable);
}
