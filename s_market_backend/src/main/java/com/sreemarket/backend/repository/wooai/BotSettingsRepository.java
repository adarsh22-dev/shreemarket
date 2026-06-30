package com.sreemarket.backend.repository.wooai;

import com.sreemarket.backend.model.wooai.BotSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BotSettingsRepository extends JpaRepository<BotSettings, Long> {
}
