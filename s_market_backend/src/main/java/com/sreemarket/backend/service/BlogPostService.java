package com.sreemarket.backend.service;

import com.sreemarket.backend.model.BlogPost;
import com.sreemarket.backend.repository.BlogPostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class BlogPostService {

    @Autowired
    private BlogPostRepository blogPostRepository;

    public List<BlogPost> getAll() {
        return blogPostRepository.findAll();
    }

    public List<BlogPost> getPublished() {
        return blogPostRepository.findAll().stream()
                .filter(p -> "published".equalsIgnoreCase(p.getStatus()))
                .toList();
    }

    public BlogPost getById(Long id) {
        return blogPostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Blog post not found with id: " + id));
    }

    public BlogPost create(BlogPost post) {
        if (post.getDate() == null || post.getDate().isEmpty()) {
            post.setDate(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        }
        if (post.getSlug() == null || post.getSlug().isEmpty()) {
            post.setSlug(post.getTitle().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", ""));
        }
        if (post.getViews() == null) post.setViews(0);
        if (post.getComments() == null) post.setComments(0);
        if (post.getReadMin() == null) post.setReadMin(3);
        return blogPostRepository.save(post);
    }

    public BlogPost update(Long id, BlogPost updated) {
        BlogPost existing = getById(id);
        if (updated.getTitle() != null) existing.setTitle(updated.getTitle());
        if (updated.getCategory() != null) existing.setCategory(updated.getCategory());
        if (updated.getAuthor() != null) existing.setAuthor(updated.getAuthor());
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
        if (updated.getTags() != null) existing.setTags(updated.getTags());
        if (updated.getDate() != null) existing.setDate(updated.getDate());
        if (updated.getSlug() != null) existing.setSlug(updated.getSlug());
        if (updated.getMetaTitle() != null) existing.setMetaTitle(updated.getMetaTitle());
        if (updated.getMetaDesc() != null) existing.setMetaDesc(updated.getMetaDesc());
        return blogPostRepository.save(existing);
    }

    public void delete(Long id) {
        if (!blogPostRepository.existsById(id)) {
            throw new RuntimeException("Blog post not found with id: " + id);
        }
        blogPostRepository.deleteById(id);
    }
}
