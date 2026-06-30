import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, Loader2, Search, Save, ExternalLink, Trash2, Plus, Check, Edit3, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllProducts, BACKEND_URL, PLACEHOLDER_IMG, getPlatformSettings, updatePlatformSettings, deleteProductMedia, addProductInstagramUrl, updateProductMedia, uploadCustomThumbnail } from '../../api/api';
import './RealLifeLooks.css';

export default function RealLifeLooks() {
  const [allProducts, setAllProducts] = useState([]);
  const [instaProducts, setInstaProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [title, setTitle] = useState('Real-Life Looks');
  const [enabled, setEnabled] = useState(true);
  const [maxPosts, setMaxPosts] = useState(3);
  const [storyShape, setStoryShape] = useState('circle');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');

  // Add form state
  const [newUrl, setNewUrl] = useState('');
  const [newProductId, setNewProductId] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editUrl, setEditUrl] = useState('');

  // Thumbnail upload state
  const [uploadingThumb, setUploadingThumb] = useState(null);
  const [thumbMediaId, setThumbMediaId] = useState(null);
  const thumbInputRef = React.useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [products, settings] = await Promise.all([
          getAllProducts(),
          getPlatformSettings().catch(() => ({})),
        ]);
        setAllProducts(products || []);
        const insta = (products || []).filter(p =>
          p?.media?.some(m => m.fileType === 'instagram-url' && m.fileName)
        );
        setInstaProducts(insta);

        const ig = settings?.instagram || {};
        setSelectedIds(new Set(ig.featuredProductIds || []));
        setTitle(ig.homePageTitle || 'Real-Life Looks');
        setEnabled(ig.homePageEnabled !== false);
        setMaxPosts(ig.homePageMaxPosts || 3);
        setStoryShape(ig.storyShape || 'circle');
      } catch (e) {
        console.error('Failed to load', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleProduct = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = await getPlatformSettings().catch(() => ({}));
      await updatePlatformSettings({
        ...settings,
        instagram: {
          ...(settings?.instagram || {}),
          homePageEnabled: enabled,
          homePageTitle: title,
          homePageMaxPosts: maxPosts,
          storyShape: storyShape,
          featuredProductIds: [...selectedIds],
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    const url = newUrl.trim();
    if (!url) { toast.error('Enter an Instagram URL'); return; }
    if (!url.includes('instagram.com')) { toast.error('Enter a valid Instagram URL'); return; }
    if (!newProductId) { toast.error('Select a product'); return; }
    setAdding(true);
    try {
      const media = await addProductInstagramUrl(newProductId, url);
      const updatedProduct = {
        ...allProducts.find(p => p.id === Number(newProductId)),
        media: [...(allProducts.find(p => p.id === Number(newProductId))?.media || []), media],
      };
      setAllProducts(prev => prev.map(p => p.id === Number(newProductId) ? updatedProduct : p));
      if (!instaProducts.find(p => p.id === Number(newProductId))) {
        setInstaProducts(prev => [...prev, updatedProduct]);
      } else {
        setInstaProducts(prev => prev.map(p => p.id === Number(newProductId) ? updatedProduct : p));
      }
      setNewUrl('');
      toast.success('Instagram URL added');
    } catch (e) {
      toast.error('Failed to add URL');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (productId, mediaId) => {
    if (!window.confirm('Remove this Instagram URL?')) return;
    try {
      await deleteProductMedia(productId, mediaId);
      const updated = instaProducts.map(p => {
        if (p.id !== productId) return p;
        return { ...p, media: p.media.filter(m => m.id !== mediaId) };
      }).filter(p => p.media?.some(m => m.fileType === 'instagram-url' && m.fileName));
      setInstaProducts(updated);
      setAllProducts(prev => prev.map(p => {
        if (p.id !== productId) return p;
        const newMedia = p.media.filter(m => m.id !== mediaId);
        return { ...p, media: newMedia };
      }));
      toast.success('Instagram URL removed');
    } catch (e) {
      toast.error('Failed to remove');
    }
  };

  const startEdit = (media) => {
    setEditingId(media.id);
    setEditUrl(media.fileName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditUrl('');
  };

  const saveEdit = async (mediaId) => {
    if (!editUrl.trim()) { toast.error('URL cannot be empty'); return; }
    try {
      await updateProductMedia(mediaId, editUrl.trim());
      setInstaProducts(prev => prev.map(p => ({
        ...p,
        media: p.media.map(m => m.id === mediaId ? { ...m, fileName: editUrl.trim() } : m),
      })));
      setAllProducts(prev => prev.map(p => ({
        ...p,
        media: p.media.map(m => m.id === mediaId ? { ...m, fileName: editUrl.trim() } : m),
      })));
      setEditingId(null);
      toast.success('URL updated');
    } catch (e) {
      toast.error('Failed to update');
    }
  };

  const getProductImage = (product) => {
    const primary = product?.media?.find(m => m.isPrimary) || product?.media?.[0];
    if (!primary?.fileName) return PLACEHOLDER_IMG;
    if (primary.fileName.startsWith('http://') || primary.fileName.startsWith('https://')) return primary.fileName;
    return `${BACKEND_URL}/uploads/products/${primary.fileName}`;
  };

  const getInstaUrls = (product) =>
    product?.media?.filter(m => m.fileType === 'instagram-url' && m.fileName) || [];

  const getThumbnailUrl = (media) => {
    if (media.customThumbnail) return `${BACKEND_URL}/uploads/products/${media.customThumbnail}`;
    return null;
  };

  const handleUploadThumbnail = async (mediaId, file) => {
    if (!file) return;
    setUploadingThumb(mediaId);
    try {
      const updated = await uploadCustomThumbnail(mediaId, file);
      setAllProducts(prev => prev.map(p => ({
        ...p,
        media: p.media.map(m => m.id === mediaId ? { ...m, customThumbnail: updated.customThumbnail } : m),
      })));
      setInstaProducts(prev => prev.map(p => ({
        ...p,
        media: p.media.map(m => m.id === mediaId ? { ...m, customThumbnail: updated.customThumbnail } : m),
      })));
      toast.success('Thumbnail uploaded');
    } catch (e) {
      console.error('Thumbnail upload error:', e);
      toast.error('Failed to upload thumbnail: ' + (e.message || 'Unknown error'));
    } finally {
      setUploadingThumb(null);
    }
  };

  const filtered = instaProducts.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const allUrls = filtered.flatMap(p =>
    getInstaUrls(p).map(m => ({ ...m, product: p }))
  );

  return (
    <div className="rll-page">
      <div className="rll-header">
        <div className="rll-header-left">
          <Camera size={22} />
          <div>
            <h1>Real-Life Looks</h1>
            <p className="rll-sub">Manage Instagram URLs and curate which products appear on the home page feed</p>
          </div>
        </div>
        <button className="rll-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="rll-settings-bar">
        <label className="rll-toggle-label">
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
          <span>Enable section on home page</span>
        </label>
        <div className="rll-field">
          <label>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="rll-field">
          <label>Max posts</label>
          <select value={maxPosts} onChange={e => setMaxPosts(Number(e.target.value))}>
            {[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="rll-field">
          <label>Story shape</label>
          <select value={storyShape} onChange={e => setStoryShape(e.target.value)}>
            <option value="circle">Circle</option>
            <option value="square">Rounded Square</option>
          </select>
        </div>
      </div>

      {/* ── Add Instagram URL ── */}
      <div className="rll-add-section">
        <div className="rll-add-header">
          <Plus size={16} />
          <span>Add Instagram URL</span>
        </div>
        <div className="rll-add-form">
          <div className="rll-add-field">
            <label>Instagram URL</label>
            <input
              placeholder="https://www.instagram.com/p/..."
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            />
          </div>
          <div className="rll-add-field">
            <label>Assign to Product</label>
            <select value={newProductId} onChange={e => setNewProductId(e.target.value)}>
              <option value="">— Select a product —</option>
              {allProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button className="rll-add-btn" onClick={handleAdd} disabled={adding}>
            {adding ? <Loader2 size={14} className="spinner" /> : <Plus size={14} />}
            Add
          </button>
        </div>
      </div>

      {/* ── Instagram URL Table ── */}
      <div className="rll-url-section">
        <div className="rll-url-header">
          <h2>Instagram Feed</h2>
          <p className="rll-url-sub">Instagram post URLs linked to products. These appear in an Instagram-style feed on the product page.</p>
        </div>

        <div className="rll-url-table">
          <div className="rll-url-th">
            <span className="rll-url-col-img">Product</span>
            <span className="rll-url-col-url">Instagram URL</span>
            <span className="rll-url-col-thumb">Thumbnail</span>
            <span className="rll-url-col-act">Actions</span>
          </div>

          {allUrls.length > 0 ? allUrls.map((media, i) => (
            <div key={media.id || i} className="rll-url-row">
              <div className="rll-url-col-img">
                <img src={getProductImage(media.product)} alt="" className="rll-url-thumb" />
                <span className="rll-url-pname">{media.product.name}</span>
              </div>
              <div className="rll-url-col-url">
                {editingId === media.id ? (
                  <div className="rll-edit-inline">
                    <input value={editUrl} onChange={e => setEditUrl(e.target.value)} autoFocus />
                    <button className="rll-edit-save" onClick={() => saveEdit(media.id)} title="Save"><Check size={14} /></button>
                    <button className="rll-edit-cancel" onClick={cancelEdit} title="Cancel"><X size={14} /></button>
                  </div>
                ) : (
                  <a href={media.fileName} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={12} /> {media.fileName}
                  </a>
                )}
              </div>
              <div className="rll-url-col-thumb">
                <div className="rll-thumb-upload" onClick={() => { setThumbMediaId(media.id); thumbInputRef.current?.click(); }}>
                  {uploadingThumb === media.id ? (
                    <Loader2 size={16} className="spinner" />
                  ) : getThumbnailUrl(media) ? (
                    <img src={getThumbnailUrl(media)} alt="thumb" className="rll-thumb-preview" />
                  ) : (
                    <div className="rll-thumb-placeholder"><ImageIcon size={16} /></div>
                  )}
                </div>
              </div>
              <div className="rll-url-col-act">
                <button className="rll-url-edit" onClick={() => startEdit(media)} title="Edit URL"><Edit3 size={14} /></button>
                <button className="rll-url-del" onClick={() => handleDelete(media.product.id, media.id)} title="Remove URL"><Trash2 size={14} /></button>
              </div>
            </div>
          )) : (
            <p className="rll-empty">No Instagram URLs found. Add one using the form above.</p>
          )}
        </div>

        {allUrls.length > 0 && (
          <p className="rll-url-count">Currently <strong>{allUrls.length}</strong> Instagram URL(s).</p>
        )}
        <input ref={thumbInputRef} type="file" accept="image/*,.gif" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f && thumbMediaId) handleUploadThumbnail(thumbMediaId, f); e.target.value = ''; }} />
      </div>

      {/* ── Product Selection ── */}
      <div className="rll-pick-header">
        <h2>Select Products for Home Page Feed</h2>
        <p className="rll-sub">Toggle products to include them in the Real-Life Looks section on the home page.</p>
      </div>

      <div className="rll-search">
        <Search size={16} />
        <input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="rll-loading"><Loader2 size={32} className="spinner" /></div>
      ) : (
        <div className="rll-tw">
          <table className="rll-tbl">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Name</th>
                <th>Price</th>
                <th>Tag</th>
                <th>Status</th>
                <th className="rll-th-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(product => {
                const selected = selectedIds.has(product.id);
                const instaCount = getInstaUrls(product).length;
                return (
                  <tr key={product.id} onClick={() => toggleProduct(product.id)} style={{cursor:'pointer'}}>
                    <td>
                      <img src={getProductImage(product)} alt={product.name} style={{width:36, height:36, borderRadius:6, objectFit:'cover', background:'#f1f5f9'}} />
                    </td>
                    <td style={{fontWeight:600}}>{product.name}</td>
                    <td style={{color:'#E03E1A', fontWeight:700}}>₹{((product.discountPrice || product.regularPrice) || 0).toFixed(2)}</td>
                    <td style={{fontSize:'.78rem', color:'#64748b'}}>{instaCount > 0 ? `${instaCount} URL(s)` : '\u2014'}</td>
                    <td>
                      {selected ? (
                        <span style={{background:'#dcfce7', color:'#16a34a', padding:'2px 8px', borderRadius:5, fontSize:'.68rem', fontWeight:700}}>Selected</span>
                      ) : (
                        <span style={{background:'#f1f5f9', color:'#64748b', padding:'2px 8px', borderRadius:5, fontSize:'.68rem', fontWeight:700}}>Not Selected</span>
                      )}
                    </td>
                    <td>
                      <div style={{display:'flex', gap:4, justifyContent:'flex-end'}}>
                        {selected ? <CheckCircle size={20} color="#16a34a" /> : <XCircle size={20} color="#cbd5e1" />}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>
                  {search ? 'No products match your search.' : 'No products with Instagram URLs found.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
