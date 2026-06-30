package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.OnboardingStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OnboardingStepRepository extends JpaRepository<OnboardingStep, Long> {
}
