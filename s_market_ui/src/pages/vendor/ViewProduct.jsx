import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  X, Image as ImageIcon, CheckCircle, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, RefreshCw, Edit3,
  Truck, RotateCcw, ShieldCheck,
} from 'lucide-react';
import { getProduct, BACKEND_URL } from '../../api/api';
import './ViewProduct.css';

/* ─── helpers ───────────────────────────────────────────────────── */

// 1. Drill into every wrapper shape Spring Boot / Axios might add
const unwrap = (res) => {
  if (!res) return null;
  // axios: res.data.product
  if (res.data?.product && typeof res.data.product === 'object') return res.data.product;
  // axios: res.data  (most common)
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
  // bare: res.product
  if (res.product && typeof res.product === 'object') return res.product;
  return res;
};

// 2. Build a full image URL from whatever the backend gives us
const toImageUrl = (x) => {
  if (!x) return null;
  const base = (BACKEND_URL || '').replace(/\/$/, '');

  // plain string — could be full URL or just a filename
  if (typeof x === 'string') {
    const t = x.trim();
    if (!t) return null;
    if (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('/')) return t;
    // bare filename
    return `${base}/uploads/products/${t}`;
  }

  // object with fileName  (ProductMedia entity)
  if (typeof x === 'object') {
    if (x.fileName) return `${base}/uploads/products/${x.fileName}`;
    if (x.url)      return x.url;
    if (x.src)      return x.src;
    if (x.uri)      return x.uri;
    if (x.path)     return x.path;
    if (x.imageUrl) return x.imageUrl;
  }
  return null;
};

// 3. Turn ANY image field shape into a clean string[] of URLs
const parseImages = (raw) => {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.map(toImageUrl).filter(Boolean);
  }

  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t.startsWith('[')) {
      try { return parseImages(JSON.parse(t)); } catch { /**/ }
    }
    if (t.includes(',')) return t.split(',').map(s => s.trim()).filter(Boolean).map(toImageUrl).filter(Boolean);
    return toImageUrl(t) ? [toImageUrl(t)] : [];
  }

  const single = toImageUrl(raw);
  return single ? [single] : [];
};

// 4. Pick first non-null value from a list of candidates
const pick = (...vals) => vals.find(v => v !== undefined && v !== null) ?? null;

