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
import java.util.regex.Pattern;
import java.util.stream.Collectors;

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

    @Override
    public Page<Product> searchByUserNamePrefix(String userId, String nameLowerPrefix, Pageable pageable) {
        Query q = new Query();
        List<Criteria> criteria = new ArrayList<>();
        criteria.add(Criteria.where("userId").is(userId));

        if (nameLowerPrefix != null && !nameLowerPrefix.isEmpty()) {
            // Tokenize the query and require each token to appear somewhere in nameLower (AND semantics).
            // This makes queries like "milk" match "dairy milk", and "dairy milk" match both tokens.
            String[] rawTokens = nameLowerPrefix.split("\\s+");
            // Prefer tokens of length >= 2 to avoid extremely broad single-character matches; if all tokens are short, fall back to rawTokens
            List<String> tokens = java.util.Arrays.stream(rawTokens)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());

            List<String> effective = tokens.stream().filter(t -> t.length() >= 2).collect(Collectors.toList());
            if (effective.isEmpty()) {
                effective = tokens;
            }

            for (String tok : effective) {
                // Use an unanchored, escaped regex so we match substrings anywhere in nameLower
                Pattern p = Pattern.compile("^" + Pattern.quote(tok));
                criteria.add(Criteria.where("nameLower").regex(p));
            }
        }

        q.addCriteria(new Criteria().andOperator(criteria.toArray(new Criteria[0])));

        long total = mongoTemplate.count(q, Product.class);

        if (pageable.getSort().isSorted()) {
            pageable.getSort().forEach(order -> q.with(org.springframework.data.domain.Sort.by(order)));
        }

        q.with(pageable);

        List<Product> list = mongoTemplate.find(q, Product.class);
        return new PageImpl<>(list, pageable, total);
    }
}
