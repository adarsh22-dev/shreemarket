'use client';

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Loader2, X, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { BACKEND_URL } from '@/lib/api/shared';
import './InstagramFeed.css';

const extractShortcode = (url) => {
  if (!url) return null;
  const match = url.match(/(?:instagram\.com\/p\/|instagram\.com\/reel\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

const getEmbedUrl = (url) => {
  const shortcode = extractShortcode(url);
  return shortcode ? `https://www.instagram.com/p/${shortcode}/embed/` : null;
};

const getProductImage = (product) => {
  if (!product?.media?.length) return 'https://placehold.co/400x400?text=No+Image';
  const primary = product.media.find(m => m.isPrimary) || product.media[0];
  if (!primary?.fileName) return 'https://placehold.co/400x400?text=No+Image';
  if (primary.fileName.startsWith('http://') || primary.fileName.startsWith('https://')) return primary.fileName;
  return `${process.env.NEXT_PUBLIC_BACKEND_URL || BACKEND_URL}/uploads/products/${primary.fileName}`;
};

const getInstaThumbnail = (product) => {
  const instaMedia = product?.media?.find(m => m.fileType === 'instagram-url' && m.fileName);
  if (!instaMedia?.fileName) return getProductImage(product);
  if (instaMedia.customThumbnail) return `${BACKEND_URL}/uploads/products/${instaMedia.customThumbnail}`;
  return getProductImage(product);
};

const InstagramFeed = ({ products, maxPosts = 3, storyShape = 'circle' }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [feedScrollIndex, setFeedScrollIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const feedTrackRef = useRef(null);

  const productsWithInsta = useMemo(() =>
    (products || []).filter(p =>
      p?.media?.some(m => m.fileType === 'instagram-url' && m.fileName)
    ).slice(0, maxPosts),
    [products, maxPosts]
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedProduct(null);
    setCurrentPostIndex(0);
  }, []);

  const openModal = (product) => {
    setSelectedProduct(product);
    setCurrentPostIndex(0);
    setModalOpen(true);
  };

  const instagramMedia = selectedProduct?.media?.filter(m => m.fileType === 'instagram-url' && m.fileName) || [];

  const updateScrollButtons = useCallback(() => {
    const track = feedTrackRef.current;
    if (!track) return;
    setCanScrollLeft(track.scrollLeft > 0);
    setCanScrollRight(track.scrollLeft < track.scrollWidth - track.clientWidth - 1);
  }, []);

  const scrollFeed = (direction) => {
    const track = feedTrackRef.current;
    if (!track) return;
    const itemWidth = 80 + 24;
    const scrollAmount = direction === 'left' ? -itemWidth : itemWidth;
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(updateScrollButtons, 300);
  };

  const handleScroll = useCallback(() => {
    updateScrollButtons();
  }, [updateScrollButtons]);

  useEffect(() => {
    updateScrollButtons();
    const track = feedTrackRef.current;
    if (track) {
      track.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (track) track.removeEventListener('scroll', handleScroll);
    };
  }, [productsWithInsta.length, handleScroll, updateScrollButtons]);

  return (
    <div className="instagram-feed">
      <div className="feed-stories-container">
        {productsWithInsta.length > 3 && (
          <button
            type="button"
            className="feed-nav-arrow feed-nav-arrow-left"
            onClick={(e) => { e.preventDefault(); scrollFeed('left'); }}
            disabled={!canScrollLeft}
            aria-label="Scroll stories left"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="feed-stories" ref={feedTrackRef} onScroll={handleScroll}>
          {productsWithInsta.map((product) => (
            <div
              key={product.id}
              className={`story-circle ${storyShape === 'square' ? 'story-circle--square' : ''} active`}
              onClick={() => openModal(product)}
            >
            <img
              src={getInstaThumbnail(product)}
              alt={product.name}
              className="story-image"
              onError={(e) => {
                e.target.style.display = 'none';
                const fb = e.target.nextElementSibling;
                if (fb) fb.style.display = 'flex';
              }}
            />
            <div className="story-placeholder" style={{ display: 'none' }}>
              <Loader2 size={24} />
            </div>
            <div className="story-ring"></div>
          </div>
        ))}
        {productsWithInsta.length > 3 && (
          <button
            type="button"
            className="feed-nav-arrow feed-nav-arrow-right"
            onClick={(e) => { e.preventDefault(); scrollFeed('right'); }}
            disabled={!canScrollRight}
            aria-label="Scroll stories right"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {modalOpen && selectedProduct && (
        <div className="insta-story-overlay" onClick={closeModal}>
          <div className="insta-story-modal" onClick={(e) => e.stopPropagation()}>
            <button className="insta-story-close" onClick={closeModal}>
              <X size={20} />
            </button>

            <div className="insta-story-body">
              <div className="insta-story-embed">
                {instagramMedia[currentPostIndex]?.fileName ? (
                  <iframe
                    src={getEmbedUrl(instagramMedia[currentPostIndex].fileName)}
                    title="Instagram content"
                    className="insta-story-iframe"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    scrolling="no"
                  />
                ) : (
                  <div className="insta-story-embed-placeholder">
                    <Loader2 size={32} />
                  </div>
                )}
              </div>

              <div className="insta-story-product">
                <div className="insta-story-product-image-wrapper">
                  <img
                    src={getProductImage(selectedProduct)}
                    alt={selectedProduct.name}
                    className="insta-story-product-image"
                  />
                </div>
                <div className="insta-story-product-info">
                  <h3 className="insta-story-product-name">{selectedProduct.name}</h3>
                  <div className="insta-story-product-pricing">
                    <span className="insta-story-product-price">
                      ₹{((selectedProduct.discountPrice || selectedProduct.regularPrice) || 0).toFixed(2)}
                    </span>
                    {selectedProduct.discountPrice && selectedProduct.regularPrice > selectedProduct.discountPrice && (
                      <span className="insta-story-product-old-price">
                        <s>₹{selectedProduct.regularPrice.toFixed(2)}</s>
                        <span className="insta-story-discount-badge">
                          -{Math.round(((selectedProduct.regularPrice - selectedProduct.discountPrice) / selectedProduct.regularPrice) * 100)}%
                        </span>
                      </span>
                    )}
                  </div>
                  <button
                    className="insta-story-shop-btn"
                    onClick={() => window.open(`/product/${selectedProduct.id}`, '_self')}
                  >
                    <ShoppingBag size={14} /> Shop Now
                  </button>
                </div>
              </div>
            </div>

            {instagramMedia.length > 1 && (
              <div className="insta-story-nav">
                <button
                  className="insta-story-nav-btn"
                  onClick={() => setCurrentPostIndex(prev => (prev - 1 + instagramMedia.length) % instagramMedia.length)}
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="insta-story-counter">
                  {currentPostIndex + 1} / {instagramMedia.length}
                </span>
                <button
                  className="insta-story-nav-btn"
                  onClick={() => setCurrentPostIndex(prev => (prev + 1) % instagramMedia.length)}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstagramFeed;