/* ─── normalizer ────────────────────────────────────────────────── */
const normalize = (apiRes) => {
  const r = unwrap(apiRes);
  if (!r) return null;

  // ── PRICE ──────────────────────────────────────────────────────
  // Product entity has regularPrice (MRP) and discountPrice (selling price)
  const price = pick(
    r.discountPrice, r.discount_price,
    r.sellingPrice, r.selling_price,
    r.price, r.salePrice, r.sale_price,
    r.amount, r.unitPrice, r.unit_price,
    r.cost, r.listPrice, r.list_price,
  );

  const originalPrice = pick(
    r.regularPrice, r.regular_price,
    r.mrp, r.MRP,
    r.originalPrice, r.original_price,
    r.comparePrice, r.compare_price, r.compare_at_price,
    r.basePrice, r.base_price,
  );

  // ── STATUS ─────────────────────────────────────────────────────
  // Spring Boot enums are usually uppercase: "ACTIVE", "DRAFT", "INACTIVE"
  // But also handle lowercase / mixed
  const rawStatus = String(
    pick(r.status, r.productStatus, r.product_status) ?? 'draft'
  ).toLowerCase().trim();

  const status =
    ['active', 'published', 'enabled', 'live', 'true', 'in'].includes(rawStatus)
      ? 'active'
    : ['inactive', 'disabled', 'false', 'unlisted', 'out'].includes(rawStatus)
      ? 'inactive'
    : ['pending', 'review', 'under_review', 'low'].includes(rawStatus)
      ? 'pending'
    : 'draft';

  // ── IMAGES ─────────────────────────────────────────────────────
  // From ProductMedia entity: the JPA field is usually "media" or "productMedia"
  // Try every possible name
  let rawImages = pick(
    r.media, r.productMedia, r.product_media,
    r.images, r.imageList, r.image_list,
    r.imageUrls, r.image_urls,
    r.imageUrl, r.image_url,
    r.image, r.photos, r.gallery,
    r.thumbnail, r.thumbnails,
    r.attachments,
  );

  // Filter out manufacturer images from product gallery
  if (Array.isArray(rawImages)) {
    rawImages = rawImages.filter(img => {
      if (typeof img === 'object' && img !== null) {
        return img.mediaType !== 'manufacturer';
      }
      return true;
    });
  }

  // ── CATEGORY ───────────────────────────────────────────────────
  const category =
    typeof r.category === 'object' && r.category !== null
      ? pick(r.category.name, r.category.title, r.category.label)
      : pick(r.category, r.categoryName, r.category_name, r.categorySlug);

  // ── BRAND ──────────────────────────────────────────────────────
  const brand =
    typeof r.brand === 'object' && r.brand !== null
      ? pick(r.brand.name, r.brand.title)
      : pick(r.brand, r.brandName, r.brand_name);

  return {
    id            : pick(r.id, r._id, r.productId, r.product_id),
    name          : pick(r.name, r.productName, r.product_name, r.title) ?? '—',
    status,
    description   : pick(r.description, r.productDescription, r.product_description, r.about, r.details) ?? '',
    price         : price         != null ? Number(price)         : null,
    originalPrice : originalPrice != null ? Number(originalPrice) : null,
    discount      : pick(r.discount, r.discountPercent, r.discount_percent, r.discountPercentage),
    stock         : pick(r.initialStock, r.initial_stock, r.stock, r.stockQuantity, r.stock_quantity, r.quantity, r.qty, r.inventory, r.availableStock),
    sku           : pick(r.sku, r.SKU, r.skuCode, r.sku_code, r.productCode, r.product_code),
    category,
    brand,
    weight        : r.weight != null ? String(r.weight) : null,
    dimensions    : pick(r.dimensions, r.dimension, r.size),
    manufacturer  : pick(r.manufacturer, r.manufacturerName),
    countryOfOrigin: pick(r.countryOfOrigin, r.country_of_origin, r.origin),
    images        : parseImages(rawImages),
  };
};

/* ─── formatters ────────────────────────────────────────────────── */
const fmt = (price) => {
  const n = Number(price);
  if (price == null || isNaN(n)) return null;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
};

const fmtStock = (s) => {
  if (s == null) return null;
  const n = Number(s);
  if (n === 0) return 'Out of stock';
  return `${n.toLocaleString('en-IN')} units`;
};

/* ─── status badge ──────────────────────────────────────────────── */
const STATUS_MAP = {
  active   : { Icon: CheckCircle, cls: 'vp-status--active',   label: 'Active'   },
  inactive : { Icon: XCircle,     cls: 'vp-status--inactive', label: 'Inactive' },
  pending  : { Icon: AlertCircle, cls: 'vp-status--pending',  label: 'Pending'  },
  draft    : { Icon: AlertCircle, cls: 'vp-status--draft',    label: 'Draft'    },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_MAP[status] ?? STATUS_MAP.draft;
  return (
    <span className={`vp-status-badge ${c.cls}`}>
      <c.Icon size={12} /> {c.label}
    </span>
  );
};

