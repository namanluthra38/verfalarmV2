package com.verf.ProdExp.repository;

import com.verf.ProdExp.entity.NotificationFrequency;
import com.verf.ProdExp.entity.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductRepositoryCustom {
    Page<com.verf.ProdExp.entity.Product> findByUserIdWithFilters(String userId, List<Status> statuses, List<NotificationFrequency> frequencies, Pageable pageable);

    // custom paginated prefix search on nameLower for a user
    Page<com.verf.ProdExp.entity.Product> searchByUserNamePrefix(String userId, String nameLowerPrefix, Pageable pageable);
}
