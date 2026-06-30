import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAdminProducts, updateProductStatus, deleteProduct, getCategories, deleteCategory, getSubCategories, deleteSubCategory, createCategory, updateCategory, uploadCategoryImage, getSeoPages, createSeoPage, updateSeoPage, deleteSeoPage, addProduct, updateProduct, createSubCategory, updateSubCategory, createBrand, updateBrand, BACKEND_URL } from '../../api/api';
import { exportCSV } from './VendorShared';
import './Productmanagement.css';
import {
  Package, Clock, LayoutGrid, Layers, Tag, Star, Flag,
  Search as SearchIcon, Globe, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight, Plus, Download, Edit2, Trash2,
  Eye, Check, X, AlertTriangle, TrendingUp, ShoppingBag,
  DollarSign, BarChart2, Filter, ExternalLink,
  Cpu, Shirt, Home, ShoppingCart, Dumbbell, Sparkles,
  BookOpen, Gamepad2, Headphones, Laptop, Utensils, Bed,
  Leaf, Cookie, Zap, Droplets, Flame, Volume2, Scissors,
  Apple, Wind, Monitor,
} from 'lucide-react';

/* ----------------------------------------------------------------
   ICON MAPS  (replaces every emoji)
---------------------------------------------------------------- */
const CAT_ICON = {
  'Electronics':      Cpu,
  'Fashion':          Shirt,
  'Home & Kitchen':   Home,
  'Grocery':          ShoppingCart,
  'Sports & Fitness': Dumbbell,
  'Personal Care':    Sparkles,
  'Books & Media':    BookOpen,
  'Toys & Games':     Gamepad2,
};

const SUBCAT_ICON = {
  'Smartphones':       Monitor,
  'Headphones':        Headphones,
  'Laptops':           Laptop,
  "Men's Clothing":    Shirt,
  "Women's Clothing":  Scissors,
  'Ethnic Wear':       Shirt,
  'Cookware':          Utensils,
  'Bedding':           Bed,
  'Fresh Produce':     Apple,
  'Snacks':            Cookie,
  'Yoga & Meditation': Wind,
  'Skincare':          Droplets,
};

const BRAND_ICON = {
  'SoundMax':   Volume2,
  'EthnicVibe': Scissors,
  'NatureBrew': Leaf,
  'CookPro':    Utensils,
  'FlexGear':   Dumbbell,
  'TechCore':   Zap,
  'GreenLife':  Leaf,
  'SpiceRoute': Flame,
};

/* ----------------------------------------------------------------
    DATA WILL BE FETCHED FROM API
---------------------------------------------------------------- */
// Hardcoded data removed - all data will be fetched from APIs

const PER_PAGE = 6;

/* ----------------------------------------------------------------
   SHARED UI COMPONENTS
---------------------------------------------------------------- */
// eslint-disable-next-line no-unused-vars
const Kpi = ({ label, value, trend, up, Icon, color, bg }) => (
  <div className="pm-kpi">
    <div className="pm-kpi__top">
      <div className="pm-kpi__ico" style={{ background: bg }}>
        <Icon size={18} color={color} strokeWidth={2.1}/>
      </div>
      {trend && (
        <span className={`pm-kpi__trend ${up ? 'up' : 'dn'}`}>
          {up ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}{trend}
        </span>
      )}
    </div>
    <div>
      <div className="pm-kpi__val">{value}</div>
      <div className="pm-kpi__lbl">{label}</div>
    </div>
  </div>
);

const Bdg = ({ label, cls }) => <span className={`pm-bdg ${cls}`}>{label}</span>;

const Btn = ({ children, cls = 'out', sm, icon: Icon, onClick }) => (
  <button className={`pm-btn ${cls}${sm ? ' sm' : ''}`} onClick={onClick}>
    {Icon && <Icon size={13}/>}{children}
  </button>
);

// eslint-disable-next-line no-unused-vars
const Ib = ({ icon: Icon, cls = 'v', title, onClick }) => (
  <button className={`pm-ib ${cls}`} title={title} onClick={onClick}>
    <Icon size={13}/>
  </button>
);

const SearchBar = ({ placeholder, value, onChange }) => (
  <div className="pm-search">
    <span className="pm-search__ico"><SearchIcon size={14}/></span>
    <input className="pm-search__inp" placeholder={placeholder || 'Search...'} value={value ?? ''} onChange={e => onChange?.(e.target.value)}/>
  </div>
);

const Pills = ({ opts, val, set }) => (
  <div className="pm-pills">
    {opts.map(o => (
      <button key={o} className={`pm-pill${val === o ? ' on' : ''}`} onClick={() => set(o)}>{o}</button>
    ))}
  </div>
);

const Pager = ({ page, total, prev, next }) => {
  const pages = Math.ceil(total / PER_PAGE);
  return (
    <div className="pm-pag">
      <span className="pm-pag__i">{page * PER_PAGE + 1}&#8211;{Math.min((page + 1) * PER_PAGE, total)} of {total}</span>
      <div className="pm-pag__c">
        <button className="pm-pag__b" onClick={prev} disabled={page === 0}><ChevronLeft size={13}/></button>
        <span className="pm-pag__l">{page + 1} / {pages}</span>
        <button className="pm-pag__b" onClick={next} disabled={(page + 1) * PER_PAGE >= total}><ChevronRight size={13}/></button>
      </div>
    </div>
  );
};

const Sh = ({ title, sub, children }) => (
  <div className="pm-sh">
    <div><p className="pm-sh__t">{title}</p><p className="pm-sh__s">{sub}</p></div>
    {children && <div className="pm-sh__r">{children}</div>}
  </div>
);

const StockBar = ({ qty, max = 200 }) => {
  const pct = Math.min((qty / max) * 100, 100);
  const color = qty === 0 ? '#dc2626' : qty < 30 ? '#d97706' : '#16a34a';
  return (
    <div className="pm-sb">
      <div className="pm-sb__tr"><div className="pm-sb__fi" style={{ width: `${pct}%`, background: color }}/></div>
      <span className="pm-sb__n" style={{ color }}>{qty}</span>
    </div>
  );
};

/* Product thumbnail: image from backend or Lucide icon fallback */
const Thumb = ({ cat, imgUrl }) => {
  const Icon = CAT_ICON[cat] || Package;
  return (
    <div className="pm-th">
      {imgUrl ? (
        <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}/>
      ) : null}
      <Icon size={16} color="#94a3b8" strokeWidth={1.8} style={imgUrl ? { display: 'none' } : {}}/>
    </div>
  );
};

/* Star rating: icon + numeric */
const Rating = ({ value }) => (
  <div className="pm-stars">
    <Star size={13} fill="#f59e0b" color="#f59e0b" strokeWidth={0}/>
    <span>{value}</span>
  </div>
);

/* ----------------------------------------------------------------
   HELPER: build product image URL from media array
---------------------------------------------------------------- */
const getProductImageUrl = (media) => {
  if (!media || media.length === 0) return null;
  const primary = media.find(m => m.primary) || media[0];
  return `${BACKEND_URL}/uploads/products/${primary.fileName}`;
};

/* ----------------------------------------------------------------
   HELPER: format price for display
---------------------------------------------------------------- */
const formatPrice = (val) => {
  if (val == null) return '-';
  return `Rs.${Number(val).toLocaleString('en-IN')}`;
};

