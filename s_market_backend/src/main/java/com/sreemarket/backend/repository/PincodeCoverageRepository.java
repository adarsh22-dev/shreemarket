package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.PincodeCoverage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PincodeCoverageRepository extends JpaRepository<PincodeCoverage, Long> {

    /** Find all active couriers covering a pincode */
    @Query("SELECT pc FROM PincodeCoverage pc WHERE pc.pincode = :pincode AND pc.isActive = true AND pc.isBlocked = false")
    List<PincodeCoverage> findActiveByPincode(@Param("pincode") String pincode);

    /** Find active coverage for a specific courier + pincode */
    @Query("SELECT pc FROM PincodeCoverage pc WHERE pc.courierCode = :courierCode AND pc.pincode = :pincode AND pc.isActive = true")
    List<PincodeCoverage> findByCourierAndPincode(
        @Param("courierCode") String courierCode,
        @Param("pincode") String pincode
    );

    /** Check if a pincode is explicitly blocked */
    @Query("SELECT pc FROM PincodeCoverage pc WHERE pc.pincode = :pincode AND pc.isBlocked = true")
    List<PincodeCoverage> findBlockedByPincode(@Param("pincode") String pincode);

    /** Find all pincodes covered by a courier */
    List<PincodeCoverage> findByCourierCodeAndIsActiveTrue(String courierCode);
}
