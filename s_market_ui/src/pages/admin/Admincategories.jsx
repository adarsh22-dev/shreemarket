import React, { useState, useEffect, useRef } from 'react';
import './Admincategories.css';
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getSubCategories, createSubCategory, updateSubCategory, deleteSubCategory,
  uploadCategoryImage, getAllProducts, BACKEND_URL
} from '../../api/api';
import toast from 'react-hot-toast';
import { exportCSV } from './VendorShared';

// Category images
import GroceryImg from '../../assets/Grocery_&_Gourmet_Food.svg';
import HealthImg from '../../assets/Health_&_Household.svg';
import HomeKitchenImg from '../../assets/Home_&_Kitchen.svg';
import BeautyImg from '../../assets/Beauty_&_Personal_Care.svg';
import ClothingImg from '../../assets/Clothing_Shoes_Jewellery.svg';
import ToysImg from '../../assets/Toys_&_Games.svg';
import PatioImg from '../../assets/Patio_Lawn_&_Garden.svg';
import MusicalImg from '../../assets/Musical_Instruments.svg';
import ArtsCraftsImg from '../../assets/Arts_Crafts.svg';

const DEFAULT_CAT_IMAGES = {
  'grocery & gourmet food': GroceryImg,
  'grocery': GroceryImg,
  'health & household': HealthImg,
  'health': HealthImg,
  'home & kitchen': HomeKitchenImg,
  'home': HomeKitchenImg,
  'beauty & personal care': BeautyImg,
  'beauty': BeautyImg,
  'clothing, shoes & jewellery': ClothingImg,
  'clothing': ClothingImg,
  'toys & games': ToysImg,
  'toys': ToysImg,
  'patio, lawn & garden': PatioImg,
  'patio': PatioImg,
  'musical instruments': MusicalImg,
  'musical': MusicalImg,
  'arts & crafts': ArtsCraftsImg,
  'arts': ArtsCraftsImg,
};

const getCategoryImage = (name, customImage) => {
  if (customImage) {
    if (customImage.startsWith('/uploads')) return `${BACKEND_URL}${customImage}`;
    return customImage;
  }
  return DEFAULT_CAT_IMAGES[name?.toLowerCase()] || null;
};

/* ================================================================
   Categories & Sub-categories Manager
   ================================================================ */

const PALETTE = ['#E03E1A','#2563eb','#16a34a','#7c3aed','#d97706','#0d9488','#db2777','#64748b'];
const colorFor = s => PALETTE[s.charCodeAt(0) % PALETTE.length];

const PER_PAGE = 8;

/* ── SVG Icons ── */
const I = ({ d, size=14, color='currentColor', sw=2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i)=><path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);
const IC = {
  search:   'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  edit:     ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  trash:    ['M3 6h18','M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6','M10 11v6M14 11v6','M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'],
  eye:      'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  plus:     'M12 5v14M5 12h14',
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  chevL:    'M15 18l-6-6 6-6',
  chevR:    'M9 18l6-6-6-6',
  tag:      'M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42L12 2zM7 7h.01',
  folder:   ['M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'],
  layers:   ['M12 2 2 7l10 5 10-5-10-5z','M2 17l10 5 10-5','M2 12l10 5 10-5'],
  star:     'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  check:    'M20 6 9 17l-5-5',
  move:     ['M5 9l-3 3 3 3','M9 5l3-3 3 3','M15 19l-3 3-3-3','M19 9l3 3-3 3','M2 12h20','M12 2v20'],
  hash:     'M4 9h16M4 15h16M10 3 8 21M16 3l-2 18',
  box:      ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z','M3.27 6.96 12 12.01l8.73-5.05','M12 22.08V12'],
};

/* ── Shared UI ── */
const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="cs-search">
    <span className="cs-search__ico"><I d={IC.search} size={14} color="#94a3b8"/></span>
    <input className="cs-search__inp" placeholder={placeholder} value={value} onChange={onChange}/>
  </div>
);

const Pills = ({ options, value, onChange }) => (
  <div className="cs-pills">
    {options.map(o=>(
      <button key={o} className={`cs-pill${value===o?' cs-pill--on':''}`} onClick={()=>onChange(o)}>{o}</button>
    ))}
  </div>
);

const StatusBdg = ({ status }) => {
  const m = { Active:'act', Inactive:'inact', Draft:'draft' };
  return <span className={`cs-bdg cs-bdg--${m[status]||'inact'}`}><span className="cs-bdg__dot"/>{status}</span>;
};

