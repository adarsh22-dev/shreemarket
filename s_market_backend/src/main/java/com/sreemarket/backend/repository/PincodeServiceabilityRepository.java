package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.PincodeServiceability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PincodeServiceabilityRepository extends JpaRepository<PincodeServiceability, Long> {

    /** Find a cached result for a specific origin-destination-courier combination */
    @Query("SELECT ps FROM PincodeServiceability ps WHERE ps.originPincode = :origin AND ps.destinationPincode = :dest AND ps.courierCode = :courier")
    Optional<PincodeServiceability> findByRouteAndCourier(
        @Param("origin") String origin,
        @Param("dest") String dest,
        @Param("courier") String courier
    );

    /** Find all cached results for a destination pincode (across all couriers) */
    List<PincodeServiceability> findByDestinationPincode(String destinationPincode);

    /** Find non-expired cache entries for a destination */
    @Query("SELECT ps FROM PincodeServiceability ps WHERE ps.destinationPincode = :dest AND ps.expiresAt > :now")
    List<PincodeServiceability> findValidByDestination(
        @Param("dest") String dest,
        @Param("now") Long now
    );

    /** Find non-expired cache entry for an origin + destination */
    Optional<PincodeServiceability> findByOriginPincodeAndDestinationPincodeAndExpiresAtGreaterThan(
        String originPincode, String destinationPincode, Long now);

    /** Count valid (non-expired) entries for a destination */
    long countByDestinationPincodeAndExpiresAtGreaterThan(String destinationPincode, Long now);

    /** Delete all expired cache entries (maintenance) */
    @Modifying
    @Query("DELETE FROM PincodeServiceability ps WHERE ps.expiresAt < :now")
    int deleteExpired(@Param("now") Long now);
}
