import React from 'react';
import { Star, Quote, ThumbsUp, User, ShoppingBag } from 'lucide-react';
import { BACKEND_URL } from '../api/api';

/* ── Shared helpers ── */
const Stars = ({ rating, size = 14 }) => (
  <span style={{ display: 'inline-flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={size} fill={i <= rating ? '#f59e0b' : 'none'} color={i <= rating ? '#f59e0b' : '#d1d5db'} strokeWidth={1.5} />
    ))}
  </span>
);

const getProductImg = (t) => {
  if (!t.productImage) return null;
  return t.productImage.startsWith('http') ? t.productImage : `${BACKEND_URL}/uploads/products/${t.productImage}`;
};

const avatarColor = (name) => `hsl(${(name || '').length * 40 + 10}, 55%, 55%)`;

/* ═══════════════════════════════════════════════
   CARD TEMPLATES
   ═══════════════════════════════════════════════ */

/* ── 1. Classic ── centered, clean, quote icon with gradient accent */
export const CardClassic = ({ t }) => (
  <div style={styles.cardBase}>
    {/* Gradient accent bar at top */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 3,
      background: 'linear-gradient(90deg, #ff6b35, #f43f5e, #8b5cf6)',
      borderRadius: '20px 20px 0 0',
    }} />
    <div style={{ position: 'absolute', top: 16, left: 24, color: '#e2e8f0' }}>
      <Quote size={32} opacity={0.5} />
    </div>
    <Stars rating={t.rating} size={16} />
    {t.title && <h3 style={styles.title}>{t.title}</h3>}
    <p style={styles.text}>"{t.text}"</p>
    <div style={styles.authorRow}>
      <div style={{
        ...styles.avatar,
        background: `linear-gradient(135deg, ${avatarColor(t.reviewerName)}, ${avatarColor(t.reviewerName)}cc)`,
      }}>
        {(t.reviewerName || 'U').charAt(0).toUpperCase()}
      </div>
      <div style={{ textAlign: 'left' }}>
        <div style={styles.authorName}>{t.reviewerName}</div>
        {t.productName && <div style={styles.authorProduct}>{t.productName}</div>}
      </div>
    </div>
  </div>
);