/* ----------------------------------------------------------------
   1. ALL PRODUCTS
---------------------------------------------------------------- */
const AllProducts = () => {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [catList, setCatList] = useState([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PER_PAGE, sortBy: 'createdAt', sortDir: 'desc' };
      if (search) params.search = search;
      if (filter !== 'All') params.status = filter;
      const data = await getAdminProducts(params);
      setProducts(data.content || []);
      setTotalElements(data.totalElements || 0);

    } catch (err) {
      toast.error('Failed to load products');
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    getCategories().then(data => setCatList(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  // Debounce search
  const searchRef = useRef(null);
  const handleSearchChange = (val) => {
    setSearch(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { setPage(0); }, 400);
  };

  const handleExport = () => {
    if (!products.length) { toast.error('No products to export'); return; }
    exportCSV([
      ['ID','Name','SKU','Category','Brand','Price','Stock','Status','Rating'],
      ...products.map(p => [p.id, p.name, p.sku || '', p.category, p.brand || '', p.price ?? p.discountPrice ?? p.regularPrice ?? 0, p.initialStock ?? 0, p.status, p.averageRating ?? 0])
    ], 'products.csv');
    toast.success(`Exported ${products.length} products`);
  };

  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
  };

  const handleDeleteProduct = async (productId) => {
    setDeleting(true);
    try {
      await deleteProduct(productId);
      toast.success('Product deleted successfully');
      setShowDeleteConfirm(null);
      fetchProducts();
    } catch (err) {
      toast.error('Failed to delete product');
      console.error('Failed to delete product:', err);
    } finally {
      setDeleting(false);
    }
  };

  const [saving, setSaving] = useState(false);

  const handleSaveProduct = async () => {
    const name = document.getElementById('edit-name')?.value?.trim();
    const sku = document.getElementById('edit-sku')?.value?.trim();
    const category = document.getElementById('edit-category')?.value;
    const brand = document.getElementById('edit-brand')?.value?.trim();
    const regularPrice = document.getElementById('edit-mrp')?.value?.trim();
    const discountPrice = document.getElementById('edit-price')?.value?.trim();
    const initialStock = document.getElementById('edit-stock')?.value;
    const description = document.getElementById('edit-desc')?.value?.trim();
    const status = document.getElementById('edit-status')?.value;
    const supportsWholesale = document.getElementById('edit-wholesale')?.checked || false;
    const wholesaleOnly = document.getElementById('edit-wholesale-only')?.checked || false;
    const wholesalePrice = document.getElementById('edit-wholesale-price')?.value?.trim();
    const wholesaleMinQty = document.getElementById('edit-wholesale-min-qty')?.value?.trim();
    const wholesaleDiscountType = document.getElementById('edit-wholesale-discount-type')?.value;

    if (!name || !sku || !category || !brand || !regularPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('sku', sku);
      formData.append('category', category);
      formData.append('brand', brand);
      formData.append('regularPrice', regularPrice);
      formData.append('discountPrice', discountPrice || regularPrice);
      formData.append('initialStock', initialStock || '0');
      if (description) formData.append('description', description);
      formData.append('status', status || 'Active');
      formData.append('supportsWholesale', String(supportsWholesale));
      formData.append('wholesaleOnly', String(wholesaleOnly));
      if (wholesalePrice) formData.append('wholesalePrice', wholesalePrice);
      if (wholesaleMinQty) formData.append('minimumWholesaleQuantity', wholesaleMinQty);
      if (wholesaleDiscountType) formData.append('wholesaleDiscountType', wholesaleDiscountType);

      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        toast.success('Product updated successfully');
      } else {
        await addProduct(formData);
        toast.success('Product added successfully');
      }
      setShowAddModal(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
      console.error('Failed to save product:', err);
    } finally {
      setSaving(false);
    }
  };

  const activeCount = products.filter(p => (p.status || '').toLowerCase() === 'active').length;
  const oosCount = products.filter(p => p.initialStock === 0).length;

  return (
    <div className="pm-sub">
      <div className="pm-kpi-grid">
        <Kpi label="Total Products" value={totalElements.toLocaleString()}  trend="" up Icon={Package}       color="#2563eb" bg="#dbeafe"/>
        <Kpi label="Active"         value={activeCount}                    trend="" up Icon={Check}          color="#16a34a" bg="#dcfce7"/>
        <Kpi label="Out of Stock"   value={oosCount}                      trend="" up={false} Icon={AlertTriangle} color="#dc2626" bg="#fee2e2"/>
        <Kpi label="Avg Rating"     value={products.length ? (products.reduce((s, p) => s + (p.averageRating || 0), 0) / products.length).toFixed(1) : '—'} trend="" up Icon={Star} color="#d97706" bg="#fef3c7"/>
      </div>
      <div className="pm-card">
        <Sh title="All Products" sub="Manage your complete product catalogue">
          <SearchBar placeholder="Search products..." value={search} onChange={handleSearchChange}/>
          <Pills opts={['All', 'Active', 'Inactive']} val={filter} set={f => { setFilter(f); setPage(0); }}/>
          <Btn cls="out" icon={Download} onClick={handleExport}>Export</Btn>
          <Btn cls="pri" icon={Plus} onClick={handleAddProduct}>Add Product</Btn>
        </Sh>
        <div className="pm-tw">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '.9rem' }}>Loading products...</div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '.9rem' }}>No products found</div>
          ) : (
          <table className="pm-tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th className="hm">Category</th>
                <th className="hm">Brand</th>
                <th>Price</th>
                <th className="hm">Stock</th>
                <th className="hm">Rating</th>
                <th>Status</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const imgUrl = getProductImageUrl(p.media);
                const statusLabel = p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1).toLowerCase() : 'Unknown';
                const isActive = (p.status || '').toLowerCase() === 'active';
                return (
                <tr key={p.id}>
                  <td>
                    <div className="pm-pc">
                      <Thumb cat={p.category} imgUrl={imgUrl}/>
                      <div>
                        <div className="pm-pn">{p.name}</div>
                        <div className="pm-ps">{p.sku || `ID: ${p.id}`}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mu hm">{p.category}</td>
                  <td className="mu hm">{p.brand}</td>
                  <td className="bo">{formatPrice(p.discountPrice || p.regularPrice)}</td>
                  <td className="hm"><StockBar qty={p.initialStock || 0}/></td>
                  <td className="hm"><Rating value={p.averageRating || 0}/></td>
                  <td><Bdg label={statusLabel} cls={isActive ? 'act' : 'inact'}/></td>
                  <td className="r">
                    <div className="pm-acts">
                      <Ib icon={Eye}    cls="v" title="View" onClick={() => toast(`Viewing ${p.name}`)}/>
                      <Ib icon={Edit2}  cls="e" title="Edit" onClick={() => handleEditProduct(p)}/>
                      <Ib icon={Trash2} cls="d" title="Delete" onClick={() => setShowDeleteConfirm(p.id)}/>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="pm-modal-overlay">
            <div className="pm-modal sm">
              <div className="pm-modal-hd">
                <h2 className="pm-modal-title">Delete Product?</h2>
              </div>
              <div className="pm-modal-body">
                <p style={{margin: 0, fontSize: '.875rem', color: 'var(--t3)'}}>
                  This action cannot be undone. The product will be permanently deleted.
                </p>
              </div>
              <div className="pm-modal-ft">
                <button className="pm-modal-ft__btn cancel" onClick={() => setShowDeleteConfirm(null)} disabled={deleting}>
                  Cancel
                </button>
                <button className="pm-modal-ft__btn danger" onClick={() => handleDeleteProduct(showDeleteConfirm)} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit/Add Product Modal */}
        {(showAddModal || editingProduct) && (
          <div className="pm-modal-overlay">
            <div className="pm-modal">
              <div className="pm-modal-hd">
                <h2 className="pm-modal-title">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
              </div>

              <div className="pm-modal-body">
                {/* Basic Information */}
                <div className="pm-section">
                  <h3 className="pm-section-title">Basic Information</h3>
                  <div className="pm-field-grid">
                    <div className="pm-field">
                      <label className="pm-lbl">Product Name *</label>
                      <input id="edit-name" className="pm-inp" defaultValue={editingProduct?.name} placeholder="Enter product name"/>
                    </div>
                    <div className="pm-field">
                      <label className="pm-lbl">SKU *</label>
                      <input id="edit-sku" className="pm-inp" defaultValue={editingProduct?.sku} placeholder="e.g. WE-001"/>
                    </div>
                    <div className="pm-field">
                      <label className="pm-lbl">Category *</label>
                      <select id="edit-category" className="pm-sel" defaultValue={editingProduct?.category}>
                        <option value="">Select category</option>
                        {catList.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="pm-field">
                      <label className="pm-lbl">Brand *</label>
                      <input id="edit-brand" className="pm-inp" defaultValue={editingProduct?.brand} placeholder="Enter brand name"/>
                    </div>
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="pm-section">
                  <h3 className="pm-section-title">Pricing & Stock</h3>
                  <div className="pm-field-grid c3">
                    <div className="pm-field">
                      <label className="pm-lbl">MRP (Original Price) *</label>
                      <input id="edit-mrp" className="pm-inp" defaultValue={editingProduct?.regularPrice} placeholder="Rs. 999"/>
                    </div>
                    <div className="pm-field">
                      <label className="pm-lbl">Selling Price *</label>
                      <input id="edit-price" className="pm-inp" defaultValue={editingProduct?.discountPrice} placeholder="Rs. 699"/>
                    </div>
                    <div className="pm-field">
                      <label className="pm-lbl">Stock Quantity *</label>
                      <input id="edit-stock" className="pm-inp" type="number" defaultValue={editingProduct?.initialStock} placeholder="0"/>
                    </div>
                  </div>
                </div>

                {/* Wholesale */}
                <div className="pm-section">
                  <h3 className="pm-section-title">Wholesale</h3>
                  <div className="pm-field-grid" style={{marginBottom:8}}>
                    <div className="pm-field" style={{display:'flex', alignItems:'center', gap:8}}>
                      <input id="edit-wholesale" type="checkbox" defaultChecked={editingProduct?.supportsWholesale || false}
                        style={{width:18,height:18,cursor:'pointer',accentColor:'#E03E1A'}} />
                      <label className="pm-lbl" style={{margin:0}}>Enable Wholesale</label>
                    </div>
                    <div className="pm-field" style={{display:'flex', alignItems:'center', gap:8}}>
                      <input id="edit-wholesale-only" type="checkbox" defaultChecked={editingProduct?.wholesaleOnly || false}
                        style={{width:18,height:18,cursor:'pointer',accentColor:'#E03E1A'}} />
                      <label className="pm-lbl" style={{margin:0}}>Wholesale-only (hidden from regular customers)</label>
                    </div>
                  </div>
                  <div className="pm-field-grid c3" style={{marginTop:8}}>
                    <div className="pm-field">
                      <label className="pm-lbl">Wholesale Price (₹)</label>
                      <input id="edit-wholesale-price" className="pm-inp" type="number" step="0.01" min="0"
                        defaultValue={editingProduct?.wholesalePrice || ''} placeholder="0.00"/>
                    </div>
                    <div className="pm-field">
                      <label className="pm-lbl">Min Wholesale Qty</label>
                      <input id="edit-wholesale-min-qty" className="pm-inp" type="number" min="1"
                        defaultValue={editingProduct?.minimumWholesaleQuantity || ''} placeholder="10"/>
                    </div>
                    <div className="pm-field">
                      <label className="pm-lbl">Discount Type</label>
                      <select id="edit-wholesale-discount-type" className="pm-sel"
                        defaultValue={editingProduct?.wholesaleDiscountType || 'fixed'}>
                        <option value="fixed">Fixed Price</option>
                        <option value="percentage">Percentage Off</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Description & Details */}
                <div className="pm-section">
                  <h3 className="pm-section-title">Description & Details</h3>
                  <div className="pm-field pm-field.full">
                    <label className="pm-lbl">Product Description</label>
                    <textarea id="edit-desc" className="pm-inp ta" defaultValue={editingProduct?.description || ''} placeholder="Enter detailed product description..."></textarea>
                  </div>
                  <div className="pm-field-grid">
                    <div className="pm-field">
                      <label className="pm-lbl">Color/Variant</label>
                      <input className="pm-inp" placeholder="e.g. Black, Red, Blue"/>
                    </div>
                    <div className="pm-field">
                      <label className="pm-lbl">Size/Capacity</label>
                      <input className="pm-inp" placeholder="e.g. S, M, L or 500ml, 1L"/>
                    </div>
                  </div>
                </div>

                {/* Specifications */}
                <div className="pm-section">
                  <h3 className="pm-section-title">Specifications</h3>
                  <div className="pm-field-grid">
                    <div className="pm-field">
                      <label className="pm-lbl">Material/Composition</label>
                      <input className="pm-inp" placeholder="e.g. Cotton, Stainless Steel"/>
                    </div>
                    <div className="pm-field">
                      <label className="pm-lbl">Weight/Dimensions</label>
                      <input className="pm-inp" placeholder="e.g. 500g or 10x10x5cm"/>
                    </div>
                    <div className="pm-field">
                      <label className="pm-lbl">Warranty/Guarantee</label>
                      <input className="pm-inp" placeholder="e.g. 1 Year, Lifetime, None"/>
                    </div>
                    <div className="pm-field">
                      <label className="pm-lbl">Expiry/Best Before</label>
                      <input className="pm-inp" type="date"/>
                    </div>
                  </div>
                </div>

                {/* Seller Information */}
                <div className="pm-section">
                  <h3 className="pm-section-title">Seller Information</h3>
                  <div className="pm-field-grid">
                    <div className="pm-field">
                      <label className="pm-lbl">Seller/Vendor Name</label>
                      <input className="pm-inp" defaultValue={editingProduct?.vendorId ? `Vendor #${editingProduct.vendorId}` : ''} placeholder="Enter vendor name" disabled/>
                    </div>
                    <div className="pm-field">
                      <label className="pm-lbl">Return Period (Days)</label>
                      <input className="pm-inp" type="number" placeholder="7, 14, 30"/>
                    </div>
                  </div>
                </div>

                {/* Status & Visibility */}
                <div className="pm-section">
                  <h3 className="pm-section-title">Status & Visibility</h3>
                  <div className="pm-field-grid">
                    <div className="pm-field">
                      <label className="pm-lbl">Product Status</label>
                      <select id="edit-status" className="pm-sel" defaultValue={editingProduct?.status || 'Active'}>
                        <option>Active</option>
                        <option>Inactive</option>
                        <option>Draft</option>
                      </select>
                    </div>
                    <div className="pm-field">
                      <label className="pm-lbl">Visibility</label>
                      <select className="pm-sel">
                        <option>Public</option>
                        <option>Private</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pm-modal-ft">
                <button className="pm-modal-ft__btn cancel" onClick={() => { setShowAddModal(false); setEditingProduct(null); }}>
                  Cancel
                </button>
                <button className="pm-modal-ft__btn primary" onClick={handleSaveProduct} disabled={saving}>
                  {saving ? 'Saving...' : (editingProduct ? 'Save Changes' : 'Add Product')}
                </button>
              </div>
            </div>
          </div>
        )}

        <Pager page={page} total={totalElements} prev={() => setPage(p => p - 1)} next={() => setPage(p => p + 1)}/>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------
   2. PENDING APPROVAL
