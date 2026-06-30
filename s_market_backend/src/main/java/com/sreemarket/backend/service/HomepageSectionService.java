package com.sreemarket.backend.service;

import com.sreemarket.backend.model.HomepageSection;
import com.sreemarket.backend.repository.HomepageSectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HomepageSectionService {

    @Autowired
    private HomepageSectionRepository repository;

    public List<HomepageSection> getVisibleSections() {
        return repository.findByVisibleTrueOrderBySortOrderAsc();
    }

    public List<HomepageSection> getAllSections() {
        return repository.findAllByOrderBySortOrderAsc();
    }

    public HomepageSection saveSection(HomepageSection section) {
        return repository.save(section);
    }

    public HomepageSection updateSection(Long id, HomepageSection updated) {
        HomepageSection existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Section not found"));
        existing.setSectionType(updated.getSectionType());
        existing.setSortOrder(updated.getSortOrder());
        existing.setVisible(updated.getVisible());
        existing.setLabel(updated.getLabel());
        existing.setConfigJson(updated.getConfigJson());
        return repository.save(existing);
    }

    public void deleteSection(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Section not found");
        }
        repository.deleteById(id);
    }

    public List<HomepageSection> saveAll(List<HomepageSection> sections) {
        repository.deleteAll();
        for (int i = 0; i < sections.size(); i++) {
            HomepageSection s = sections.get(i);
            s.setId(null);
            s.setSortOrder(i);
        }
        return repository.saveAll(sections);
    }
}