/* ── 2. Bold ── large avatar, bold quote, product image prominent */
export const CardBold = ({ t }) => {
  const pImg = getProductImg(t);
  return (
    <div style={{
      ...styles.cardBase,
      padding: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {pImg && (
        <div style={{ height: 160, background: `url(${pImg}) center/cover`, position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.75))',
          }} />
          <div style={{
            position: 'absolute', bottom: 10, left: 16, color: '#fff',
            fontSize: '.72rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            padding: '4px 10px', borderRadius: 20,
          }}>
            <ShoppingBag size={10} /> {t.productName || 'Verified Purchase'}
          </div>
        </div>
      )}
      <div style={{ padding: '24px 24px 28px', textAlign: 'center', position: 'relative' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: `linear-gradient(135deg, ${avatarColor(t.reviewerName)}, ${avatarColor(t.reviewerName)}bb)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          fontWeight: 800, fontSize: '1.3rem',
          margin: pImg ? '-52px auto 14px' : '0 auto 14px',
          border: '4px solid #fff', position: 'relative', zIndex: 1,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        }}>
          {(t.reviewerName || 'U').charAt(0).toUpperCase()}
        </div>
        <Stars rating={t.rating} size={16} />
        <p style={{
          ...styles.text,
          fontSize: '.95rem',
          fontWeight: 600,
          color: '#1e293b',
          fontStyle: 'normal',
          margin: '10px 0 16px',
        }}>
          "{t.text}"
        </p>
        <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#0f172a' }}>{t.reviewerName}</div>
        {t.title && <div style={{ fontSize: '.75rem', color: '#94a3b8', marginTop: 3 }}>{t.title}</div>}
      </div>
    </div>
  );
};

/* ── 3. Minimal ── compact, just stars + short text, no fuss */
export const CardMinimal = ({ t }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(12px)',
    borderRadius: 16,
    padding: '28px 22px',
    textAlign: 'center',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  }}>
    {/* Subtle gradient line at top */}
    <div style={{
      position: 'absolute', top: 0, left: '20%', right: '20%', height: 2,
      background: 'linear-gradient(90deg, transparent, #ff6b35, transparent)',
      borderRadius: 2,
    }} />
    <Stars rating={t.rating} size={18} />
    <p style={{ ...styles.text, fontSize: '.88rem', margin: '10px 0 14px', fontStyle: 'normal' }}>
      "{t.text}"
    </p>
    <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#334155' }}>{t.reviewerName}</div>
    {t.productName && <div style={{ fontSize: '.7rem', color: '#94a3b8', marginTop: 3 }}>{t.productName}</div>}
  </div>
);

/* ── 4. Bubble ── speech bubble with accent gradient */
export const CardBubble = ({ t }) => {
  const accent = `hsl(${(t.rating || 3) * 60 + 200}, 65%, 58%)`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div style={{
        background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
        borderRadius: '24px 24px 24px 6px',
        padding: '32px 28px',
        color: '#fff',
        maxWidth: 420,
        boxShadow: `0 12px 32px ${accent}40, 0 2px 8px ${accent}20`,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position: 'absolute', bottom: -10, left: -10,
          width: 50, height: 50, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <Stars rating={t.rating} size={14} />
        {t.title && <h3 style={{ margin: '10px 0 8px', fontSize: '.92rem', fontWeight: 700, position: 'relative' }}>{t.title}</h3>}
        <p style={{ margin: 0, fontSize: '.9rem', lineHeight: 1.7, fontStyle: 'italic', opacity: 0.95, position: 'relative' }}>
          "{t.text}"
        </p>
      </div>
      <div style={{
        width: 0, height: 0,
        borderLeft: '12px solid transparent',
        borderRight: '12px solid transparent',
        borderTop: `14px solid ${accent}cc`,
      }} />
      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <div style={{
          ...styles.avatar,
          width: 40, height: 40, fontSize: '.8rem',
          background: `linear-gradient(135deg, ${avatarColor(t.reviewerName)}, ${avatarColor(t.reviewerName)}cc)`,
          margin: '0 auto 8px',
        }}>
          {(t.reviewerName || 'U').charAt(0).toUpperCase()}
        </div>
        <div style={{ fontWeight: 700, fontSize: '.84rem', color: '#0f172a' }}>{t.reviewerName}</div>
        {t.productName && <div style={{ fontSize: '.72rem', color: '#94a3b8', marginTop: 2 }}>{t.productName}</div>}
      </div>
    </div>
  );
};

/* ── 5. Split ── two-column: avatar/info left, review right */
export const CardSplit = ({ t }) => {
  const pImg = getProductImg(t);
  return (
    <div style={{
      display: 'flex',
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(12px)',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
      border: '1px solid rgba(0, 0, 0, 0.05)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    }}>
      <div style={{
        width: '35%',
        background: `linear-gradient(160deg, ${avatarColor(t.reviewerName)}40, ${avatarColor(t.reviewerName)}15, #f8fafc)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 28, gap: 10, minWidth: 150,
        position: 'relative',
      }}>
        {/* Decorative dot pattern */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          width: 40, height: 40,
          backgroundImage: `radial-gradient(circle, ${avatarColor(t.reviewerName)}20 1px, transparent 1px)`,
          backgroundSize: '8px 8px',
          opacity: 0.5,
        }} />
        <div style={{
          ...styles.avatar,
          width: 60, height: 60, fontSize: '1.2rem',
          background: `linear-gradient(135deg, ${avatarColor(t.reviewerName)}, ${avatarColor(t.reviewerName)}bb)`,
          boxShadow: `0 4px 16px ${avatarColor(t.reviewerName)}40`,
        }}>
          {(t.reviewerName || 'U').charAt(0).toUpperCase()}
        </div>
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#0f172a' }}>{t.reviewerName}</div>
          {t.productName && <div style={{ fontSize: '.7rem', color: '#94a3b8', marginTop: 2 }}>{t.productName}</div>}
        </div>
        <Stars rating={t.rating} size={12} />
        {pImg && (
          <img
            src={pImg} alt=""
            style={{
              width: 44, height: 44, borderRadius: 10,
              objectFit: 'cover', border: '2px solid #fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}
      </div>
      <div style={{
        flex: 1, padding: '32px 28px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{ color: '#cbd5e1', marginBottom: 8 }}>
          <Quote size={28} />
        </div>
        {t.title && <h3 style={{ margin: '0 0 8px', fontSize: '.92rem', fontWeight: 700, color: '#0f172a' }}>{t.title}</h3>}
        <p style={{ margin: 0, fontSize: '.88rem', color: '#475569', lineHeight: 1.75, fontStyle: 'italic' }}>
          "{t.text}"
        </p>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   SLIDER LAYOUTS
   ═══════════════════════════════════════════════ */

/* ── Single centered card with arrows ── */
export const LayoutSingle = ({ children, onPrev, onNext, total }) => (
  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
    {total > 1 && <NavBtn dir="prev" onClick={onPrev} />}
    <div style={{ flex: 1, minHeight: 200 }}>{children}</div>
    {total > 1 && <NavBtn dir="next" onClick={onNext} />}
  </div>
);

/* ── Multi-card: show 2-3 cards side by side ── */
export const LayoutMulti = ({ children, onPrev, onNext, current, total }) => {
  const kids = React.Children.toArray(children);
  const itemsPerView = 3;
  const start = Math.min(current, Math.max(0, total - itemsPerView));
  const visible = kids.slice(start, start + itemsPerView);

  return (
    <div>
      <div style={{ position: 'relative' }}>
        {total > itemsPerView && <NavBtn dir="prev" onClick={onPrev} style={{ position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(itemsPerView, total)}, 1fr)`, gap: 16 }}>
          {visible}
        </div>
        {total > itemsPerView && <NavBtn dir="next" onClick={onNext} style={{ position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />}
      </div>
    </div>
  );
};

/* ── Fade transition ── */
export const LayoutFade = ({ children, onPrev, onNext, total }) => (
  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
    {total > 1 && <NavBtn dir="prev" onClick={onPrev} />}
    <div style={{ flex: 1, opacity: 1, transition: 'opacity 0.5s ease', minHeight: 200 }}>{children}</div>
    {total > 1 && <NavBtn dir="next" onClick={onNext} />}
  </div>
);

/* ── Static grid (no navigation) ── */
export const LayoutGrid = ({ children }) => {
  const kids = React.Children.toArray(children);
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 24,
    }}>
      {kids}
    </div>
  );
};

/* ── Full-width with gradient overlay ── */
export const LayoutFullWidth = ({ children, current }) => {
  const t = current;
  const pImg = t?.productImage ? (t.productImage.startsWith('http') ? t.productImage : `${BACKEND_URL}/uploads/products/${t.productImage}`) : null;
  return (
    <div style={{
      position: 'relative',
      borderRadius: 20,
      overflow: 'hidden',
      minHeight: 320,
      background: pImg ? `url(${pImg}) center/cover` : 'linear-gradient(135deg, #0f172a, #1e293b, #334155)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: pImg
          ? 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)'
          : 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%)',
      }} />
      {/* Decorative gradient accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, #ff6b35, #f43f5e, #8b5cf6, #06b6d4)',
      }} />
      <div style={{ position: 'relative', zIndex: 1, padding: '52px 44px', color: '#fff' }}>
        {children}
      </div>
    </div>
  );
};

/* ── Shared nav button ── */
const NavBtn = ({ dir, onClick, style }) => {
  const isPrev = dir === 'prev';
  const Icon = isPrev ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button onClick={onClick} aria-label={isPrev ? 'Previous' : 'Next'} style={{
      flexShrink: 0,
      width: 44,
      height: 44,
      borderRadius: '50%',
      border: '1px solid rgba(0, 0, 0, 0.06)',
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(8px)',
      color: '#475569',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      ...style,
    }}>
      <Icon />
    </button>
  );
};

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/* ═══════════════════════════════════════════════
   Template metadata (moved to keep only components here)
   ═══════════════════════════════════════════════ */
// See TestimonialCarousel.jsx or TestimonialTemplateConfig.js for config maps

/* ── Shared styles ── */
const styles = {
  cardBase: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 20,
    padding: '40px 32px 32px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.04)',
    position: 'relative',
    textAlign: 'center',
    minHeight: 200,
    border: '1px solid rgba(255, 255, 255, 0.6)',
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s ease',
    overflow: 'hidden',
  },
  cardBaseHover: {
    transform: 'translateY(-6px)',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.06)',
  },
  title: {
    margin: '12px 0 10px',
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.2px',
  },
  text: {
    fontSize: '.92rem',
    color: '#475569',
    lineHeight: 1.75,
    fontStyle: 'italic',
    margin: '0 0 24px',
  },
  authorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: '.85rem',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  authorName: { fontSize: '.85rem', fontWeight: 700, color: '#0f172a' },
  authorProduct: { fontSize: '.72rem', color: '#94a3b8' },
};