const ActBtn = ({ d, cls, title, onClick }) => (
  <button className={`cs-act cs-act--${cls}`} title={title} onClick={onClick}>
    <I d={d} size={13}/>
  </button>
);

const Pager = ({ page, total, perPage, onPrev, onNext }) => {
  const pages = Math.ceil(total/perPage)||1;
  return (
    <div className="cs-pag">
      <span className="cs-pag__info">
        {total===0?'0 results':`${page*perPage+1}–${Math.min((page+1)*perPage,total)} of ${total}`}
      </span>
      <div className="cs-pag__ctrl">
        <button className="cs-pag__btn" onClick={onPrev} disabled={page===0}><I d={IC.chevL} size={13} color="#475569"/></button>
        <span className="cs-pag__lbl">{page+1} / {pages}</span>
        <button className="cs-pag__btn" onClick={onNext} disabled={(page+1)*perPage>=total}><I d={IC.chevR} size={13} color="#475569"/></button>
      </div>
    </div>
  );
};

/* ── Searchable Dropdown ── */
const SearchableDropdown = ({ options, value, onChange, placeholder = 'Select...' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => !query || o.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="cs-sdrop" ref={wrapRef}>
      <div
        className={`cs-sdrop__trigger${open ? ' cs-sdrop__trigger--open' : ''}`}
        onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 0); }}
      >
        <span className={`cs-sdrop__value${!value ? ' cs-sdrop__value--placeholder' : ''}`}>
          {value || placeholder}
        </span>
        <I d={open ? 'M6 9l6 6 6-6' : IC.chevR} size={12} color="#64748b" />
      </div>
      {open && (
        <div className="cs-sdrop__menu">
          <div className="cs-sdrop__search">
            <I d={IC.search} size={12} color="#94a3b8" />
            <input
              ref={inputRef}
              className="cs-sdrop__input"
              placeholder="Search category..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="cs-sdrop__list">
            {filtered.length === 0 ? (
              <div className="cs-sdrop__empty">No categories found</div>
            ) : (
              filtered.map(o => (
                <div
                  key={o}
                  className={`cs-sdrop__item${o === value ? ' cs-sdrop__item--sel' : ''}`}
                  onClick={() => { onChange(o); setOpen(false); setQuery(''); }}
                >
                  <div className="cs-sdrop__item-icon" style={{ background: colorFor(o) + '14', border: `1px solid ${colorFor(o)}22` }}>
                    <I d={IC.folder} size={11} color={colorFor(o)} sw={1.8} />
                  </div>
                  <span>{o}</span>
                  {o === value && <I d={IC.check} size={12} color="#E03E1A" sw={2.5} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Add/Edit Modal ── */
const Modal = ({ mode, type, item, parents, onClose, onSave }) => {
  const isSub = type === 'sub';
  const [name,     setName]     = useState(item?.name     || '');
  const [slug,     setSlug]     = useState(item?.slug     || '');
  const [desc,     setDesc]     = useState(item?.desc     || '');
  const [parent,   setParent]   = useState(item?.parent   || (parents[0]||''));
  const [status,   setStatus]   = useState(item?.status   || 'Active');
  const [featured, setFeatured] = useState(item?.featured || false);
  const [image,    setImage]    = useState(item?.image    || '');
  const [imageFile, setImageFile] = useState(null);
  const resolveImageUrl = (img) => img && img.startsWith('/uploads') ? `${BACKEND_URL}${img}` : img;
  const [imagePreview, setImagePreview] = useState(resolveImageUrl(item?.image) || getCategoryImage(item?.name) || '');
  const imageInputRef = useRef(null);

  const autoSlug = v => v.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  const handleName = v => {
    setName(v);
    if (!item) setSlug(autoSlug(v));
    if (!image && !imageFile) setImagePreview(getCategoryImage(v) || '');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="cs-overlay" onClick={e=>{ if(e.target.className==='cs-overlay') onClose(); }}>
      <div className="cs-modal">
        <div className="cs-modal__hd">
          <p className="cs-modal__title">
            {mode==='add'?`Add ${isSub?'Sub-category':'Category'}`:`Edit ${isSub?'Sub-category':'Category'}`}
          </p>
          <button className="cs-modal__close" onClick={onClose}>
            <I d="M18 6 6 18M6 6l12 12" size={14}/>
          </button>
        </div>

        <div className="cs-modal__body">
          {!isSub && (
            <div className="cs-field">
              <label className="cs-field__lbl">Category Image</label>
              <div className="cs-img-upload">
                <div className="cs-img-upload__preview" onClick={() => imageInputRef.current?.click()}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Category" className="cs-img-upload__img" />
                  ) : (
                    <div className="cs-img-upload__placeholder">
                      <I d={IC.plus} size={20} color="#94a3b8"/>
                      <span>Upload Image</span>
                    </div>
                  )}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                {imagePreview && (
                  <button className="cs-img-upload__remove" onClick={() => { setImage(''); setImageFile(null); setImagePreview(getCategoryImage(name) || ''); }}>
                    <I d="M18 6 6 18M6 6l12 12" size={10}/> Remove
                  </button>
                )}
              </div>
            </div>
          )}
          {isSub && (
            <div className="cs-field">
              <label className="cs-field__lbl">Parent Category *</label>
              <SearchableDropdown
                options={parents}
                value={parent}
                onChange={setParent}
                placeholder="Select parent category..."
              />
            </div>
          )}
          <div className="cs-field">
            <label className="cs-field__lbl">Name *</label>
            <input className="cs-field__inp" placeholder="e.g. Monocrystalline Panels"
              value={name} onChange={e=>handleName(e.target.value)}/>
          </div>
          <div className="cs-field">
            <label className="cs-field__lbl">Slug</label>
            <input className="cs-field__inp cs-field__inp--mono" placeholder="auto-generated"
              value={slug} onChange={e=>setSlug(e.target.value)}/>
          </div>
          {!isSub && (
            <div className="cs-field">
              <label className="cs-field__lbl">Description</label>
              <textarea className="cs-field__ta" rows={3} placeholder="Brief description…"
                value={desc} onChange={e=>setDesc(e.target.value)}/>
            </div>
          )}
          <div className="cs-field-row">
            <div className="cs-field" style={{flex:1}}>
              <label className="cs-field__lbl">Status</label>
              <select className="cs-field__sel" value={status} onChange={e=>setStatus(e.target.value)}>
                <option>Active</option><option>Inactive</option><option>Draft</option>
              </select>
            </div>
            {!isSub && (
              <div className="cs-field" style={{flex:1}}>
                <label className="cs-field__lbl">Featured</label>
                <div className="cs-toggle" onClick={()=>setFeatured(!featured)}>
                  <div className={`cs-toggle__track${featured?' cs-toggle__track--on':''}`}>
                    <div className="cs-toggle__thumb"/>
                  </div>
                  <span>{featured?'Yes':'No'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="cs-modal__ft">
          <button className="cs-btn cs-btn--out" onClick={onClose}>Cancel</button>
          <button className="cs-btn cs-btn--pri" onClick={()=>onSave({ name, slug, desc, parent, status, featured, image, imageFile })}>
            <I d={IC.check} size={13} color="#fff" sw={2.5}/>
            {mode==='add'?'Create':'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================================================================
   TAB 1 — CATEGORIES
   ================================================================ */
const CategoriesTab = ({ categories, loading, onRefresh }) => {
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('All');
  const [checked, setChecked] = useState({});
  const [page,    setPage]    = useState(0);
  const [modal,   setModal]   = useState(null); // {mode:'add'|'edit', item?}
  const [cats,    setCats]    = useState([]);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    setCats(categories);
  }, [categories]);

  const STATUS_OPTS = ['All','Active','Inactive'];
  const list = cats.filter(c => {
    const mS = filter==='All' || c.status===filter;
    const q  = search.toLowerCase();
    const mQ = !q || c.name.toLowerCase().includes(q) || (c.id != null && String(c.id).includes(q)) || c.slug.toLowerCase().includes(q);
    return mS && mQ;
  });
  const slice = list.slice(page*PER_PAGE, (page+1)*PER_PAGE);
  const allC  = slice.length>0 && slice.every(c=>checked[c.id]);
  const toggleAll = () => {
    if(allC) setChecked(p=>{const n={...p};slice.forEach(c=>delete n[c.id]);return n;});
    else     setChecked(p=>{const n={...p};slice.forEach(c=>n[c.id]=true);return n;});
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      let imageUrl = data.image || '';

      // Upload the file if a new image was selected
      if (data.imageFile) {
        const uploadResult = await uploadCategoryImage(data.imageFile);
        imageUrl = uploadResult.url || '';
      }

      if (modal.mode === 'add' || (modal.mode === 'edit' && modal.item.id == null)) {
        await createCategory({
          name: data.name,
          slug: data.slug,
          description: data.desc,
          status: data.status,
          featured: data.featured,
          image: imageUrl,
        });
        toast.success(modal.mode === 'add' ? 'Category created successfully' : 'Product-derived category converted to admin category');
      } else {
        await updateCategory(modal.item.id, {
          name: data.name,
          slug: data.slug,
          description: data.desc,
          status: data.status,
          featured: data.featured,
          image: imageUrl,
        });
        toast.success('Category updated successfully');
      }
      setModal(null);
      onRefresh();
    } catch (err) {
      toast.error(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (id == null) { toast.error('Cannot delete product-derived category'); return; }
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory(id);
      toast.success('Category deleted successfully');
      onRefresh();
    } catch (err) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  if (loading) return <div className="cs-sub"><div className="cs-card"><p style={{padding:'2rem',textAlign:'center',color:'#64748b'}}>Loading categories...</p></div></div>;

  return (
    <div className="cs-sub">
      {modal && <Modal mode={modal.mode} type="cat" item={modal.item} parents={[]}
        onClose={()=>setModal(null)} onSave={handleSave}/>}

      <div className="cs-card">
        <div className="cs-sh">
          <div>
            <p className="cs-sh__t">All Categories</p>
            <p className="cs-sh__s">{list.length} categor{list.length===1?'y':'ies'} total</p>
          </div>
          <div className="cs-sh__r">
            <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search category…"/>
            <Pills options={STATUS_OPTS} value={filter} onChange={v=>{setFilter(v);setPage(0);}}/>
            <button className="cs-btn cs-btn--out" onClick={() => exportCSV([['Name','Slug','Products','Sub-cats','Status','Featured','Created'], ...cats.map(c => [c.name, c.slug, c.products, c.subCats, c.status, c.featured ? 'Yes' : 'No', c.createdOn])], 'categories.csv')}><I d={IC.download} size={13} color="#475569"/>Export</button>
            <button className="cs-btn cs-btn--pri" onClick={()=>setModal({mode:'add'})}>
              <I d={IC.plus} size={13} color="#fff"/>Add Category
            </button>
          </div>
        </div>

        <div className="cs-tw">
          <table className="cs-tbl">
            <thead>
              <tr>
                <th className="cs-th cs-th--chk"><input type="checkbox" className="cs-chk" checked={allC} onChange={toggleAll}/></th>
                <th className="cs-th">Image</th>
                <th className="cs-th">Category</th>
                <th className="cs-th cs-hm">Slug</th>
                <th className="cs-th">Products</th>
                <th className="cs-th cs-hm">Sub-cats</th>
                <th className="cs-th cs-hm">Source</th>
                <th className="cs-th cs-hm">Featured</th>
                <th className="cs-th cs-hm">Created</th>
                <th className="cs-th">Status</th>
                <th className="cs-th cs-th--r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.length===0&&<tr><td colSpan="11" className="cs-empty">No categories found.</td></tr>}
              {slice.map(c=>{
                const catImg = getCategoryImage(c.name, c.image);
                return (
                <tr key={c.id || c.name} className={`cs-tr${checked[c.id]?' cs-tr--sel':''}`}>
                  <td className="cs-td cs-td--chk">
                    <input type="checkbox" className="cs-chk" checked={!!checked[c.id]}
                      onChange={()=>setChecked(p=>({...p,[c.id]:!p[c.id]}))}/>
                  </td>
                  <td className="cs-td">
                    <div className="cs-cat-img-cell">
                      {catImg ? (
                        <img src={catImg} alt={c.name} className="cs-cat-img"/>
                      ) : (
                        <div className="cs-cat-img-placeholder">
                          <I d={IC.folder} size={18} color="#94a3b8"/>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="cs-td">
                    <div className="cs-cat-cell">
                      <div>
                        <div className="cs-cat-cell__n">{c.name}</div>
                        <div className="cs-cat-cell__id">{c.id || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="cs-td cs-hm"><span className="cs-slug">{c.slug}</span></td>
                  <td className="cs-td">
                    <div className="cs-count">
                      <I d={IC.box} size={12} color="#94a3b8"/>
                      <span>{c.products}</span>
                    </div>
                  </td>
                  <td className="cs-td cs-hm">
                    <div className="cs-count">
                      <I d={IC.layers} size={12} color="#94a3b8"/>
                      <span>{c.subCats}</span>
                    </div>
                  </td>
                  <td className="cs-td cs-hm">
                    {c._productDerived
                      ? <span className="cs-feat" style={{fontSize:'.65rem'}}><I d={IC.box} size={10} color="#64748b"/> Product</span>
                      : <span className="cs-feat" style={{fontSize:'.65rem'}}><I d={IC.folder} size={10} color="#7c3aed"/> Admin</span>}
                  </td>
                  <td className="cs-td cs-hm">
                    {c.featured
                      ? <span className="cs-feat"><I d={IC.star} size={11} color="#d97706" fill="#fef3c7" sw={0}/>Featured</span>
                      : <span className="cs-no-feat">—</span>}
                  </td>
                  <td className="cs-td cs-hm"><span className="cs-date">{c.createdOn}</span></td>
                  <td className="cs-td"><StatusBdg status={c.status}/></td>
                  <td className="cs-td cs-td--r">
                    <div className="cs-acts">
                      <ActBtn d={IC.eye}   cls="view"  title="View products" onClick={() => toast.info('Viewing products in ' + (c.name || c))}/>
                      <ActBtn d={IC.edit}  cls="edit"  title="Edit" onClick={()=>setModal({mode:'edit',item:c})}/>
                      {c.id != null && <ActBtn d={IC.trash} cls="trash" title="Delete" onClick={()=>handleDelete(c.id)}/>}
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
        <Pager page={page} total={list.length} perPage={PER_PAGE}
          onPrev={()=>setPage(p=>p-1)} onNext={()=>setPage(p=>p+1)}/>
      </div>
    </div>
  );
};

/* ================================================================
   TAB 2 — SUB-CATEGORIES
   ================================================================ */
const SubCategoriesTab = ({ categories = [], subCategories = [], onRefresh }) => {
  const [search,  setSearch]  = useState('');
  const [parentF, setParentF] = useState('All');
  const [statusF, setStatusF] = useState('All');
  const [checked, setChecked] = useState({});
  const [page,    setPage]    = useState(0);
  const [modal,   setModal]   = useState(null);
  const [saving,  setSaving]  = useState(false);

  const subs = subCategories;
  const parentNames = ['All', ...Array.from(new Set(subs.map(s=>s.parent).filter(Boolean)))];
  const STATUS_OPTS = ['All','Active','Inactive','Draft'];

  const list = subs.filter(s => {
    const mP = parentF==='All' || s.parent===parentF;
    const mS = statusF==='All' || s.status===statusF;
    const q  = search.toLowerCase();
    const mQ = !q || s.name.toLowerCase().includes(q) || String(s.id).includes(q) || (s.parent||'').toLowerCase().includes(q) || s.slug.toLowerCase().includes(q);
    return mP && mS && mQ;
  });

  const slice = list.slice(page*PER_PAGE, (page+1)*PER_PAGE);
  const allC  = slice.length>0 && slice.every(s=>checked[s.id]);
  const toggleAll = () => {
    if(allC) setChecked(p=>{const n={...p};slice.forEach(s=>delete n[s.id]);return n;});
    else     setChecked(p=>{const n={...p};slice.forEach(s=>n[s.id]=true);return n;});
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      // Find parent category ID by name
      const parentCat = categories.find(c => c.name === data.parent);
      if (!parentCat) {
        toast.error('Please select a valid parent category');
        setSaving(false);
        return;
      }

      if (modal.mode === 'add') {
        await createSubCategory(parentCat.id, {
          name: data.name,
          slug: data.slug,
          status: data.status,
        });
        toast.success('Sub-category created successfully');
      } else {
        const newParentCat = categories.find(c => c.name === data.parent);
        await updateSubCategory(modal.item.id, newParentCat?.id || null, {
          name: data.name,
          slug: data.slug,
          status: data.status,
        });
        toast.success('Sub-category updated successfully');
      }
      setModal(null);
      onRefresh();
    } catch (err) {
      toast.error(err.message || 'Failed to save sub-category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sub-category?')) return;
    try {
      await deleteSubCategory(id);
      toast.success('Sub-category deleted successfully');
      onRefresh();
    } catch (err) {
      toast.error(err.message || 'Failed to delete sub-category');
    }
  };

  const catParents = categories.map(c => c.name);

  return (
    <div className="cs-sub">
      {modal && <Modal mode={modal.mode} type="sub" item={modal.item} parents={catParents}
        onClose={()=>setModal(null)} onSave={handleSave}/>}

      <div className="cs-card">
        <div className="cs-sh">
          <div>
            <p className="cs-sh__t">All Sub-categories</p>
            <p className="cs-sh__s">{list.length} sub-categor{list.length===1?'y':'ies'} found</p>
          </div>
          <div className="cs-sh__r">
            <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search sub-category…"/>
            <Pills options={parentNames.slice(0,5)} value={parentF} onChange={v=>{setParentF(v);setPage(0);}}/>
            <Pills options={STATUS_OPTS} value={statusF} onChange={v=>{setStatusF(v);setPage(0);}}/>
            <button className="cs-btn cs-btn--out" onClick={() => exportCSV([['Name','Parent','Slug','Products','Sort Order','Status','Created'], ...subs.map(s => [s.name, s.parent, s.slug, s.products, s.sortOrder, s.status, s.createdOn])], 'categories-report.csv')}><I d={IC.download} size={13} color="#475569"/>Export</button>
            <button className="cs-btn cs-btn--pri" onClick={()=>setModal({mode:'add'})}>
              <I d={IC.plus} size={13} color="#fff"/>Add Sub-category
            </button>
          </div>
        </div>

        <div className="cs-tw">
          <table className="cs-tbl">
            <thead>
              <tr>
                <th className="cs-th cs-th--chk"><input type="checkbox" className="cs-chk" checked={allC} onChange={toggleAll}/></th>
                <th className="cs-th">Sub-category</th>
                <th className="cs-th">Parent Category</th>
                <th className="cs-th cs-hm">Slug</th>
                <th className="cs-th">Products</th>
                <th className="cs-th cs-hm">Sort Order</th>
                <th className="cs-th cs-hm">Created</th>
                <th className="cs-th">Status</th>
                <th className="cs-th cs-th--r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.length===0&&<tr><td colSpan="9" className="cs-empty">No sub-categories found.</td></tr>}
              {slice.map(s=>(
                <tr key={s.id} className={`cs-tr${checked[s.id]?' cs-tr--sel':''}`}>
                  <td className="cs-td cs-td--chk">
                    <input type="checkbox" className="cs-chk" checked={!!checked[s.id]}
                      onChange={()=>setChecked(p=>({...p,[s.id]:!p[s.id]}))}/>
                  </td>
                  <td className="cs-td">
                    <div className="cs-cat-cell">
                      <div className="cs-cat-icon cs-cat-icon--sub" style={{ background: colorFor(s.parent)+'14', border:`1px solid ${colorFor(s.parent)}22` }}>
                        <I d={IC.tag} size={14} color={colorFor(s.parent)} sw={1.8}/>
                      </div>
                      <div>
                        <div className="cs-cat-cell__n">{s.name}</div>
                        <div className="cs-cat-cell__id">{s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="cs-td">
                    <div className="cs-parent-cell">
                      <div className="cs-parent-dot" style={{ background: colorFor(s.parent) }}/>
                      <span className="cs-parent-name">{s.parent}</span>
                    </div>
                  </td>
                  <td className="cs-td cs-hm"><span className="cs-slug">{s.slug}</span></td>
                  <td className="cs-td">
                    <div className="cs-count">
                      <I d={IC.box} size={12} color="#94a3b8"/>
                      <span>{s.products}</span>
                    </div>
                  </td>
                  <td className="cs-td cs-hm">
                    <span className="cs-sort-order">#{s.sortOrder}</span>
                  </td>
                  <td className="cs-td cs-hm"><span className="cs-date">{s.createdOn}</span></td>
                  <td className="cs-td"><StatusBdg status={s.status}/></td>
                  <td className="cs-td cs-td--r">
                    <div className="cs-acts">
                      <ActBtn d={IC.eye}   cls="view"  title="View products" onClick={() => toast.info('Viewing products in ' + (s.name || s))}/>
                      <ActBtn d={IC.edit}  cls="edit"  title="Edit" onClick={()=>setModal({mode:'edit',item:s})}/>
                      <ActBtn d={IC.move}  cls="move"  title="Reorder" onClick={() => toast.info('Drag to reorder — coming soon')}/>
                      <ActBtn d={IC.trash} cls="trash" title="Delete" onClick={()=>handleDelete(s.id)}/>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={page} total={list.length} perPage={PER_PAGE}
          onPrev={()=>setPage(p=>p-1)} onNext={()=>setPage(p=>p+1)}/>
      </div>
    </div>
  );
};

/* ================================================================
   TAB 3 — CATEGORY TREE
   ================================================================ */
const TreeNode = ({ node, level = 0, expanded, onToggle }) => {
  const hasChildren = node.children && node.children.length > 0;
  const isOpen = expanded[node.id];
  const col = colorFor(node.name);

  return (
    <>
      <div
        className={`cs-tree-node cs-tree-node--l${Math.min(level, 3)}`}
        style={{ paddingLeft: 20 + level * 28 }}
      >
        {/* Connector lines */}
        {level > 0 && (
          <div className="cs-tree-line" style={{ left: 20 + (level - 1) * 28 + 10 }} />
        )}

        {/* Expand / collapse toggle */}
        <button
          className={`cs-tree-toggle ${hasChildren ? '' : 'cs-tree-toggle--leaf'}`}
          onClick={() => hasChildren && onToggle(node.id)}
        >
          {hasChildren ? (
            <I d={isOpen ? 'M6 9l6 6 6-6' : IC.chevR} size={12} color="#64748b" />
          ) : (
            <span className="cs-tree-dot" style={{ background: col }} />
          )}
        </button>

        {/* Node icon */}
        <div
          className="cs-tree-icon"
          style={{ background: col + '14', border: `1px solid ${col}22` }}
        >
          {level === 0 ? (
            <I d={IC.folder} size={13} color={col} sw={1.8} />
          ) : level === 1 ? (
            <I d={IC.tag} size={12} color={col} sw={1.8} />
          ) : (
            <I d={IC.hash} size={11} color={col} sw={1.8} />
          )}
        </div>

        {/* Node info */}
        <div className="cs-tree-info">
          <span className="cs-tree-name">{node.name}</span>
          {node.productCount > 0 && (
            <span className="cs-tree-count">
              <I d={IC.box} size={10} color="#94a3b8" />
              {node.productCount}
            </span>
          )}
          {hasChildren && (
            <span className="cs-tree-children-count">
              {node.children.length} sub
            </span>
          )}
        </div>

        {/* Status */}
        <div className="cs-tree-meta">
          <StatusBdg status={node.status || 'Active'} />
        </div>
      </div>

      {/* Recursively render children */}
      {hasChildren && isOpen && (
        <div className="cs-tree-branch">
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </>
  );
};

const CategoryTreeTab = ({ categories, subCategories = [], loading }) => {
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState('');

  const toggleNode = id => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const expandAll = () => {
    const all = {};
    treeData.forEach(cat => {
      all[cat.id] = true;
      (cat.children || []).forEach(sub => {
        if (sub.children && sub.children.length > 0) all[sub.id] = true;
      });
    });
    setExpanded(all);
  };

  const collapseAll = () => setExpanded({});

  // Build tree from categories + subCategories
  const treeData = (categories || [])
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      if (c.name.toLowerCase().includes(q)) return true;
      // Also match if any sub matches
      const subs = subCategories.filter(s => s.parent === c.name);
      return subs.some(s => s.name.toLowerCase().includes(q));
    })
    .map(cat => {
      const subs = subCategories
        .filter(s => s.parent === cat.name)
        .filter(s => {
          if (!search) return true;
          const q = search.toLowerCase();
          return s.name.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q);
        })
        .map(s => ({
          id: s.id,
          name: s.name,
          productCount: s.products,
          status: s.status,
          children: [],
        }));

      return {
        id: cat.id,
        name: cat.name,
        productCount: cat.products,
        status: cat.status,
        children: subs,
      };
    });

  // Auto-expand when searching
  useEffect(() => {
    if (search) {
      const all = {};
      treeData.forEach(cat => { all[cat.id] = true; });
      setExpanded(all);
    }
  }, [search]);

  if (loading) {
    return (
      <div className="cs-sub">
        <div className="cs-card">
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading category tree...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cs-sub">
      <div className="cs-card">
        <div className="cs-sh">
          <div>
            <p className="cs-sh__t">Category Tree</p>
            <p className="cs-sh__s">
              Visual hierarchy of {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} and their sub-categories
            </p>
          </div>
          <div className="cs-sh__r">
            <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tree..." />
            <button className="cs-btn cs-btn--out" onClick={expandAll}>
              <I d="M6 9l6 6 6-6" size={13} color="#475569" />Expand All
            </button>
            <button className="cs-btn cs-btn--out" onClick={collapseAll}>
              <I d={IC.chevR} size={13} color="#475569" />Collapse All
            </button>
          </div>
        </div>

        <div className="cs-tree">
          {treeData.length === 0 ? (
            <p className="cs-empty" style={{ padding: '32px' }}>No categories found.</p>
          ) : (
            treeData.map(cat => (
              <TreeNode
                key={cat.id}
                node={cat}
                level={0}
                expanded={expanded}
                onToggle={toggleNode}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* ================================================================
   ROOT
   ================================================================ */
const TABS = [
  { key:'cats',  label:'Categories',     icon: IC.folder },
  { key:'subs',  label:'Sub-categories', icon: IC.tag    },
  { key:'tree',  label:'Category Tree',  icon: IC.layers },
];

export default function CategoriesManager() {
  const [active, setActive] = useState('cats');
  const [categories, setCategories] = useState([]);
  const [subCats, setSubCats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catsData, subsData, products] = await Promise.all([
        getCategories(),
        getSubCategories(),
        getAllProducts().catch(() => []),
      ]);

      const mappedCats = (catsData || []).map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        products: c.products || 0,
        subCats: c.subCats || 0,
        status: c.status || 'Active',
        featured: c.featured || false,
        createdOn: c.createdAt
          ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '',
        desc: c.description || '',
        image: c.image || getCategoryImage(c.name) || '',
        _admin: true,
      }));

      // Merge product-derived categories not in admin list
      const adminNames = new Set(mappedCats.map(c => c.name.toLowerCase()));
      const productCatNames = [...new Set((products || []).map(p => p.category).filter(Boolean))];
      for (const name of productCatNames) {
        if (!adminNames.has(name.toLowerCase())) {
          mappedCats.push({
            id: null,
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            products: (products || []).filter(p => p.category?.toLowerCase() === name.toLowerCase()).length,
            subCats: 0,
            status: 'Active',
            featured: false,
            createdOn: '',
            desc: '',
            image: getCategoryImage(name) || '',
            _admin: false,
            _productDerived: true,
          });
        }
      }

      const mappedSubs = (subsData || []).map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        parent: s.parent || '',
        parentId: s.parentId,
        products: s.products || 0,
        status: s.status || 'Active',
        sortOrder: s.sortOrder || 0,
        createdOn: s.createdAt
          ? new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '',
      }));

      setCategories(mappedCats);
      setSubCats(mappedSubs);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      toast.error('Failed to load categories from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalProducts = categories.reduce((a,c)=>a+c.products,0);
  const totalSubs     = subCats.length;

  return (
    <div className="cs">
      {/* Header */}
      <div className="cs-hdr">
        <div>
          <h2 className="cs-hdr__t">Categories &amp; Sub-categories</h2>
          <p className="cs-hdr__s">Organise your product catalogue with categories and sub-categories.</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="cs-kpi-strip">
        {[
          { label:'Total Categories',    val: categories.length,         color:'#E03E1A', bg:'#fff0ed', ico: IC.folder },
          { label:'Sub-categories',      val: totalSubs,                 color:'#7c3aed', bg:'#ede9fe', ico: IC.tag    },
          { label:'Total Products',      val: totalProducts.toLocaleString(), color:'#2563eb', bg:'#dbeafe', ico: IC.box },
          { label:'Featured Categories', val: categories.filter(c=>c.featured).length, color:'#d97706', bg:'#fef3c7', ico: IC.star },
        ].map((k,i)=>(
          <div key={i} className="cs-kpi">
            <div className="cs-kpi__ico" style={{ background: k.bg }}>
              <I d={k.ico} size={16} color={k.color} sw={2.1}/>
            </div>
            <div>
              <div className="cs-kpi__val" style={{ color: k.color }}>{k.val}</div>
              <div className="cs-kpi__lbl">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="cs-tabs">
        {TABS.map(t=>(
          <button key={t.key}
            className={`cs-tab${active===t.key?' cs-tab--on':''}`}
            onClick={()=>setActive(t.key)}>
            <I d={t.icon} size={14} color={active===t.key?'#E03E1A':'#64748b'} sw={active===t.key?2.2:1.8}/>
            {t.label}
          </button>
        ))}
      </div>

      {active==='cats' && <CategoriesTab categories={categories} loading={loading} onRefresh={fetchData}/>}
      {active==='subs' && <SubCategoriesTab categories={categories} subCategories={subCats} onRefresh={fetchData}/>}
      {active==='tree' && <CategoryTreeTab categories={categories} subCategories={subCats} loading={loading}/>}
    </div>
  );
}