package com.sreemarket.backend;

import com.sreemarket.backend.model.*;
import com.sreemarket.backend.repository.*;
import com.sreemarket.backend.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.ResponseEntity;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest
class NewFeaturesTests {

    // ── Gift Wrapping Tests ──
    @Test
    void testGiftWrappingModel() {
        GiftWrapping gw = new GiftWrapping();
        gw.setOptionName("Premium Wrap");
        gw.setDescription("Gold foil wrapping with ribbon");
        gw.setPrice(49.0);
        gw.setActive(true);
        assertEquals("Premium Wrap", gw.getOptionName());
        assertEquals(49.0, gw.getPrice());
        assertTrue(gw.getActive());
    }

    // ── Competitor Price Tests ──
    @Test
    void testCompetitorPriceModel() {
        CompetitorPrice cp = new CompetitorPrice();
        cp.setProductId(1L);
        cp.setCompetitorName("Amazon");
        cp.setPrice(599.0);
        cp.setInStock(true);
        cp.setLastChecked(System.currentTimeMillis());
        assertEquals("Amazon", cp.getCompetitorName());
        assertEquals(599.0, cp.getPrice());
        assertTrue(cp.getInStock());
    }

    @Test
    void testCompetitorPriceComparison() {
        CompetitorPriceService service = new CompetitorPriceService();
        CompetitorPriceRepository mockRepo = mock(CompetitorPriceRepository.class);

        // Inject mock via reflection
        try {
            java.lang.reflect.Field repoField = CompetitorPriceService.class.getDeclaredField("competitorPriceRepository");
            repoField.setAccessible(true);
            repoField.set(service, mockRepo);
        } catch (Exception e) {
            fail("Reflection failed: " + e.getMessage());
        }

        List<CompetitorPrice> competitors = new ArrayList<>();
        CompetitorPrice cp1 = new CompetitorPrice();
        cp1.setCompetitorName("Flipkart");
        cp1.setPrice(649.0);
        cp1.setInStock(true);
        competitors.add(cp1);

        CompetitorPrice cp2 = new CompetitorPrice();
        cp2.setCompetitorName("Amazon");
        cp2.setPrice(599.0);
        cp2.setInStock(true);
        competitors.add(cp2);

        when(mockRepo.findByProductId(1L)).thenReturn(competitors);

        Map<String, Object> result = service.getPriceComparison(1L, 629.0);
        assertNotNull(result);
        assertEquals(1L, result.get("productId"));
        assertEquals(629.0, result.get("ourPrice"));
        assertEquals(2, result.get("competitorCount"));
    }

    // ── Store Tests ──
    @Test
    void testStoreModel() {
        Store store = new Store();
        store.setStoreName("Test Store");
        store.setCity("Mumbai");
        store.setState("Maharashtra");
        store.setDescription("A test store");
        assertEquals("Test Store", store.getStoreName());
        assertEquals("Mumbai", store.getCity());
    }

    // ── Review Video Support Tests ──
    @Test
    void testReviewVideoSupport() {
        Review review = new Review();
        review.setVideos(new ArrayList<>());
        review.getVideos().add("video1.mp4");
        review.getVideos().add("video2.mp4");
        assertEquals(2, review.getVideos().size());
        assertTrue(review.getVideos().contains("video1.mp4"));
    }

    // ── Product Sharing Tests ──
    @Test
    void testWishlistShareAPIData() {
        Map<String, Object> shareData = new HashMap<>();
        shareData.put("wishlistId", 1L);
        shareData.put("recipientEmail", "friend@example.com");
        shareData.put("message", "Check out my wishlist!");
        assertEquals("friend@example.com", shareData.get("recipientEmail"));
        assertNotNull(shareData.get("wishlistId"));
    }

    // ── Multi-Store Tests ──
    @Test
    void testVendorMultipleStores() {
        Vendor vendor = new Vendor();
        vendor.setId(1L);
        vendor.setFullName("Multi-Store Vendor");

        Store store1 = new Store();
        store1.setStoreName("Store Alpha");
        store1.setVendor(vendor);

        Store store2 = new Store();
        store2.setStoreName("Store Beta");
        store2.setVendor(vendor);

        List<Store> stores = new ArrayList<>();
        stores.add(store1);
        stores.add(store2);
        vendor.setStores(stores);

        assertEquals(2, vendor.getStores().size());
        assertEquals("Store Alpha", vendor.getStores().get(0).getStoreName());
        assertEquals("Store Beta", vendor.getStores().get(1).getStoreName());
    }
}
