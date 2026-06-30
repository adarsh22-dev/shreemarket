package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.SubscriberList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubscriberListRepository extends JpaRepository<SubscriberList, Long> {}
