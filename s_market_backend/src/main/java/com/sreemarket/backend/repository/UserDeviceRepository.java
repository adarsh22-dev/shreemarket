package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.UserDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface UserDeviceRepository extends JpaRepository<UserDevice, Long> {
    List<UserDevice> findByUserIdAndRoleId(Long userId, Long roleId);

    List<UserDevice> findByUserIdInAndRoleId(Set<Long> userIds, Long roleId);

    Optional<UserDevice> findBySessionId(String sessionId);

    void deleteBySessionId(String sessionId);
}
