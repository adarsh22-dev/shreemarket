package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Currency;
import com.sreemarket.backend.repository.CurrencyRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class CurrencyService {

    @Autowired
    private CurrencyRepository repository;

    private static final List<CurrencySeed> DEFAULT_CURRENCIES = Arrays.asList(
        new CurrencySeed("INR", "Indian Rupee", "₹", 1.0, 2, "Base currency — Indian Rupee"),
        new CurrencySeed("USD", "US Dollar", "$", 83.50, 2, "United States Dollar"),
        new CurrencySeed("EUR", "Euro", "€", 90.20, 2, "Eurozone currency"),
        new CurrencySeed("GBP", "British Pound", "£", 105.80, 2, "British Pound Sterling"),
        new CurrencySeed("AED", "UAE Dirham", "د.إ", 22.75, 2, "United Arab Emirates Dirham"),
        new CurrencySeed("SAR", "Saudi Riyal", "﷼", 22.25, 2, "Saudi Riyal"),
        new CurrencySeed("SGD", "Singapore Dollar", "S$", 62.30, 2, "Singapore Dollar"),
        new CurrencySeed("AUD", "Australian Dollar", "A$", 54.60, 2, "Australian Dollar"),
        new CurrencySeed("CAD", "Canadian Dollar", "C$", 61.20, 2, "Canadian Dollar"),
        new CurrencySeed("JPY", "Japanese Yen", "¥", 0.56, 0, "Japanese Yen (no decimals)")
    );

    @PostConstruct
    public void seedDefaults() {
        if (repository.count() > 0) return;
        for (CurrencySeed seed : DEFAULT_CURRENCIES) {
            Currency c = new Currency();
            c.setCode(seed.code);
            c.setName(seed.name);
            c.setSymbol(seed.symbol);
            c.setExchangeRate(seed.rate);
            c.setDecimalPlaces(seed.decimals);
            c.setDescription(seed.desc);
            c.setIsActive(true);
            c.setIsDefault("INR".equals(seed.code));
            repository.save(c);
        }
    }

    public List<Currency> getAll() {
        return repository.findAll();
    }

    public List<Currency> getActive() {
        return repository.findByIsActiveTrue();
    }

    public Currency getDefault() {
        return repository.findByIsDefaultTrue().orElseThrow(() -> new RuntimeException("No default currency configured"));
    }

    public Currency getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Currency not found with id: " + id));
    }

    public Currency getByCode(String code) {
        return repository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Currency not found with code: " + code));
    }

    public Currency create(Currency currency) {
        if (currency.getCode() != null) currency.setCode(currency.getCode().toUpperCase().trim());
        if (currency.getCode() == null || currency.getCode().isEmpty()) {
            throw new RuntimeException("Currency code is required");
        }
        if (repository.existsByCode(currency.getCode())) {
            throw new RuntimeException("Currency with code " + currency.getCode() + " already exists");
        }
        if (currency.getExchangeRate() == null || currency.getExchangeRate() <= 0) {
            throw new RuntimeException("Exchange rate must be greater than 0");
        }
        if (currency.getDecimalPlaces() == null) currency.setDecimalPlaces(2);
        if (currency.getIsActive() == null) currency.setIsActive(true);
        if (currency.getIsDefault() != null && currency.getIsDefault()) {
            clearOtherDefaults(null);
        }
        return repository.save(currency);
    }

    public Currency update(Long id, Currency updated) {
        Currency existing = getById(id);
        if (updated.getCode() != null) existing.setCode(updated.getCode().toUpperCase().trim());
        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getSymbol() != null) existing.setSymbol(updated.getSymbol());
        if (updated.getExchangeRate() != null) {
            if (updated.getExchangeRate() <= 0) throw new RuntimeException("Exchange rate must be greater than 0");
            existing.setExchangeRate(updated.getExchangeRate());
        }
        if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
        if (updated.getDecimalPlaces() != null) existing.setDecimalPlaces(updated.getDecimalPlaces());
        if (updated.getIsActive() != null) existing.setIsActive(updated.getIsActive());

        if (updated.getIsDefault() != null && updated.getIsDefault() && !Boolean.TRUE.equals(existing.getIsDefault())) {
            clearOtherDefaults(id);
            existing.setIsDefault(true);
        } else if (updated.getIsDefault() != null) {
            existing.setIsDefault(updated.getIsDefault());
        }

        return repository.save(existing);
    }

    public Currency toggleStatus(Long id) {
        Currency existing = getById(id);
        existing.setIsActive(!existing.getIsActive());
        return repository.save(existing);
    }

    public void delete(Long id) {
        Currency c = getById(id);
        if (Boolean.TRUE.equals(c.getIsDefault())) {
            throw new RuntimeException("Cannot delete the default currency");
        }
        repository.deleteById(id);
    }

    public double convert(double amount, String fromCode, String toCode) {
        Currency from = getByCode(fromCode);
        Currency to = getByCode(toCode);
        // Convert: amount / fromRate * toRate
        double inBase = amount / from.getExchangeRate();
        return inBase * to.getExchangeRate();
    }

    private void clearOtherDefaults(Long excludeId) {
        List<Currency> defaults = repository.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsDefault()))
                .toList();
        for (Currency d : defaults) {
            if (excludeId == null || !d.getId().equals(excludeId)) {
                d.setIsDefault(false);
                repository.save(d);
            }
        }
    }

    private static class CurrencySeed {
        final String code, name, symbol, desc;
        final double rate;
        final int decimals;
        CurrencySeed(String code, String name, String symbol, double rate, int decimals, String desc) {
            this.code = code; this.name = name; this.symbol = symbol;
            this.rate = rate; this.decimals = decimals; this.desc = desc;
        }
    }
}
