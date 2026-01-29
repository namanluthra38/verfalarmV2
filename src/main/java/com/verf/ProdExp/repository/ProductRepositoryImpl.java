package com.verf.ProdExp.repository;

import com.verf.ProdExp.entity.NotificationFrequency;
import com.verf.ProdExp.entity.Product;
import com.verf.ProdExp.entity.Status;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class ProductRepositoryImpl implements ProductRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    @Override
    public Page<Product> findByUserIdWithFilters(String userId, List<Status> statuses, List<NotificationFrequency> frequencies, Pageable pageable) {
        Query q = new Query();
        List<Criteria> criteria = new ArrayList<>();
        criteria.add(Criteria.where("userId").is(userId));

        if (statuses != null && !statuses.isEmpty()) {
            criteria.add(Criteria.where("status").in(statuses));
        }

        if (frequencies != null && !frequencies.isEmpty()) {
            criteria.add(Criteria.where("notificationFrequency").in(frequencies));
        }

        q.addCriteria(new Criteria().andOperator(criteria.toArray(new Criteria[0])));

        long total = mongoTemplate.count(q, Product.class);

        // apply sort & pagination from pageable
        if (pageable.getSort().isSorted()) {
            pageable.getSort().forEach(order -> q.with(org.springframework.data.domain.Sort.by(order)));
        }

        q.with(pageable);

        List<Product> list = mongoTemplate.find(q, Product.class);
        return new PageImpl<>(list, pageable, total);
    }
}

