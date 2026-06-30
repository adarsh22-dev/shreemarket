package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Category;
import com.sreemarket.backend.model.SubCategory;
import com.sreemarket.backend.repository.CategoryRepository;
import com.sreemarket.backend.repository.SubCategoryRepository;
import com.sreemarket.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SubCategoryRepository subCategoryRepository;

    @Autowired
    private ProductRepository productRepository;

    // ── Categories ──

    public List<Map<String, Object>> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Category cat : categories) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", cat.getId());
            map.put("name", cat.getName());
            map.put("slug", cat.getSlug());
            map.put("description", cat.getDescription());
            map.put("status", cat.getStatus());
            map.put("featured", cat.isFeatured());
            map.put("image", cat.getImage());
            map.put("createdAt", cat.getCreatedAt());

            // Count products using this category name
            long productCount = productRepository.countByCategory(cat.getName());
            map.put("products", productCount);

            // Count subcategories
            long subCatCount = subCategoryRepository.findByCategoryId(cat.getId()).size();
            map.put("subCats", subCatCount);

            result.add(map);
        }

        return result;
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
    }

    @Transactional
    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }

    @Transactional
    public Category updateCategory(Long id, Category categoryData) {
        Category existing = getCategoryById(id);
        existing.setName(categoryData.getName());
        existing.setSlug(categoryData.getSlug());
        existing.setDescription(categoryData.getDescription());
        existing.setStatus(categoryData.getStatus());
        existing.setFeatured(categoryData.isFeatured());
        if (categoryData.getImage() != null) {
            existing.setImage(categoryData.getImage());
        }
        return categoryRepository.save(existing);
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = getCategoryById(id);
        // Delete associated subcategories first
        List<SubCategory> subs = subCategoryRepository.findByCategoryId(id);
        subCategoryRepository.deleteAll(subs);
        categoryRepository.delete(category);
    }

    // ── Sub-categories ──

    public List<Map<String, Object>> getAllSubCategories() {
        List<SubCategory> subs = subCategoryRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (SubCategory sub : subs) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", sub.getId());
            map.put("name", sub.getName());
            map.put("slug", sub.getSlug());
            map.put("status", sub.getStatus());
            map.put("sortOrder", sub.getSortOrder());
            map.put("createdAt", sub.getCreatedAt());
            map.put("parent", sub.getCategory().getName());
            map.put("parentId", sub.getCategory().getId());

            // Count products using this subcategory name
            long productCount = productRepository.countBySubCategory(sub.getName());
            map.put("products", productCount);

            result.add(map);
        }

        return result;
    }

    @Transactional
    public SubCategory createSubCategory(Long categoryId, SubCategory subCategory) {
        Category parent = getCategoryById(categoryId);
        subCategory.setCategory(parent);
        return subCategoryRepository.save(subCategory);
    }

    @Transactional
    public SubCategory updateSubCategory(Long id, Long categoryId, SubCategory subCategoryData) {
        SubCategory existing = subCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sub-category not found with id: " + id));

        existing.setName(subCategoryData.getName());
        existing.setSlug(subCategoryData.getSlug());
        existing.setStatus(subCategoryData.getStatus());
        existing.setSortOrder(subCategoryData.getSortOrder());

        if (categoryId != null && !categoryId.equals(existing.getCategory().getId())) {
            Category newParent = getCategoryById(categoryId);
            existing.setCategory(newParent);
        }

        return subCategoryRepository.save(existing);
    }

    @Transactional
    public void deleteSubCategory(Long id) {
        SubCategory sub = subCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sub-category not found with id: " + id));
        subCategoryRepository.delete(sub);
    }
}