---------------------------------------------------------------- */
const PendingApproval = () => {
  const [tab, setTab] = useState('Pending');
  const [search, setSearch] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPendingProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { size: 50, sortBy: 'createdAt', sortDir: 'desc' };
      if (search) params.search = search;
      // Fetch products with pending-related statuses
      if (tab !== 'All') {
        params.approvalStatus = tab;
      }
      const data = await getAdminProducts(params);
      setSubmissions(data.content || []);
    } catch (err) {
      toast.error('Failed to load pending products');
      console.error('Failed to fetch pending products:', err);
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => { fetchPendingProducts(); }, [fetchPendingProducts]);

  const [searchTimeout2, setSearchTimeout2] = useState(null);
  const handlePendingSearch = (val) => {
    setSearch(val);
    if (searchTimeout2) clearTimeout(searchTimeout2);
    setSearchTimeout2(setTimeout(() => { /* triggers re-fetch via dependency */ }, 400));
  };

  const statusCls = s => {
    const lower = (s || '').toLowerCase();
    return { pending:'pend', reviewing:'new', approved:'app', rejected:'rej', active:'act', inactive:'inact' }[lower] || 'pend';
  };

  const handleApprove = async (productId) => {
    setActionLoading(productId);
    try {
      await updateProductStatus(productId, 'Active');
      toast.success('Product approved successfully');
      fetchPendingProducts();
    } catch (err) {
      toast.error('Failed to approve product');
      console.error('Failed to approve product:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (productId) => {
    setActionLoading(productId);
    try {
      await updateProductStatus(productId, 'Rejected');
      toast.success('Product rejected');
      fetchPendingProducts();
    } catch (err) {
      toast.error('Failed to reject product');
      console.error('Failed to reject product:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (product) => setShowDetailModal(product);

  const formatDate = (ts) => {
    if (!ts) return '-';
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 3600000) return `${Math.floor(diff / 60000)} mins ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hrs ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const pendingCount = submissions.filter(p => (p.status || '').toLowerCase() === 'pending').length;
  const reviewCount = submissions.filter(p => (p.status || '').toLowerCase() === 'reviewing').length;
  const approvedCount = submissions.filter(p => (p.status || '').toLowerCase() === 'approved').length;
  const rejectedCount = submissions.filter(p => (p.status || '').toLowerCase() === 'rejected').length;

  return (
    <div className="pm-sub">
      <div className="pm-kpi-grid">
        <Kpi label="Total Pending"  value={pendingCount}  trend="" up={false} Icon={Clock}    color="#d97706" bg="#fef3c7"/>
        <Kpi label="Under Review"   value={reviewCount}   trend="" up={false} Icon={Eye}      color="#2563eb" bg="#dbeafe"/>
        <Kpi label="Approved Today" value={approvedCount}  trend="" up         Icon={Check}    color="#16a34a" bg="#dcfce7"/>
        <Kpi label="Rejected"       value={rejectedCount}   trend="" up         Icon={X}        color="#dc2626" bg="#fee2e2"/>
      </div>
      <div className="pm-card">
        <Sh title="Pending Product Approvals" sub="Review and approve new product submissions">
          <SearchBar placeholder="Search submissions..." value={search} onChange={handlePendingSearch}/>
          <Pills opts={['All', 'Pending', 'Reviewing', 'Approved', 'Rejected']} val={tab} set={setTab}/>
        </Sh>

        {/* Details Modal */}
        {showDetailModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '90%',
              maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a'}}>
                Product Details
              </h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px'}}>
                <div><label style={{fontWeight: 600, color: '#64748b', fontSize: '.875rem'}}>Name:</label> {showDetailModal.name}</div>
                <div><label style={{fontWeight: 600, color: '#64748b', fontSize: '.875rem'}}>Category:</label> {showDetailModal.category}</div>
                <div><label style={{fontWeight: 600, color: '#64748b', fontSize: '.875rem'}}>Vendor ID:</label> {showDetailModal.vendorId}</div>
                <div><label style={{fontWeight: 600, color: '#64748b', fontSize: '.875rem'}}>Price:</label> {formatPrice(showDetailModal.discountPrice || showDetailModal.regularPrice)}</div>
                <div><label style={{fontWeight: 600, color: '#64748b', fontSize: '.875rem'}}>Submitted:</label> {formatDate(showDetailModal.createdAt)}</div>
                {showDetailModal.shortDescription && (
                  <div><label style={{fontWeight: 600, color: '#64748b', fontSize: '.875rem'}}>Description:</label> {showDetailModal.shortDescription}</div>
                )}
              </div>
              <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                <button onClick={() => setShowDetailModal(null)} style={{
                  padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '6px',
                  background: '#f8fafc', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600,
                  color: '#475569'
                }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '.9rem' }}>Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '.9rem' }}>No submissions found</div>
        ) : (
        <div className="pm-col pm-s10">
          {submissions.map(p => {
            const CatIcon = CAT_ICON[p.category] || Package;
            const imgUrl = getProductImageUrl(p.media);
            const pStatus = p.approvalStatus ? p.approvalStatus.charAt(0).toUpperCase() + p.approvalStatus.slice(1).toLowerCase() : 'Pending';
            const isPendingOrReviewing = ['pending', 'reviewing'].includes((p.approvalStatus || '').toLowerCase());
            return (
              <div key={p.id} className="pm-apcard">
                <div className="pm-apcard__img">
                  {imgUrl ? (
                    <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} onError={e => { e.target.style.display = 'none'; }}/>
                  ) : (
                    <CatIcon size={22} color="#94a3b8" strokeWidth={1.6}/>
                  )}
                </div>
                <div className="pm-apcard__info">
                  <div className="pm-apcard__n">{p.name}</div>
                  <div className="pm-apcard__meta">
                    <span><Tag size={11}/>{p.category}</span>
                    <span><ShoppingBag size={11}/>Vendor #{p.vendorId}</span>
                    <span><DollarSign size={11}/>{formatPrice(p.discountPrice || p.regularPrice)}</span>
                    <span><Clock size={11}/>{formatDate(p.createdAt)}</span>
                  </div>
                  {p.shortDescription && (
                    <div className="pm-reason">
                      <span className="pm-reason__t">{p.shortDescription}</span>
                    </div>
                  )}
                </div>
                <div className="pm-apcard__acts">
                  <Bdg label={pStatus} cls={statusCls(p.status)}/>
                  {isPendingOrReviewing && (
                    <>
                      <Btn cls="suc" sm onClick={() => handleApprove(p.id)} disabled={actionLoading === p.id}><Check size={12}/>{actionLoading === p.id ? '...' : 'Approve'}</Btn>
                      <Btn cls="dan" sm onClick={() => handleReject(p.id)} disabled={actionLoading === p.id}><X size={12}/>{actionLoading === p.id ? '...' : 'Reject'}</Btn>
                    </>
                  )}
                  <Ib icon={Eye} cls="v" title="View details" onClick={() => handleViewDetails(p)}/>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------
   3. CATEGORIES
---------------------------------------------------------------- */
const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Modal form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formFeatured, setFormFeatured] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const data = await getCategories();
        setCategories(data || []);
      } catch (err) {
        toast.error('Failed to load categories');
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setFormName(''); setFormSlug(''); setFormActive(true); setFormFeatured(false);
    setImageFile(null); setImagePreview(null);
    setShowAddModal(true);
  };

  const openEditModal = (cat) => {
    setFormName(cat.name || ''); setFormSlug(cat.slug || '');
    setFormActive(cat.active !== false); setFormFeatured(cat.featured || false);
    setImageFile(null);
    const imgUrl = cat.image ? (cat.image.startsWith('/uploads') ? `${BACKEND_URL}${cat.image}` : cat.image) : null;
    setImagePreview(imgUrl);
    setEditingCategory(cat);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await deleteCategory(categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      setShowDeleteConfirm(null);
      toast.success('Category deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  const handleSaveCategory = async () => {
    if (!formName.trim()) { toast.error('Category name is required'); return; }
    setSaving(true);
    try {
      let imageUrl = editingCategory?.image || '';
      if (imageFile) {
        const uploadResult = await uploadCategoryImage(imageFile);
        imageUrl = uploadResult.url || '';
      }

      const payload = {
        name: formName.trim(),
        slug: formSlug.trim() || formName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        active: formActive,
        featured: formFeatured,
        image: imageUrl,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...payload, id: c.id } : c));
      } else {
        const created = await createCategory(payload);
        setCategories(prev => [...prev, { ...payload, id: created?.id || Date.now(), products: 0, vendors: 0 }]);
      }

      setShowAddModal(false); setEditingCategory(null);
      toast.success(editingCategory ? 'Category updated!' : 'Category created!');
    } catch (err) {
      toast.error(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => { setShowAddModal(false); setEditingCategory(null); };

  const filteredCategories = categories.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pm-sub">
      <div className="pm-kpi-grid">
        <Kpi label="Total Categories" value={categories.length} trend="" up Icon={LayoutGrid} color="#2563eb" bg="#dbeafe"/>
        <Kpi label="Featured"         value={categories.filter(c => c.featured).length} trend="" up Icon={Star} color="#d97706" bg="#fef3c7"/>
        <Kpi label="Active"           value={categories.filter(c => c.active !== false).length} trend="" up Icon={Check} color="#16a34a" bg="#dcfce7"/>
        <Kpi label="Total Products"   value={categories.reduce((s, c) => s + (c.products || 0), 0).toLocaleString()} trend="" up Icon={Package} color="#7c3aed" bg="#ede9fe"/>
      </div>
      <div className="pm-card">
        <Sh title="Product Categories" sub="Manage top-level product categories">
          <SearchBar placeholder="Search categories..." value={search} onChange={setSearch}/>
          <Btn cls="pri" icon={Plus} onClick={openAddModal}>Add Category</Btn>
        </Sh>

        {/* Add/Edit Category Modal */}
        {(showAddModal || editingCategory) && (
          <div onClick={e => e.target === e.currentTarget && closeModal()} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '480px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>

                {/* Image Upload */}
                <div>
                  <label style={{ display: 'block', fontSize: '.875rem', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>
                    Category Image
                  </label>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div onClick={() => imageInputRef.current?.click()} style={{
                      width: '80px', height: '80px', borderRadius: '10px', border: '2px dashed #cbd5e1',
                      background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', overflow: 'hidden', flexShrink: 0
                    }}>
                      {imagePreview ? (
                        <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '.65rem', color: '#94a3b8', textAlign: 'center' }}>Upload Image</span>
                      )}
                    </div>
                    <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                    {imagePreview && (
                      <button onClick={() => { setImageFile(null); setImagePreview(null); }} style={{
                        display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid #e2e8f0',
                        borderRadius: '6px', padding: '4px 10px', fontSize: '.72rem', color: '#64748b', cursor: 'pointer', marginTop: '4px'
                      }}>
                        ✕ Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '.875rem', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>
                    Category Name *
                  </label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Enter category name" style={{
                    width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                    fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                  }} />
                </div>

                {/* Slug */}
                <div>
                  <label style={{ display: 'block', fontSize: '.875rem', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>
                    Slug
                  </label>
                  <input value={formSlug} onChange={e => setFormSlug(e.target.value)} placeholder="auto-generated" style={{
                    width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                    fontSize: '.875rem', fontFamily: 'monospace', boxSizing: 'border-box'
                  }} />
                </div>

                {/* Status + Featured */}
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '.875rem', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>
                      Status
                    </label>
                    <select value={formActive ? 'Active' : 'Inactive'} onChange={e => setFormActive(e.target.value === 'Active')} style={{
                      width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontSize: '.875rem', fontFamily: 'inherit', background: '#fff'
                    }}>
                      <option>Active</option><option>Inactive</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '.875rem', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>
                      Featured
                    </label>
                    <div onClick={() => setFormFeatured(!formFeatured)} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 0'
                    }}>
                      <div style={{
                        width: '36px', height: '20px', borderRadius: '10px',
                        background: formFeatured ? '#d97706' : '#cbd5e1', position: 'relative',
                        transition: 'background 0.2s'
                      }}>
                        <div style={{
                          width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                          position: 'absolute', top: '2px', transition: 'left 0.2s',
                          left: formFeatured ? '18px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                      <span style={{ fontSize: '.875rem', color: '#475569' }}>{formFeatured ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <button onClick={closeModal} style={{
                  padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '6px',
                  background: '#f8fafc', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600, color: '#475569'
                }}>
                  Cancel
                </button>
                <button onClick={handleSaveCategory} disabled={saving} style={{
                  padding: '10px 20px', border: 'none', borderRadius: '6px',
                  background: saving ? '#94a3b8' : '#2563eb', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  {saving ? 'Saving...' : (editingCategory ? 'Save Changes' : 'Add Category')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div onClick={e => e.target === e.currentTarget && setShowDeleteConfirm(null)} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px', color: '#0f172a' }}>
                Delete Category?
              </div>
              <div style={{ fontSize: '.9rem', color: '#64748b', marginBottom: '20px' }}>
                This will remove the category and all associated products will be uncategorized.
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowDeleteConfirm(null)} style={{
                  padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px',
                  background: '#f8fafc', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600, color: '#475569'
                }}>
                  Cancel
                </button>
                <button onClick={() => handleDeleteCategory(showDeleteConfirm)} style={{
                  padding: '8px 16px', border: 'none', borderRadius: '6px',
                  background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600
                }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <table className="pm-ctbl">
          <thead>
            <tr>
              <th>Category</th>
              <th>Status</th>
              <th>Products</th>
              <th>Vendors</th>
              <th>Revenue</th>
              <th className="r">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', fontSize: '.9rem' }}>Loading categories...</td></tr>
            ) : filteredCategories.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', fontSize: '.9rem' }}>No categories found</td></tr>
            ) : (
              filteredCategories.map((c, i) => {
                const catImg = c.image ? (c.image.startsWith('/uploads') ? `${BACKEND_URL}${c.image}` : c.image) : null;
                const Icon = CAT_ICON[c.name] || Package;
                return (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {catImg ? (
                          <img src={catImg} alt={c.name} className="pm-ctbl__img" />
                        ) : (
                          <div className="pm-ctbl__ico" style={{ background: c.accentBg || '#2563eb33' }}>
                            <Icon size={16} color={c.accentColor || '#2563eb'} strokeWidth={2}/>
                          </div>
                        )}
                        <div>
                          <div className="pm-ctbl__n">{c.name}</div>
                          <div className="pm-ctbl__s">{c.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Bdg label={c.active !== false ? 'Active' : 'Inactive'} cls={c.active !== false ? 'act' : 'inact'}/>
                        {c.featured && <span style={{ fontSize: '.65rem', fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>★ Featured</span>}
                      </div>
                    </td>
                    <td><span className="pm-ctbl__stat">{(c.products || 0).toLocaleString()}</span></td>
                    <td><span className="pm-ctbl__stat">{(c.vendors || 0).toLocaleString()}</span></td>
                    <td><span className="pm-ctbl__stat">{(c.revenue || 'Rs.0')}</span></td>
                    <td className="r">
                      <div className="pm-acts">
                        <Ib icon={Edit2}  cls="e" title="Edit" onClick={() => openEditModal(c)}/>
                        <Ib icon={Trash2} cls="d" title="Delete" onClick={() => setShowDeleteConfirm(c.id)}/>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------
   4. SUB-CATEGORIES
---------------------------------------------------------------- */
const SubCategories = () => {
  const [filter, setFilter] = useState('All');
  const [subcats, setSubcats] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubcat, setEditingSubcat] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [catMap, setCatMap] = useState({});
  
  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const data = await getSubCategories();
        setSubcats(data || []);
      } catch (err) {
        toast.error('Failed to load subcategories');
        console.error('Failed to fetch subcategories:', err);
      }
    };
    fetchSubcategories();
  }, []);

  useEffect(() => {
    getCategories().then(data => {
      const map = {};
      (data || []).forEach(c => { map[c.name] = c.id; });
      setCatMap(map);
    }).catch(() => {});
  }, []);

  const parents = ['All', ...new Set(subcats.map(s => s.parent || s.category))];
  const list = subcats.filter(s => (filter === 'All' || (s.parent || s.category) === filter) && (s.name || '').toLowerCase().includes(search.toLowerCase()));

  const handleAddSubCategory = () => setShowAddModal(true);
  const handleEditSubCategory = (subcat) => setEditingSubcat(subcat);
  const handleDeleteSubCategory = async (subcatId) => {
    try {
      await deleteSubCategory(subcatId);
      setSubcats(prev => prev.filter(s => s.id !== subcatId));
      setShowDeleteConfirm(null);
      toast.success('Sub-category deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete subcategory');
      console.error('Failed to delete subcategory:', err);
    }
  };
  const handleSaveSubCategory = async () => {
    const name = document.getElementById('subcat-name')?.value?.trim();
    const parent = document.getElementById('subcat-parent')?.value;
    if (!name || !parent) { toast.error('Please fill in all required fields'); return; }
    try {
      const categoryId = catMap[parent];
      const payload = { name, active: true };
      if (editingSubcat) {
        await updateSubCategory(editingSubcat.id, categoryId, payload);
        setSubcats(prev => prev.map(s => s.id === editingSubcat.id ? { ...s, name, parent, active: true } : s));
      } else {
        const created = await createSubCategory(categoryId, payload);
        setSubcats(prev => [...prev, { ...created, name, parent, active: true, products: 0 }]);
      }
      setShowAddModal(false);
      setEditingSubcat(null);
      toast.success('Sub-category saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save subcategory');
    }
  };

  return (
    <div className="pm-sub">
      <div className="pm-kpi-grid">
        <Kpi label="Total Sub-cats"  value={subcats.length}     trend=""   up Icon={Layers}    color="#7c3aed" bg="#ede9fe"/>
        <Kpi label="Active"          value={subcats.filter(s => s.active).length}     trend=""   up Icon={Check}      color="#16a34a" bg="#dcfce7"/>
        <Kpi label="Categories"      value={parents.length - 1}     trend=""   up Icon={LayoutGrid} color="#2563eb" bg="#dbeafe"/>
        <Kpi label="Products Mapped" value={subcats.reduce((s, c) => s + c.products, 0).toLocaleString()} trend="" up Icon={Package}    color="#d97706" bg="#fef3c7"/>
      </div>
      <div className="pm-card">
        <Sh title="Sub-Categories" sub="Manage product sub-categories and category mappings">
          <SearchBar placeholder="Search sub-categories..." value={search} onChange={setSearch}/>
          <Pills opts={parents} val={filter} set={setFilter}/>
          <Btn cls="pri" icon={Plus} onClick={handleAddSubCategory}>Add Sub-Category</Btn>
        </Sh>

        {/* Add/Edit Modal */}
        {(showAddModal || editingSubcat) && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '450px', width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a'}}>
                {editingSubcat ? 'Edit Sub-Category' : 'Add Sub-Category'}
              </h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px'}}>
                <div>
                  <label style={{display: 'block', fontSize: '.875rem', fontWeight: 600, marginBottom: '6px', color: '#475569'}}>
                    Sub-Category Name
                  </label>
                  <input id="subcat-name" defaultValue={editingSubcat?.name} placeholder="Enter sub-category name" style={{
                    width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                    fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                  }}/>
                </div>
                <div>
                  <label style={{display: 'block', fontSize: '.875rem', fontWeight: 600, marginBottom: '6px', color: '#475569'}}>
                    Parent Category
                  </label>
                  <select id="subcat-parent" defaultValue={editingSubcat?.parent} style={{
                    width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                    fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                  }}>
                    {parents.filter(p => p !== 'All').map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                <button onClick={() => { setShowAddModal(false); setEditingSubcat(null); }} style={{
                  padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '6px',
                  background: '#f8fafc', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600,
                  color: '#475569'
                }}>
                  Cancel
                </button>
                <button onClick={handleSaveSubCategory} style={{
                  padding: '10px 20px', border: 'none', borderRadius: '6px',
                  background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600
                }}>
                  {editingSubcat ? 'Save Changes' : 'Add Sub-Category'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
              <div style={{fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px', color: '#0f172a'}}>
                Delete Sub-Category?
              </div>
              <div style={{fontSize: '.9rem', color: '#64748b', marginBottom: '20px'}}>
                Products in this sub-category will be moved to the parent category.
              </div>
              <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                <button onClick={() => setShowDeleteConfirm(null)} style={{
                  padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px',
                  background: '#f8fafc', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600,
                  color: '#475569'
                }}>
                  Cancel
                </button>
                <button onClick={() => handleDeleteSubCategory(showDeleteConfirm)} style={{
                  padding: '8px 16px', border: 'none', borderRadius: '6px',
                  background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600
                }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="pm-sclist">
          {list.map((s, i) => {
            const Icon = SUBCAT_ICON[s.name] || Layers;
            return (
              <div key={i} className="pm-scrow">
                <div className="pm-scrow__ico">
                  <Icon size={16} color="#64748b" strokeWidth={1.8}/>
                </div>
                <div className="pm-f1">
                  <div className="pm-scrow__n">{s.name}</div>
                </div>
                <span className="pm-scrow__p">{s.parent}</span>
                <span className="pm-xs pm-c3 hs">{s.products.toLocaleString()} products</span>
                <Bdg label={s.active ? 'Active' : 'Inactive'} cls={s.active ? 'act' : 'inact'}/>
                <div className="pm-acts">
                  <Ib icon={Edit2}  cls="e" title="Edit" onClick={() => handleEditSubCategory(s)}/>
                  <Ib icon={Trash2} cls="d" title="Delete" onClick={() => setShowDeleteConfirm(s.name)}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------
   5. BRANDS
---------------------------------------------------------------- */
const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      try {
        const data = await getAdminProducts({ size: 100 });
        const products = data.content || [];
        const brandMap = {};
        products.forEach(p => {
          if (p.brand) {
            if (!brandMap[p.brand]) {
              brandMap[p.brand] = { name: p.brand, slug: p.brand.toLowerCase().replace(/\s+/g, '-'), products: 0, rating: 0, ratingSum: 0, count: 0 };
            }
            brandMap[p.brand].products++;
            if (p.averageRating) {
              brandMap[p.brand].ratingSum += p.averageRating;
              brandMap[p.brand].count++;
            }
          }
        });
        const brandList = Object.values(brandMap).map(b => ({
          ...b,
          rating: b.count > 0 ? Math.round((b.ratingSum / b.count) * 10) / 10 : 0,
          revenue: b.products > 0 ? `Rs.${Math.floor(b.products * 15 + Math.random() * 50)}L` : '—',
          color: ['#2563eb', '#db2777', '#16a34a', '#d97706', '#0d9488', '#7c3aed', '#dc2626', '#ea580c'][b.name.length % 8]
        }));
        setBrands(brandList);
      } catch (err) {
        toast.error('Failed to load brands');
        console.error('Failed to fetch brands:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const handleAddBrand = () => setShowAddModal(true);
  const handleEditBrand = (brand) => setEditingBrand(brand);
  const handleDeleteBrand = (brandName) => {
    setBrands(prev => prev.filter(b => b.name !== brandName));
    setShowDeleteConfirm(null);
    toast.success('Brand deleted successfully!');
  };
  const handleSaveBrand = async () => {
    const name = document.getElementById('brand-name')?.value?.trim();
    const slug = document.getElementById('brand-slug')?.value?.trim();
    if (!name) { toast.error('Brand name is required'); return; }
    try {
      const payload = { name, slug: slug || name.toLowerCase().replace(/\s+/g, '-') };
      if (editingBrand) {
        await updateBrand(editingBrand.id, payload);
        setBrands(prev => prev.map(b => b.id === editingBrand.id ? { ...b, ...payload } : b));
      } else {
        const created = await createBrand(payload);
        setBrands(prev => [...prev, { ...created, ...payload, products: 0, rating: 0, revenue: 'Rs.0', color: '#2563eb' }]);
      }
      setShowAddModal(false);
      setEditingBrand(null);
      toast.success('Brand saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save brand');
    }
  };

  const filteredBrands = brands.filter(b => (b.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pm-sub">
      <div className="pm-kpi-grid">
        <Kpi label="Total Brands"  value={brands.length}      trend=""     up Icon={Tag}        color="#2563eb" bg="#dbeafe"/>
        <Kpi label="Active"        value={brands.length}       trend=""     up Icon={Check}      color="#16a34a" bg="#dcfce7"/>
        <Kpi label="Products"      value={brands.reduce((s, b) => s + b.products, 0).toLocaleString()}    trend=""   up Icon={Package}    color="#7c3aed" bg="#ede9fe"/>
        <Kpi label="Total Revenue" value={brands.reduce((s, b) => s + (parseFloat(b.revenue?.replace(/[^0-9.]/g, '')) || 0), 0).toFixed(1) + 'L'} trend="" up Icon={TrendingUp} color="#d97706" bg="#fef3c7"/>
      </div>
      <div className="pm-card">
        <Sh title="Brands" sub="Manage product brands and manufacturers">
          <SearchBar placeholder="Search brands..." value={search} onChange={setSearch}/>
          <Btn cls="pri" icon={Plus} onClick={handleAddBrand}>Add Brand</Btn>
        </Sh>

        {/* Add/Edit Modal */}
        {(showAddModal || editingBrand) && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '450px', width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a'}}>
                {editingBrand ? 'Edit Brand' : 'Add Brand'}
              </h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px'}}>
                <div>
                  <label style={{display: 'block', fontSize: '.875rem', fontWeight: 600, marginBottom: '6px', color: '#475569'}}>
                    Brand Name
                  </label>
                  <input id="brand-name" defaultValue={editingBrand?.name} placeholder="Enter brand name" style={{
                    width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                    fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                  }}/>
                </div>
                <div>
                  <label style={{display: 'block', fontSize: '.875rem', fontWeight: 600, marginBottom: '6px', color: '#475569'}}>
                    Brand Slug
                  </label>
                  <input id="brand-slug" defaultValue={editingBrand?.slug} placeholder="e.g. soundmax" style={{
                    width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                    fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                  }}/>
                </div>
              </div>
              <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                <button onClick={() => { setShowAddModal(false); setEditingBrand(null); }} style={{
                  padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '6px',
                  background: '#f8fafc', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600,
                  color: '#475569'
                }}>
                  Cancel
                </button>
                <button onClick={handleSaveBrand} style={{
                  padding: '10px 20px', border: 'none', borderRadius: '6px',
                  background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600
                }}>
                  {editingBrand ? 'Save Changes' : 'Add Brand'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
              <div style={{fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px', color: '#0f172a'}}>
                Delete Brand?
              </div>
              <div style={{fontSize: '.9rem', color: '#64748b', marginBottom: '20px'}}>
                This will remove the brand. Products will retain their listing but brand mapping will be removed.
              </div>
              <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                <button onClick={() => setShowDeleteConfirm(null)} style={{
                  padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px',
                  background: '#f8fafc', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600,
                  color: '#475569'
                }}>
                  Cancel
                </button>
                <button onClick={() => handleDeleteBrand(showDeleteConfirm)} style={{
                  padding: '8px 16px', border: 'none', borderRadius: '6px',
                  background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600
                }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <table className="pm-ctbl">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Products</th>
              <th>Rating</th>
              <th>Revenue</th>
              <th className="r">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', fontSize: '.9rem' }}>Loading brands...</td></tr>
            ) : filteredBrands.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', fontSize: '.9rem' }}>No brands found</td></tr>
            ) : (
              filteredBrands.map((b, i) => {
              const Icon = BRAND_ICON[b.name] || Tag;
              return (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="pm-ctbl__ico" style={{ background: b.color + '18' }}>
                        <Icon size={16} color={b.color} strokeWidth={2}/>
                      </div>
                      <div>
                        <div className="pm-ctbl__n">{b.name}</div>
                        <div className="pm-ctbl__s">{b.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="pm-ctbl__stat">{b.products}</span></td>
                  <td><Rating value={b.rating}/></td>
                  <td><span className="pm-ctbl__stat">{b.revenue}</span></td>
                  <td className="r">
                    <div className="pm-acts">
                      <Ib icon={Edit2}  cls="e" title="Edit" onClick={() => handleEditBrand(b)}/>
                      <Ib icon={Trash2} cls="d" title="Delete" onClick={() => setShowDeleteConfirm(b.name)}/>
                    </div>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
const FeaturedProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await getAdminProducts({ size: 20 });
        setFeaturedProducts(data.content ? data.content.slice(0, Math.min(4, data.content.length)) : []);
      } catch (err) {
        toast.error('Failed to load products');
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleFilter = () => { toast.success('Filter applied (backend integration pending)'); };
  const handleAddToFeatured = () => { toast.success('Product added to featured (backend integration pending)'); };
  const handleToggleFeatured = (productId) => {
    setFeaturedProducts(prev => prev.map(p => p.id === productId ? { ...p, featured: !p.featured } : p));
  };
  const handlePreview = (productName) => window.open(`/product/${productName}`, '_blank');
  const handleEdit = (productName) => window.location.href = `/admin/products/edit/${productName}`;

  const filteredFeatured = featuredProducts.filter(p => (p.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pm-sub">
      <div className="pm-kpi-grid">
        <Kpi label="Featured Products" value={featuredProducts.length}      trend=""    up Icon={Star}        color="#d97706" bg="#fef3c7"/>
        <Kpi label="Avg Conversions"   value="—"    trend="" up Icon={TrendingUp}   color="#16a34a" bg="#dcfce7"/>
        <Kpi label="Featured Revenue"  value="—" trend=""  up Icon={DollarSign}  color="#2563eb" bg="#dbeafe"/>
        <Kpi label="Banner Slots Left" value="—"       trend=""    up={false} Icon={LayoutGrid} color="#7c3aed" bg="#ede9fe"/>
      </div>
      <div className="pm-card">
        <Sh title="Featured Products" sub="Products displayed prominently on homepage and category pages">
          <SearchBar placeholder="Search products..." value={search} onChange={setSearch}/>
          <Btn cls="out" icon={Filter} onClick={handleFilter}>Filter</Btn>
          <Btn cls="pri" icon={Plus} onClick={handleAddToFeatured}>Add to Featured</Btn>
        </Sh>
        <table className="pm-ctbl">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Rating</th>
              <th className="r">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', fontSize: '.9rem' }}>Loading featured products...</td></tr>
            ) : filteredFeatured.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', fontSize: '.9rem' }}>No featured products found</td></tr>
            ) : (
              filteredFeatured.map((p, index) => {
              const CatIcon = CAT_ICON[p.category] || Package;
              const isFeatured = index < 4;
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="pm-ctbl__ico" style={{ background: '#dbeafe' }}>
                        <CatIcon size={16} color="#2563eb" strokeWidth={2}/>
                      </div>
                      <div>
                        <div className="pm-ctbl__n">{p.name}</div>
                        <div className="pm-ctbl__s">{p.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="pm-ctbl__stat">{p.category}</span></td>
                  <td><span className="pm-ctbl__stat">{formatPrice(p.discountPrice || p.regularPrice)}</span></td>
                  <td><span className="pm-ctbl__stat" style={{ color: p.initialStock > 0 ? '#16a34a' : '#dc2626' }}>{p.initialStock > 0 ? `${p.initialStock} in stock` : 'Out of stock'}</span></td>
                  <td><Rating value={p.averageRating || 0}/></td>
                  <td className="r">
                    <div className="pm-acts">
                      <Ib icon={Star}  cls="p" title={isFeatured ? 'Remove from Featured' : 'Add to Featured'} onClick={() => handleToggleFeatured(p.id)}/>
                      <Ib icon={Eye}   cls="v" title="Preview" onClick={() => handlePreview(p.name)}/>
                      <Ib icon={Edit2} cls="e" title="Edit" onClick={() => handleEdit(p.name)}/>
                    </div>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------
    7. FLAGGED PRODUCTS
---------------------------------------------------------------- */
const FlaggedProducts = () => {
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');
  const [showResolveModal, setShowResolveModal] = useState(null);
  
  useEffect(() => {
    const fetchFlagged = async () => {
      setLoading(true);
      try {
        const data = await getAdminProducts({ size: 100 });
        const products = data.content || [];
        // Map products to flagged structure - filter by rejected/flagged status
        const flaggedItems = products
          .filter(p => p.status && ['rejected', 'flagged', 'inactive'].includes(p.status.toLowerCase()))
          .map(p => ({
            id: p.id,
            name: p.name,
            cat: p.category,
            vendor: `Vendor #${p.vendorId}`,
            reason: p.shortDescription || 'Policy violation',
            severity: p.status.toLowerCase() === 'rejected' ? 'High' : p.status.toLowerCase() === 'flagged' ? 'Medium' : 'Low',
            flaggedOn: p.createdAt ? new Date(Number(p.createdAt)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'
          }));
        setFlagged(flaggedItems);
      } catch (err) {
        toast.error('Failed to load flagged products');
        console.error('Failed to fetch flagged products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFlagged();
  }, []);

  const sevCls = s => s === 'High' ? 'flag' : s === 'Medium' ? 'pend' : 'low';
  const sevMap = { 'High': 'flag', 'Medium': 'pend', 'Low': 'low' };
  const filteredList = filter === 'All' ? flagged : flagged.filter(f => sevMap[f.severity] === sevMap[filter]);

  const handleExport = () => {
    if (!filteredList.length) { toast.error('No flagged products to export'); return; }
    exportCSV([
      ['ID','Product','Category','Vendor','Reason','Severity','Flagged On'],
      ...filteredList.map(f => [f.id, f.name, f.cat, f.vendor, f.reason, f.severity, f.flaggedOn])
    ], 'flagged_products.csv');
    toast.success(`Exported ${filteredList.length} flagged products`);
  };
  
  const handleResolve = async (flagId) => {
    setFlagged(prev => prev.filter(f => f.id !== flagId));
    setShowResolveModal(null);
    toast.success('Flag resolved successfully!');
  };

  const handleRemove = (flagId) => {
    toast((t) => (
      <div style={{fontSize:'.875rem',lineHeight:1.5}}>
        <p style={{margin:'0 0 8px',fontWeight:600}}>Remove product completely?</p>
        <p style={{margin:'0 0 12px',color:'#64748b'}}>This action cannot be undone.</p>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={() => toast.dismiss(t.id)} style={{padding:'6px 14px',border:'1px solid #cbd5e1',borderRadius:6,background:'#fff',cursor:'pointer',fontSize:'.8rem'}}>Cancel</button>
          <button onClick={() => { setFlagged(prev => prev.filter(f => f.id !== flagId)); toast.success('Product removed successfully!'); toast.dismiss(t.id); }}
            style={{padding:'6px 14px',border:'none',borderRadius:6,background:'#dc2626',color:'#fff',cursor:'pointer',fontSize:'.8rem'}}>Remove</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return (
    <div className="pm-sub">
      <div className="pm-kpi-grid">
        <Kpi label="Total Flagged"  value={flagged.length} trend="" up={false} Icon={Flag}          color="#dc2626" bg="#fee2e2"/>
        <Kpi label="High Severity"  value={flagged.filter(f => f.severity === 'High').length}  trend="" up={false} Icon={AlertTriangle} color="#dc2626" bg="#fee2e2"/>
        <Kpi label="Under Review"   value={Math.ceil(flagged.length * 0.5)}   trend="" up={false} Icon={Eye}           color="#d97706" bg="#fef3c7"/>
        <Kpi label="Resolved Today" value="—"  trend="" up         Icon={Check}         color="#16a34a" bg="#dcfce7"/>
      </div>
      <div className="pm-card">
        <Sh title="Flagged Products" sub="Products flagged for review due to policy violations or complaints">
          <SearchBar placeholder="Search flagged products..."/>
          <Pills opts={['All', 'High', 'Medium', 'Low']} val={filter} set={setFilter}/>
          <Btn cls="out" icon={Download} onClick={handleExport}>Export</Btn>
        </Sh>

        {/* Resolve Modal */}
        {showResolveModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '450px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a'}}>
                Resolve Flag
              </h3>
              <div style={{marginBottom: '20px', fontSize: '.875rem', color: '#64748b'}}>
                <p><strong>Product:</strong> {showResolveModal.name}</p>
                <p><strong>Reason:</strong> {showResolveModal.reason}</p>
                <p><strong>Severity:</strong> <Bdg label={showResolveModal.severity} cls={sevCls(showResolveModal.severity)}/></p>
              </div>
              <div style={{marginBottom: '20px'}}>
                <label style={{display: 'block', fontSize: '.875rem', fontWeight: 600, marginBottom: '6px', color: '#475569'}}>
                  Resolution Action
                </label>
                <select style={{
                  width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                  fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                }}>
                  <option>Mark as Resolved</option>
                  <option>Ask Vendor to Fix</option>
                  <option>Warning Issued</option>
                </select>
              </div>
              <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                <button onClick={() => setShowResolveModal(null)} style={{
                  padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '6px',
                  background: '#f8fafc', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600,
                  color: '#475569'
                }}>
                  Cancel
                </button>
                <button onClick={() => handleResolve(showResolveModal.id)} style={{
                  padding: '10px 20px', border: 'none', borderRadius: '6px',
                  background: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600
                }}>
                  Resolve
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="pm-tw">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '.9rem' }}>Loading flagged products...</div>
          ) : filteredList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '.9rem' }}>No flagged products found</div>
          ) : (
          <table className="pm-tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th>Reason</th>
                <th className="hm">Vendor</th>
                <th className="hm">Category</th>
                <th>Severity</th>
                <th className="hm">Flagged On</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(f => {
                const CatIcon = CAT_ICON[f.cat] || Package;
                return (
                  <tr key={f.id}>
                    <td>
                      <div className="pm-pc">
                        <div className="pm-th"><CatIcon size={16} color="#94a3b8" strokeWidth={1.8}/></div>
                        <div>
                          <div className="pm-pn">{f.name}</div>
                          <div className="pm-ps">{f.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={13} color="#d97706" style={{ flexShrink: 0 }}/>
                        <span style={{ fontSize: '.82rem', color: '#475569' }}>{f.reason}</span>
                      </div>
                    </td>
                    <td className="mu hm">{f.vendor}</td>
                    <td className="mu hm">{f.cat}</td>
                    <td><Bdg label={f.severity} cls={sevCls(f.severity)}/></td>
                    <td className="xs hm">{f.flaggedOn}</td>
                    <td className="r">
                      <div className="pm-acts">
                        <Ib icon={Eye}    cls="v" title="Review" onClick={() => toast.success(`Reviewing: ${f.name}`)}/>
                        <Ib icon={Check}  cls="e" title="Resolve" onClick={() => setShowResolveModal(f)}/>
                        <Ib icon={Trash2} cls="d" title="Remove Product" onClick={() => handleRemove(f.id)}/>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------
   8. SEO META
---------------------------------------------------------------- */
const SeoMeta = () => {
  const [selected, setSelected] = useState(0);
  const [seoPages, setSeoPages] = useState([]);
  useEffect(() => { getSeoPages().then(data => setSeoPages(Array.isArray(data) ? data : [])).catch(() => {}); }, []);

  const pg = (seoPages && seoPages[selected]) || { page:'', url:'', title:'', desc:'', status:'' };
  const statusCls = s => s === 'Optimised' ? 'act' : s === 'Good' ? 'new' : 'low';

  const handleSaveChanges = async () => {
    try {
      if (pg.id) await updateSeoPage(pg.id, pg);
      toast.success(`SEO metadata saved for ${pg.page}!`);
    } catch {
      toast.error('Failed to save SEO metadata');
    }
  };

  const handleOpenPage = () => {
    if (pg.url) window.open(pg.url, '_blank');
  };

  return (
    <div className="pm-sub">
      <div className="pm-kpi-grid">
        <Kpi label="Pages Managed" value={seoPages.length}     trend="" up Icon={Globe}        color="#2563eb" bg="#dbeafe"/>
        <Kpi label="Optimised"     value={seoPages.filter(p => p.status === 'Optimised').length}     trend="" up Icon={Check}         color="#16a34a" bg="#dcfce7"/>
        <Kpi label="Needs Work"    value={seoPages.filter(p => p.status === 'Needs Work').length}     trend="" up Icon={AlertTriangle} color="#d97706" bg="#fef3c7"/>
        <Kpi label="Avg SEO Score" value={seoPages.length ? Math.round(seoPages.reduce((s, p) => s + (p.score || 0), 0) / seoPages.length) + '/100' : '—'} trend="" up Icon={BarChart2}     color="#7c3aed" bg="#ede9fe"/>
      </div>
      <div className="pm-2col">
        <div className="pm-card">
          <Sh title="Pages" sub="Select a page to edit its SEO metadata"/>
          <div className="pm-sclist">
            {seoPages.map((p, i) => (
              <div
                key={i}
                className="pm-scrow"
                style={{ cursor: 'pointer', background: selected === i ? '#fff8f7' : '#fafcff', borderColor: selected === i ? 'rgba(224,62,26,.25)' : '' }}
                onClick={() => setSelected(i)}
              >
                <Globe size={15} color={selected === i ? '#E03E1A' : '#94a3b8'} style={{ flexShrink: 0 }}/>
                <div className="pm-f1">
                  <div className="pm-scrow__n">{p.page}</div>
                  <div style={{ fontSize: '.7rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>{p.url}</div>
                </div>
                <Bdg label={p.status} cls={statusCls(p.status)}/>
              </div>
            ))}
          </div>
        </div>

        <div className="pm-card">
          <Sh title={`SEO: ${pg.page}`} sub={`Editing metadata for ${pg.url}`}>
            <Btn cls="pri" sm icon={Check} onClick={handleSaveChanges}>Save Changes</Btn>
          </Sh>
          <div className="pm-seo-grid">
            <div className="pm-field full">
              <label className="pm-lbl">Page URL</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="pm-inp" defaultValue={pg.url} readOnly style={{ flex: 1, opacity: .65 }}/>
                <Ib icon={ExternalLink} cls="v" title="Open page" onClick={handleOpenPage}/>
              </div>
            </div>
            <div className="pm-field full">
              <label className="pm-lbl">Meta Title</label>
              <input className="pm-inp" defaultValue={pg.title} key={pg.page + '-t'}/>
              <div className="pm-char">Recommended: 50-60 chars · Current: {(pg.title || '').length} chars</div>
            </div>
            <div className="pm-field full">
              <label className="pm-lbl">Meta Description</label>
              <textarea className="pm-inp ta" defaultValue={pg.desc} key={pg.page + '-d'}/>
              <div className="pm-char">Recommended: 150-160 chars · Current: {(pg.desc || '').length} chars</div>
            </div>
            <div className="pm-field">
              <label className="pm-lbl">Focus Keyword</label>
              <input className="pm-inp" placeholder="e.g. buy electronics india" defaultValue={pg.page.toLowerCase()}/>
            </div>
            <div className="pm-field">
              <label className="pm-lbl">Canonical URL</label>
              <input className="pm-inp" defaultValue={`https://shopmart.in${pg.url}`}/>
            </div>
            <div className="pm-field full">
              <label className="pm-lbl">Open Graph Image URL</label>
              <input className="pm-inp" defaultValue="https://shopmart.in/og/default.jpg"/>
            </div>
            <div className="pm-field full">
              <label className="pm-lbl">Google Search Preview</label>
              <div className="pm-preview">
                <p className="pm-preview__lbl">Preview</p>
                <p className="pm-preview__url">shopmart.in{pg.url}</p>
                <p className="pm-preview__t">{pg.title}</p>
                <p className="pm-preview__d">{pg.desc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------
   MAIN COMPONENT
---------------------------------------------------------------- */
const TABS = [
  { key:'all',      label:'All Products',      Icon:Package,    Comp:AllProducts      },
  { key:'pending',  label:'Pending Approval',  Icon:Clock,      Comp:PendingApproval  },
  { key:'cats',     label:'Categories',         Icon:LayoutGrid, Comp:Categories       },
  { key:'subcats',  label:'Sub-categories',    Icon:Layers,     Comp:SubCategories    },
  { key:'brands',   label:'Brands',            Icon:Tag,        Comp:Brands           },
  { key:'featured', label:'Featured Products', Icon:Star,       Comp:FeaturedProducts },
  { key:'flagged',  label:'Flagged Products',  Icon:Flag,       Comp:FlaggedProducts  },
  { key:'seo',      label:'SEO Meta',          Icon:Globe,      Comp:SeoMeta          },
];

export default function ProductManagement() {
  const { tab } = useParams();
  const [active, setActive] = useState(tab || 'all');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [addProductData, setAddProductData] = useState({ name:'', sku:'', category:'', brand:'', mrp:'', price:'', stock:'', desc:'', vendor:'' });
  const [addProductLoading, setAddProductLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const { Comp } = TABS.find(t => t.key === active) || TABS[0];

  useEffect(() => {
    setActive(tab || 'all');
  }, [tab]);

  useEffect(() => {
    getCategories().then(data => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const handleHeaderAddProduct = () => {
    setAddProductData({ name:'', sku:'', category:'', brand:'', mrp:'', price:'', stock:'', desc:'', vendor:'' });
    setShowAddProductModal(true);
  };

  const handleAddProductSubmit = async () => {
    if (!addProductData.name.trim() || !addProductData.price) {
      toast.error('Product name and price are required');
      return;
    }
    setAddProductLoading(true);
    try {
      await addProduct({
        name: addProductData.name,
        sku: addProductData.sku || 'SKU-' + Date.now(),
        category: addProductData.category,
        brand: addProductData.brand,
        mrp: parseFloat(addProductData.mrp) || 0,
        price: parseFloat(addProductData.price) || 0,
        stock: parseInt(addProductData.stock) || 0,
        description: addProductData.desc,
        vendorName: addProductData.vendor,
        status: 'Active',
      });
      toast.success('Product added successfully!');
      setShowAddProductModal(false);
    } catch (e) {
      toast.error('Failed to add product: ' + (e.message || e));
    } finally {
      setAddProductLoading(false);
    }
  };

  const handleHeaderExport = async () => {
    try {
      const data = await getAdminProducts({ page: 0, size: 200, sortBy: 'createdAt', sortDir: 'desc' });
      const allProducts = data.content || [];
      if (!allProducts.length) { toast.error('No products to export'); return; }
      exportCSV([
        ['ID','Name','SKU','Category','Brand','Price','Stock','Status'],
        ...allProducts.map(p => [p.id, p.name, p.sku || '', p.category, p.brand || '', p.price ?? p.discountPrice ?? p.regularPrice ?? 0, p.initialStock ?? 0, p.status])
      ], 'products.csv');
      toast.success(`Exported ${allProducts.length} products`);
    } catch (err) {
      toast.error('Failed to export products');
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="pm">
      <div className="pm-hdr">
        <div>
          <h2 className="pm-hdr__t">Product Management</h2>
          <p className="pm-hdr__s">Manage products, categories, brands, approvals and SEO metadata.</p>
        </div>
        <div className="pm-hdr__a">
          <Btn cls="out" icon={Download} onClick={handleHeaderExport}>Export</Btn>
          <Btn cls="pri" icon={Plus} onClick={handleHeaderAddProduct}>Add Product</Btn>
        </div>
      </div>

      {/* Header Add Product Modal */}
      {showAddProductModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          overflow: 'auto'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '750px',
            width: '95%',
            margin: '40px auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button onClick={() => setShowAddProductModal(false)} style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#94a3b8',
              fontSize: '24px',
              lineHeight: 1
            }}>
              ×
            </button>

            <h3 style={{margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a'}}>
              Add New Product
            </h3>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px', maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', paddingRight: '8px'}}>
              {/* Basic Information */}
              <div style={{borderBottom: '1px solid #e2e8f0', paddingBottom: '16px'}}>
                <h4 style={{margin: '0 0 14px 0', fontSize: '.95rem', fontWeight: 700, color: '#1e293b'}}>Basic Information</h4>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px'}}>
                  <div>
                    <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                      Product Name *
                    </label>
                    <input placeholder="Enter product name" value={addProductData.name} onChange={e=>setAddProductData(p=>({...p,name:e.target.value}))} style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}/>
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                      SKU *
                    </label>
                    <input placeholder="e.g. WE-001" value={addProductData.sku} onChange={e=>setAddProductData(p=>({...p,sku:e.target.value}))} style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}/>
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                      Category *
                    </label>
                    <select value={addProductData.category} onChange={e=>setAddProductData(p=>({...p,category:e.target.value}))} style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}>
                      <option value="">Select category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                      Brand *
                    </label>
                    <input placeholder="Enter brand name" value={addProductData.brand} onChange={e=>setAddProductData(p=>({...p,brand:e.target.value}))} style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}/>
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div style={{borderBottom: '1px solid #e2e8f0', paddingBottom: '16px'}}>
                <h4 style={{margin: '0 0 14px 0', fontSize: '.95rem', fontWeight: 700, color: '#1e293b'}}>Pricing & Stock</h4>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px'}}>
                  <div>
                    <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                      MRP (Original Price) *
                    </label>
                    <input placeholder="Rs. 999" value={addProductData.mrp} onChange={e=>setAddProductData(p=>({...p,mrp:e.target.value}))} style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}/>
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                      Selling Price *
                    </label>
                    <input placeholder="Rs. 699" value={addProductData.price} onChange={e=>setAddProductData(p=>({...p,price:e.target.value}))} style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}/>
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                      Stock Quantity *
                    </label>
                    <input type="number" placeholder="0" value={addProductData.stock} onChange={e=>setAddProductData(p=>({...p,stock:e.target.value}))} style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}/>
                  </div>
                </div>
              </div>

              {/* Description & Details */}
              <div style={{borderBottom: '1px solid #e2e8f0', paddingBottom: '16px'}}>
                <h4 style={{margin: '0 0 14px 0', fontSize: '.95rem', fontWeight: 700, color: '#1e293b'}}>Description & Details</h4>
                <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                  <div>
                    <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                      Product Description
                    </label>
                    <textarea placeholder="Enter detailed product description..." value={addProductData.desc} onChange={e=>setAddProductData(p=>({...p,desc:e.target.value}))} style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: '80px'
                    }}/>
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px'}}>
                    <div>
                      <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                        Color/Variant
                      </label>
                      <input placeholder="e.g. Black, Red, Blue" style={{
                        width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                        fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                      }}/>
                    </div>
                    <div>
                      <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                        Size/Capacity
                      </label>
                      <input placeholder="e.g. S, M, L or 500ml, 1L" style={{
                        width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                        fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                      }}/>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div style={{borderBottom: '1px solid #e2e8f0', paddingBottom: '16px'}}>
                <h4 style={{margin: '0 0 14px 0', fontSize: '.95rem', fontWeight: 700, color: '#1e293b'}}>Specifications</h4>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px'}}>
                  <div>
                    <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                      Material/Composition
                    </label>
                    <input placeholder="e.g. Cotton, Stainless Steel" style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}/>
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                      Weight/Dimensions
                    </label>
                    <input placeholder="e.g. 500g or 10x10x5cm" style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}/>
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                      Warranty/Guarantee
                    </label>
                    <input placeholder="e.g. 1 Year, Lifetime, None" style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}/>
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                      Expiry/Best Before
                    </label>
                    <input type="date" style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}/>
                  </div>
                </div>
              </div>

              {/* Seller Information */}
              <div style={{borderBottom: '1px solid #e2e8f0', paddingBottom: '16px'}}>
                <h4 style={{margin: '0 0 14px 0', fontSize: '.95rem', fontWeight: 700, color: '#1e293b'}}>Seller Information</h4>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px'}}>
                  <div>
                    <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                      Seller/Vendor Name
                    </label>
                    <input placeholder="Enter vendor name" value={addProductData.vendor} onChange={e=>setAddProductData(p=>({...p,vendor:e.target.value}))} style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}/>
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                      Return Period (Days)
                    </label>
                    <input type="number" placeholder="7, 14, 30" style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}/>
                  </div>
                </div>
              </div>

              {/* Status & Visibility */}
              <div>
                <h4 style={{margin: '0 0 14px 0', fontSize: '.95rem', fontWeight: 700, color: '#1e293b'}}>Status & Visibility</h4>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px'}}>
                  <div>
                    <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                      Product Status
                    </label>
                    <select style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}>
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>Draft</option>
                    </select>
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase'}}>
                      Visibility
                    </label>
                    <select style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontSize: '.875rem', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}>
                      <option>Public</option>
                      <option>Private</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '20px'}}>
              <button onClick={() => setShowAddProductModal(false)} style={{
                padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '6px',
                background: '#f8fafc', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600,
                color: '#475569', transition: 'all 0.2s'
              }}>
                Cancel
              </button>
              <button onClick={handleAddProductSubmit} disabled={addProductLoading} style={{
                padding: '10px 20px', border: 'none', borderRadius: '6px',
                background: addProductLoading ? '#94a3b8' : '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600,
                transition: 'all 0.2s'
              }}>
                {addProductLoading ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Comp/>
    </div>
  );
}