import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, ShieldCheck, Pause, Play } from 'lucide-react';
import { getActiveTestimonials, BACKEND_URL } from '../api/api';
import './TestimonialCarousel.css';

/* ── Helpers ── */
const avatarColor = (name) => `hsl(${(name || '').length * 47 + 15}, 60%, 55%)`;

const getProductImg = (t) => {
  if (!t.productImage) return null;
  return t.productImage.startsWith('http') ? t.productImage : `${BACKEND_URL}/uploads/products/${t.productImage}`;
};

/* ── Star Rating ── */
const Stars = ({ rating, size = 15 }) => (
  <span className="tst-stars">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        size={size}
        fill={i <= rating ? '#f59e0b' : 'none'}
        color={i <= rating ? '#f59e0b' : '#cbd5e1'}
        strokeWidth={1.5}
      />
    ))}
  </span>
);

/* ── Single Testimonial Card ── */
function TestimonialCard({ testimonial: t, compact }) {
  const pImg = getProductImg(t);
  return (
    <div className="tst-card">
      {pImg && (
        <div className="tst-card-banner">
          <img src={pImg} alt={t.productName || ''} />
          <div className="tst-card-banner-overlay" />
          {t.productName && (
            <span className="tst-card-product-tag">{t.productName}</span>
          )}
        </div>
      )}
      <div className="tst-card-body">
        <div className="tst-card-quote-deco">
          <Quote size={compact ? 32 : 48} />
        </div>
        <div className="tst-card-meta">
          <Stars rating={t.rating} size={compact ? 14 : 18} />
          {t.verified && (
            <span className="tst-verified">
              <ShieldCheck size={14} /> Verified
            </span>
          )}
        </div>
        {t.title && <h3 className="tst-card-title">{t.title}</h3>}
        <blockquote className="tst-card-text">
          &ldquo;{t.text}&rdquo;
        </blockquote>
        <div className="tst-card-author">
          <div
            className="tst-card-avatar"
            style={{ background: `linear-gradient(135deg, ${avatarColor(t.reviewerName)}, ${avatarColor(t.reviewerName)}aa)` }}
          >
            {(t.reviewerName || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="tst-card-author-info">
            <span className="tst-card-author-name">{t.reviewerName}</span>
            {t.productName && !pImg && (
              <span className="tst-card-author-product">{t.productName}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function TestimonialCarousel() {
  const [testimonials, setTestimonials] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    getActiveTestimonials()
      .then(data => setTestimonials(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = testimonials.length;

  const go = useCallback((dir) => {
    if (total <= 1) return;
    setCurrent(prev => (prev + dir + total) % total);
  }, [total]);

  const goTo = useCallback((idx) => {
    if (idx === current) return;
    setCurrent(idx);
  }, [current]);

  // Auto-play
  useEffect(() => {
    if (total <= 1 || paused) return;
    timerRef.current = setInterval(() => go(1), 5000);
    return () => clearInterval(timerRef.current);
  }, [total, paused, go, current]);

  if (loading || total === 0) return null;

  const prev = (current - 1 + total) % total;
  const next = (current + 1) % total;

  return (
    <section className="tst-section" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* Decorative elements */}
      <div className="tst-deco tst-deco-1" />
      <div className="tst-deco tst-deco-2" />
      <div className="tst-deco tst-deco-3" />

      <div className="tst-inner">
        {/* Header */}
        <div className="tst-header">
          <span className="tst-badge">Testimonials</span>
          <h2 className="tst-title">What Our Customers Say</h2>
          <p className="tst-subtitle">Real reviews from verified buyers across India</p>
        </div>

        {/* Card stack */}
        <div className="tst-card-area">
          {total > 1 && (
            <button className="tst-nav tst-nav-prev" onClick={() => go(-1)} aria-label="Previous testimonial">
              <ChevronLeft size={20} />
            </button>
          )}

          <div className="tst-card-stack">
            {total > 1 && (
              <div className="tst-stack-item tst-stack-prev" key={testimonials[prev].id}>
                <TestimonialCard testimonial={testimonials[prev]} compact />
              </div>
            )}
            <div className="tst-stack-item tst-stack-current" key={testimonials[current].id}>
              <TestimonialCard testimonial={testimonials[current]} />
            </div>
            {total > 2 && (
              <div className="tst-stack-item tst-stack-next" key={testimonials[next].id}>
                <TestimonialCard testimonial={testimonials[next]} compact />
              </div>
            )}
            {total === 2 && (
              <div className="tst-stack-item tst-stack-next" key={`${testimonials[next].id}-mirror`}>
                <TestimonialCard testimonial={testimonials[next]} compact />
              </div>
            )}
          </div>

          {total > 1 && (
            <button className="tst-nav tst-nav-next" onClick={() => go(1)} aria-label="Next testimonial">
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Dots + pause indicator */}
        {total > 1 && (
          <div className="tst-controls">
            <div className="tst-dots">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  className={`tst-dot ${idx === current ? 'tst-dot-active' : ''}`}
                  onClick={() => goTo(idx)}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>
            <button
              className="tst-pause-btn"
              onClick={() => setPaused(p => !p)}
              aria-label={paused ? 'Resume autoplay' : 'Pause autoplay'}
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          </div>
        )}

        {/* Counter */}
        <div className="tst-counter">
          <span className="tst-counter-current">{String(current + 1).padStart(2, '0')}</span>
          <span className="tst-counter-sep">/</span>
          <span className="tst-counter-total">{String(total).padStart(2, '0')}</span>
        </div>
      </div>
    </section>
  );
}