/* ─── gallery ───────────────────────────────────────────────────── */
const Gallery = ({ images, name }) => {
  const [active, setActive]     = useState(0);
  const [errors, setErrors]     = useState({});

  const prev = useCallback(() => setActive(x => x === 0 ? images.length - 1 : x - 1), [images.length]);
  const next = useCallback(() => setActive(x => x === images.length - 1 ? 0 : x + 1), [images.length]);

  const onErr = useCallback((i) => {
    console.warn('[Gallery] failed to load:', images[i]);
    setErrors(e => ({ ...e, [i]: true }));
  }, [images]);

  if (!images.length) return (
    <div className="vp-gallery">
      <div className="vp-main-image-wrap">
        <div className="vp-no-image"><ImageIcon size={48} /><p>No image available</p></div>
      </div>
    </div>
  );

  return (
    <div className="vp-gallery">
      <div className="vp-main-image-wrap">
        {errors[active]
          ? <div className="vp-no-image"><ImageIcon size={48} /><p>Image failed to load</p></div>
          : <img key={active} src={images[active]} alt={`${name} ${active + 1}`}
                 className="vp-main-image" onError={() => onErr(active)} />
        }
        {images.length > 1 && (
          <>
            <button onClick={prev} aria-label="Previous" className="vp-arrow vp-arrow--left"><ChevronLeft size={16} /></button>
            <button onClick={next} aria-label="Next"     className="vp-arrow vp-arrow--right"><ChevronRight size={16} /></button>
            <span className="vp-counter">{active + 1} / {images.length}</span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="vp-thumbnails">
          {images.map((src, i) => (
            <div key={i}
              className={`vp-thumb ${i === active ? 'vp-thumb--active' : ''}`}
              onClick={() => setActive(i)}
            >
              {errors[i]
                ? <div className="vp-thumb-error"><ImageIcon size={16} /></div>
                : <img src={src} alt={`thumb ${i + 1}`} onError={() => onErr(i)} />
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── modal ─────────────────────────────────────────────────────── */
const ViewProductModal = ({ productId, onClose }) => {
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const raw = await getProduct(productId);
      const normalized = normalize(raw);
      setProduct(normalized);
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to load product';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // ── loading ──
  if (loading) return (
    <div className="vp-modal">
      <div className="vp-modal-overlay" onClick={onClose} />
      <div className="vp-modal-content">
        <button className="vp-modal-close" onClick={onClose}><X size={20} /></button>
        <div className="vp-state-center">
          <div className="vp-spinner" /><p>Loading product details…</p>
        </div>
      </div>
    </div>
  );

  // ── error ──
  if (error) return (
    <div className="vp-modal">
      <div className="vp-modal-overlay" onClick={onClose} />
      <div className="vp-modal-content">
        <button className="vp-modal-close" onClick={onClose}><X size={20} /></button>
        <div className="vp-state-center">
          <AlertCircle size={48} className="vp-error-icon" />
          <h2>Something went wrong</h2><p>{error}</p>
          <div className="vp-state-actions">
            <button className="vp-btn-primary" onClick={fetchProduct}><RefreshCw size={14} /> Retry</button>
            <button className="vp-btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── not found ──
  if (!product) return (
    <div className="vp-modal">
      <div className="vp-modal-overlay" onClick={onClose} />
      <div className="vp-modal-content">
        <button className="vp-modal-close" onClick={onClose}><X size={20} /></button>
        <div className="vp-state-center">
          <AlertCircle size={48} className="vp-error-icon" />
          <h2>Product not found</h2>
          <p>This product doesn't exist or has been removed.</p>
          <button className="vp-btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );

  // ── success ──
  const discountPct =
    product.discount ? Number(product.discount)
    : (product.originalPrice && product.price && product.originalPrice > product.price)
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <div className="vp-modal">
      <div className="vp-modal-overlay" onClick={onClose} />
      <div className="vp-modal-content vp-modal-content--large">
        <button className="vp-modal-close" onClick={onClose}><X size={20} /></button>

        <div className="vp-modal-body">
          <main className="vp-main">

            {/* hero */}
            <section className="vp-hero">
              <Gallery images={product.images} name={product.name} />

              <div className="vp-details">
                <div className="vp-details-top">

                  {(product.category || product.brand) && (
                    <div className="vp-tag">
                      {[product.category, product.brand]
                        .filter(Boolean).map(s => s.toUpperCase()).join(' | ')}
                    </div>
                  )}

                  <div className="vp-title-row">
                    <h1 className="vp-product-title">{product.name}</h1>
                    <StatusBadge status={product.status} />
                  </div>

                  <div className="vp-price-block">
                    {product.price != null ? (
                      <div className="vp-price-row">
                        <span className="vp-price-main">{fmt(product.price)}</span>
                        {product.originalPrice != null && product.originalPrice > product.price && (
                          <span className="vp-price-original">{fmt(product.originalPrice)}</span>
                        )}
                        {discountPct > 0 && (
                          <span className="vp-discount-badge">-{discountPct}%</span>
                        )}
                      </div>
                    ) : (
                      <span className="vp-price-na">Price not set</span>
                    )}
                  </div>
                </div>

                {product.description ? (
                  <div className="vp-section-box">
                    <h3 className="vp-section-label">Description</h3>
                    <p className="vp-description">{product.description}</p>
                  </div>
                ) : null}

                <div className="vp-specs">
                  {product.stock != null && (
                    <div className="vp-spec-item">
                      <span className="vp-spec-item-label">STOCK</span>
                      <span className={`vp-spec-item-value ${Number(product.stock) === 0 ? 'vp-oos' : ''}`}>
                        {fmtStock(product.stock)}
                      </span>
                    </div>
                  )}
                  {product.sku && (
                    <div className="vp-spec-item">
                      <span className="vp-spec-item-label">SKU</span>
                      <span className="vp-spec-item-value vp-mono">{product.sku}</span>
                    </div>
                  )}
                  {product.category && (
                    <div className="vp-spec-item">
                      <span className="vp-spec-item-label">CATEGORY</span>
                      <span className="vp-spec-item-value">{product.category}</span>
                    </div>
                  )}
                  {product.brand && (
                    <div className="vp-spec-item">
                      <span className="vp-spec-item-label">BRAND</span>
                      <span className="vp-spec-item-value">{product.brand}</span>
                    </div>
                  )}
                  {product.weight && (
                    <div className="vp-spec-item">
                      <span className="vp-spec-item-label">WEIGHT</span>
                      <span className="vp-spec-item-value">{product.weight} kg</span>
                    </div>
                  )}
                </div>

                <div className="vp-guarantees">
                  <div className="vp-guarantee"><Truck size={13} /> Free Worldwide Shipping</div>
                  <div className="vp-guarantee"><RotateCcw size={13} /> 14-Day Free Returns</div>
                  <div className="vp-guarantee"><ShieldCheck size={13} /> Secure Transactions</div>
                </div>

                <div className="vp-actions">
                  <button className="vp-btn-primary" onClick={() => {
                    onClose();
                    navigate(`/vendor/products/edit/${product.id ?? productId}`);
                  }}>
                    <Edit3 size={15} /> Edit Product
                  </button>
                  <button className="vp-btn-secondary" onClick={onClose}>Close</button>
                </div>
              </div>
            </section>

            {/* additional info */}
            {(product.dimensions || product.manufacturer || product.countryOfOrigin) && (
              <section className="vp-full-desc">
                <h2 className="vp-section-heading">Additional Information</h2>
                <table className="vp-specs-table">
                  <tbody>
                    {product.dimensions && (
                      <tr><td className="vp-st-label">Dimensions</td><td className="vp-st-value">{product.dimensions}</td></tr>
                    )}
                    {product.manufacturer && (
                      <tr><td className="vp-st-label">Manufacturer</td><td className="vp-st-value">{product.manufacturer}</td></tr>
                    )}
                    {product.countryOfOrigin && (
                      <tr><td className="vp-st-label">Country of Origin</td><td className="vp-st-value">{product.countryOfOrigin}</td></tr>
                    )}
                  </tbody>
                </table>
              </section>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

/* ─── page wrapper ──────────────────────────────────────────────── */
const ViewProduct = () => {
  const navigate = useNavigate();
  const urlPath   = window.location.pathname;
  const productId = urlPath.split('/').pop();

  if (!urlPath.includes('/vendor/products/view/')) return null;

  return (
    <ViewProductModal
      productId={productId}
      onClose={() => navigate('/vendor/products', { replace: true })}
    />
  );
};

export default ViewProduct;
export { ViewProductModal };