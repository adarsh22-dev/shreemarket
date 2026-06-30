import { useState, useEffect, useRef } from "react";
import './CmsHomepageBuilder.css';
import {
  Layout, Plus, Trash2, Edit2, Eye, EyeOff, Save, X, Copy,
  Image, ShoppingBag, Star, Percent, Grid, AlignLeft, Play,
  Layers, Monitor, Smartphone, Tablet, Check, RefreshCw,
  ImagePlus, Package, Tag, ArrowRight, AlertCircle, FolderOpen,
  MousePointer, GripVertical, ChevronUp, ChevronDown,
  Type, Link2, Zap, ExternalLink,
} from "lucide-react";
import { getAdminHomepageSections, saveAllHomepageSections, getAllProducts, getCategories, createCategory, updateCategory, deleteCategory, uploadCategoryImage, BACKEND_URL } from '../../api/api';
import toast from 'react-hot-toast';

/* ─────────────────────── SECTION TYPE REGISTRY ─────────────────────── */
const STYPES = [
  { t:"hero_banner",    l:"Hero Banner",         I:Image,       d:"Full-width hero + dynamic side banners", c:"#2563eb", bg:"#dbeafe" },
  { t:"featured_cats",  l:"Featured Categories", I:Grid,        d:"8-category icon strip",                  c:"#7c3aed", bg:"#ede9fe" },
  { t:"trust_banners",  l:"Trust Banners",       I:Check,       d:"4-item policy row",                      c:"#0891b2", bg:"#e0f2fe" },
  { t:"product_grid",   l:"Product Grid",        I:ShoppingBag, d:"Curated product cards grid",             c:"#E03E1A", bg:"#fee2e2" },
  { t:"promo_banner",   l:"Promo Banner",        I:Percent,     d:"Full-width promotional strip",           c:"#d97706", bg:"#fef3c7" },
  { t:"handcrafted",    l:"Handcrafted Section", I:Layers,      d:"Banner + category tabs",                 c:"#16a34a", bg:"#dcfce7" },
  { t:"testimonials",   l:"Testimonials",        I:Star,        d:"Customer testimonials carousel",         c:"#9333ea", bg:"#f3e8ff" },
  { t:"reviews",        l:"Reviews Carousel",    I:Star,        d:"Rotating review cards",                  c:"#9333ea", bg:"#f3e8ff" },
  { t:"values_mission", l:"Values / Mission",    I:AlignLeft,   d:"Brand story with stats",                 c:"#64748b", bg:"#f1f5f9" },
  { t:"rich_text",      l:"Rich Text Block",     I:Type,        d:"Editorial copy + image",                 c:"#475569", bg:"#f8fafc" },
  { t:"video",          l:"Video Section",       I:Play,        d:"Embedded video + headline",              c:"#dc2626", bg:"#fee2e2" },
  { t:"brands",         l:"Brand Logos",         I:Image,       d:"Scrolling brand logo strip",             c:"#0f172a", bg:"#f1f5f9" },
];

const ST  = k => STYPES.find(s => s.t === k) || STYPES[0];
const uid = () => "id" + Date.now() + Math.random().toString(36).slice(2, 6);

const newSlide = () => ({
  id: uid(), img: "", title: "New Banner",
  btn_enabled: true, btn_label: "Shop now",
  btn_link: "/shop", btn_bg: "rgba(255,255,255,0.18)", btn_text: "#ffffff",
});

/* ─────────────────────── DEFAULT CONFIGS ─────────────────────── */
const DC = {
  hero_banner: {
    bg_img: "", overlay: "0.40",
    headline: "online experiences for indian handmade goods", subheadline: "",
    btn_enabled: true, btn_label: "EXPLORE", btn_link: "/shop",
    btn_bg: "#E03E1A", btn_text: "#ffffff",
    slides: [
      { id:"sl1", img:"", title:"Timeless Traditions", btn_enabled:true, btn_label:"Shop now", btn_link:"/shop", btn_bg:"rgba(255,255,255,.18)", btn_text:"#ffffff" },
      { id:"sl2", img:"", title:"Premium Quality",     btn_enabled:true, btn_label:"Shop now", btn_link:"/shop", btn_bg:"rgba(255,255,255,.18)", btn_text:"#ffffff" },
    ],
  },
  featured_cats: {
    heading: "FEATURED CATEGORIES",
    sa_enabled: true, sa_label: "See All", sa_link: "/shop",
    sa_bg: "transparent", sa_text: "#E03E1A", cat_ids: [],
  },
  trust_banners: {
    h1:"Easy Payment Options", s1:"100% Protected",
    h2:"Easy Returns",         s2:"7 Day Return Policy",
    h3:"Verified Artisans",    s3:"Certified & Authenticated",
    h4:"Genuine Products",     s4:"Directly Sourced",
    ic1:"", ic2:"", ic3:"", ic4:"",
  },
  product_grid: {
    heading: "TRENDING PRODUCTS", source: "trending", limit: "12",
    show_price: true, show_discount: true, show_rating: true,
    show_wishlist: true, show_cart: true, img_fit: "contain",
    btn_enabled: true, btn_label: "View All", btn_link: "/shop",
    btn_bg: "#E03E1A", btn_text: "#ffffff", product_ids: [],
  },
  promo_banner: {
    promo_img: "", promo_img2: "", promo_img3: "", promo_img4: "",
    badge_text: "Handcrafted with Love",
    title: "Authentic Indian Handmade Products, Delivered to Your Door",
    description: "Supporting local artisans with quality products at retail and wholesale prices across India.",
    stat1_val: "500+", stat1_lbl: "Artisans",
    stat2_val: "50+", stat2_lbl: "Crafts",
    stat3_val: "100%", stat3_lbl: "Authentic",
    btn_enabled: true, btn_label: "Shop Now", btn_link: "/shop",
    btn_bg: "#E03E1A", btn_text: "#ffffff",
  },
   handcrafted: {
     banner_img: "", overlay: "0.45",
     overlay_text: "WOVEN IN TRADITION AND ROOTED IN TIMELESS CRAFT",
     heading: "HAND CRAFTED WITH TRADITION", badge_text: "UP TO 60% OFF",
     btn_enabled: true, btn_label: "View All", btn_link: "/shop",
     btn_bg: "#ffffff", btn_text: "#0f172a",
     c1_icon: "🏺", c1_label: "HANDMADE POTTERY",      c1_link: "/shop?cat=pottery",
     c2_icon: "🎨", c2_label: "ART & CRAFT PIECES",    c2_link: "/shop?cat=art",
     c3_icon: "🧴", c3_label: "AYURVEDIC HANDMADE SOAPS", c3_link: "/shop?cat=soaps",
     c4_icon: "🔔", c4_label: "BRASS & WOODEN CRAFTS", c4_link: "/shop?cat=brass",
   },
values_mission: {
  logo_img: "", artisan_img: "", show_logo: true,
  title: "We believe a home should\nreflect your values.",
  description: "Founded on the belief that luxury and social responsibility are not mutually exclusive, SreeMarket works directly with over 45 artisan co-ops.",
  stat1_val: "45+", stat1_lbl: "PARTNER CO-OPS",
  stat2_val: "2.4M", stat2_lbl: "DIRECT ARTISAN INCOME",
  btn_enabled: true, btn_label: "Learn More", btn_link: "/our-story",
  btn_bg: "#E03E1A", btn_text: "#ffffff",
},
  rich_text: {
    heading: "Section Heading", body: "Your editorial text here.", img: "", img_pos: "right",
    btn_enabled: true, btn_label: "Read More", btn_link: "/shop",
    btn_bg: "#E03E1A", btn_text: "#ffffff",
  },
  video: {
    heading: "Watch Our Story", video_url: "", description: "",
    btn_enabled: false, btn_label: "Watch Now", btn_link: "",
    btn_bg: "#E03E1A", btn_text: "#ffffff",
  },
  testimonials: {
    heading: "What Our Customers Say", 
    min_rating: "4", 
    auto_rotate: true, 
    limit: "4",
    show_rating: true,
    show_name: true,
    show_location: true,
    show_date: true,
    btn_enabled: true, btn_label: "Read All Reviews", btn_link: "/reviews",
    btn_bg: "#E03E1A", btn_text: "#ffffff",
  },
  reviews: { heading: "What Our Customers Say", min_rating: "4", auto_rotate: true, limit: "4" },
  brands:  { heading: "Our Partners", scroll_speed: "normal", show_heading: true },
};

/* ─────────────────────── SEED DATA ─────────────────────── */
const INIT_CATS = [
  { id:"c1", name:"Grocery & Gourmet Food",      slug:"grocery",  visible:true,  imgUrl:"" },
  { id:"c2", name:"Health & Household",           slug:"health",   visible:true,  imgUrl:"" },
  { id:"c3", name:"Home & Kitchen",               slug:"home",     visible:true,  imgUrl:"" },
  { id:"c4", name:"Beauty & Personal Care",       slug:"beauty",   visible:true,  imgUrl:"" },
  { id:"c5", name:"Clothing, Shoes & Jewellery",  slug:"clothing", visible:true,  imgUrl:"" },
  { id:"c6", name:"Toys & Games",                 slug:"toys",     visible:true,  imgUrl:"" },
  { id:"c7", name:"Patio, Lawn & Garden",         slug:"patio",    visible:false, imgUrl:"" },
  { id:"c8", name:"Musical Instruments",          slug:"musical",  visible:true,  imgUrl:"" },
];

const INIT_PRODS = [
  { id:"p1", name:"Kanjivaram Silk Saree",  vendor:"Silk Weavers",   price:2999, regular:4500, imgUrl:"", section:"top_deals",    visible:true },
  { id:"p2", name:"Walnut Edge Board",       vendor:"Wooden Crafts",  price:899,  regular:1200, imgUrl:"", section:"top_deals",    visible:true },
  { id:"p3", name:"Traditional Potli Gift",  vendor:"Gift Artisans",  price:450,  regular:600,  imgUrl:"", section:"top_deals",    visible:true },
  { id:"p4", name:"Brass Diya Set",          vendor:"Brass Works",    price:349,  regular:500,  imgUrl:"", section:"trending",     visible:true },
  { id:"p5", name:"Handmade Pottery Vase",   vendor:"Clay Studio",    price:699,  regular:999,  imgUrl:"", section:"trending",     visible:true },
  { id:"p6", name:"Ayurvedic Soap Bundle",   vendor:"Herbal Care",    price:299,  regular:399,  imgUrl:"", section:"trending",     visible:true },
  { id:"p7", name:"Madhubani Wall Art",      vendor:"Folk Art India", price:1299, regular:1800, imgUrl:"", section:"featured",     visible:true },
  { id:"p8", name:"Handwoven Jute Basket",   vendor:"Weave India",    price:549,  regular:750,  imgUrl:"", section:"featured",     visible:true },
  { id:"p9", name:"Copper Water Bottle",     vendor:"Pure Metals",    price:499,  regular:699,  imgUrl:"", section:"new_arrivals", visible:true },
];

const mkSec = (id, t, l, date, note, cfgExtra = {}) => ({
  id, t, l, vis: true, date, note,
  cfg: { ...DC[t], ...cfgExtra },
});

const INIT_SECS = [
  mkSec("s1","hero_banner",    "Main Hero Banner",           "10 Jan","Republic Day edition", { slides: [...DC.hero_banner.slides] }),
  mkSec("s2","featured_cats",  "Shop by Category",           "9 Jan", "8 category icons",     { cat_ids:["c1","c2","c3","c4","c5","c6","c7","c8"] }),
  mkSec("s3","trust_banners",  "Trust Banners Strip",        "9 Jan", "Policy highlights"),
  mkSec("s4","product_grid",   "Top Deals",                  "9 Jan", "Top 3 by discount",    { heading:"TOP DEALS", source:"top_deals", limit:"4", product_ids:["p1","p2","p3"] }),
  mkSec("s5","promo_banner",   "Authentic Products Banner",  "8 Jan", "Full-width promo"),
  mkSec("s6","product_grid",   "Trending Products",          "8 Jan", "Sorted by bookings",   { heading:"TRENDING PRODUCTS", source:"trending", limit:"12" }),
  mkSec("s7","handcrafted",    "Hand Crafted With Tradition","7 Jan", "60% OFF banner"),
  mkSec("s8","product_grid",   "Featured Products",          "7 Jan", "Next 4 by discount",   { heading:"FEATURED PRODUCTS", source:"featured", limit:"4", product_ids:["p7","p8"] }),
  mkSec("s9","values_mission", "Values / Mission Section",   "6 Jan", "Brand story"),
];

const PSECT = {
  top_deals:    ["#E03E1A","#fee2e2"],
  trending:     ["#7c3aed","#f3e8ff"],
  featured:     ["#d97706","#fef3c7"],
  new_arrivals: ["#16a34a","#dcfce7"],
  best_selling: ["#0891b2","#e0f2fe"],
  all:          ["#64748b","#f1f5f9"],
};

/* ─────────────────────── SHARED STYLES ─────────────────────── */
const css = {
  inp:  { padding:"0 11px", height:36, borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:".79rem", color:"#0f172a", background:"#fff", outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box" },
  txta: { padding:"8px 11px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:".79rem", color:"#0f172a", background:"#fff", outline:"none", fontFamily:"inherit", width:"100%", resize:"vertical", minHeight:64 },
  sel:  { padding:"0 11px", height:36, borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:".79rem", color:"#0f172a", background:"#fff", outline:"none", fontFamily:"inherit", width:"100%", cursor:"pointer" },
  lbl:  { fontSize:".69rem", fontWeight:700, color:"#475569" },
  fld:  { display:"flex", flexDirection:"column", gap:4 },
  row:  { display:"flex", gap:10, flexWrap:"wrap" },
};

/* ─────────────────────── MICRO COMPONENTS ─────────────────────── */

function Tog({ val, onChange }) {
  const on = val === true || val === "true";
  return (
    <button type="button"
      onClick={e => { e.preventDefault(); e.stopPropagation(); onChange(!on); }}
      style={{ flexShrink:0, border:"none", cursor:"pointer", position:"relative",
        borderRadius:11, padding:0, width:38, height:21,
        background: on ? "#16a34a" : "#d1d5db", transition:"background .16s" }}>
      <span style={{ position:"absolute", top:2, width:17, height:17, borderRadius:9,
        background:"#fff", boxShadow:"0 1px 3px rgba(0,0,0,.18)",
        transition:"left .15s", left: on ? 19 : 2 }} />
    </button>
  );
}

function TRow({ label, hint, val, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"9px 11px", background:"#f8fafc", borderRadius:8, border:"1.5px solid #f1f5f9" }}>
      <div>
        <div style={css.lbl}>{label}</div>
        {hint && <div style={{ fontSize:".64rem", color:"#94a3b8", marginTop:1 }}>{hint}</div>}
      </div>
      <Tog val={val} onChange={onChange} />
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={css.fld}>
      {label && <label style={css.lbl}>{label}</label>}
      <input type={type} style={css.inp} value={value || ""} placeholder={placeholder || ""}
        onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function ColorF({ label, val, onChange }) {
  return (
    <div style={css.fld}>
      <label style={css.lbl}>{label}</label>
      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
        <input type="color" style={{ width:36, height:36, borderRadius:7, border:"1.5px solid #e2e8f0", cursor:"pointer", padding:3, flexShrink:0 }}
          value={val && val.startsWith("#") ? val : "#ffffff"}
          onChange={e => onChange(e.target.value)} />
        <input style={css.inp} value={val || ""} onChange={e => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function Stepper({ label, val, onChange, min = 1, max = 99, step = 1 }) {
  const v = parseInt(val) || min;
  const btnS = { width:34, border:"none", background:"#f8fafc", cursor:"pointer", fontWeight:800, color:"#475569", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem" };
  return (
    <div style={css.fld}>
      <span style={css.lbl}>{label}</span>
      <div style={{ display:"flex", alignItems:"stretch", border:"1.5px solid #e2e8f0", borderRadius:8, overflow:"hidden", height:36 }}>
        <button type="button" style={{ ...btnS, borderRight:"1px solid #e2e8f0" }} onClick={() => onChange(String(Math.max(min, v - step)))}>−</button>
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", fontSize:".84rem", fontWeight:800, color:"#0f172a" }}>{v}</div>
        <button type="button" style={{ ...btnS, borderLeft:"1px solid #e2e8f0", color:"#E03E1A" }} onClick={() => onChange(String(Math.min(max, v + step)))}>+</button>
      </div>
    </div>
  );
}

function Slider({ label, val, onChange, min = 0, max = 1, step = 0.05 }) {
  const v   = Math.min(max, Math.max(min, parseFloat(val) || 0));
  const pct = Math.round((v - min) / (max - min) * 100);
  const adj = d => onChange(String(+(Math.min(max, Math.max(min, v + d * step)).toFixed(2))));
  return (
    <div style={css.fld}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={css.lbl}>{label}</span>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          {[-1, 1].map(d => (
            <button key={d} type="button" onClick={() => adj(d)}
              style={{ width:21, height:21, border:"1.5px solid #e2e8f0", borderRadius:5, background:"#f8fafc", cursor:"pointer", fontWeight:700, color:"#475569", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".9rem" }}>
              {d < 0 ? "−" : "+"}
            </button>
          ))}
          <span style={{ fontSize:".74rem", fontWeight:800, color:"#0f172a", minWidth:34, textAlign:"center", background:"#f1f5f9", borderRadius:5, padding:"2px 5px" }}>
            {Math.round(v * 100)}%
          </span>
        </div>
      </div>
      <div style={{ position:"relative", height:18, display:"flex", alignItems:"center" }}>
        <div style={{ position:"absolute", inset:0, height:5, borderRadius:3, background:"#e2e8f0", overflow:"hidden", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
          <div style={{ width:pct + "%", height:"100%", background:"linear-gradient(90deg,#E03E1A,#f97316)", borderRadius:3 }} />
        </div>
        <div style={{ position:"absolute", left:`calc(${pct}% - 8px)`, width:16, height:16, borderRadius:"50%", background:"#E03E1A", border:"2.5px solid #fff", boxShadow:"0 1px 4px rgba(224,62,26,.4)", pointerEvents:"none", zIndex:2 }} />
        <input type="range" min={min} max={max} step={step} value={v}
          onChange={e => onChange(e.target.value)}
          style={{ position:"absolute", inset:0, width:"100%", opacity:0, cursor:"pointer", zIndex:3 }} />
      </div>
    </div>
  );
}

function ImgUp({ val, onChange, label, hint, h = 110 }) {
  const fid = useRef("fu_" + Math.random().toString(36).slice(2, 8)).current;
  const onFile = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => onChange(ev.target.result);
    r.readAsDataURL(f);
    e.target.value = "";
  };
  return (
    <div>
      {label && <div style={{ ...css.lbl, marginBottom:4 }}>{label}</div>}
      {hint  && <div style={{ fontSize:".64rem", color:"#94a3b8", marginBottom:5, lineHeight:1.4 }}>{hint}</div>}
      <input id={fid} type="file" accept="image/*"
        style={{ position:"fixed", top:-9999, left:-9999, opacity:0, width:1, height:1, pointerEvents:"none" }}
        onChange={onFile} />
      {val ? (
        <div>
          <div style={{ position:"relative", borderRadius:9, overflow:"hidden", border:"2.5px solid #22c55e" }}>
            <img src={val} alt="" style={{ display:"block", width:"100%", height:h, objectFit:"cover" }} />
            <span style={{ position:"absolute", top:6, left:6, fontSize:".6rem", fontWeight:700, background:"#16a34a", color:"#fff", padding:"2px 7px", borderRadius:4, display:"flex", alignItems:"center", gap:3 }}>
              <Check size={8} /> Uploaded
            </span>
          </div>
          <div style={{ display:"flex", gap:7, marginTop:6 }}>
            <label htmlFor={fid} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, height:34, borderRadius:7, border:"1.5px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", fontSize:".73rem", fontWeight:700, color:"#475569" }}>
              <RefreshCw size={11} /> Replace
            </label>
            <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); onChange(""); }}
              style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, height:34, borderRadius:7, border:"1.5px solid #fecaca", background:"#fff5f5", cursor:"pointer", fontSize:".73rem", fontWeight:700, color:"#dc2626", fontFamily:"inherit" }}>
              <X size={11} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <label htmlFor={fid} style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, padding:"16px", border:"2px dashed #cbd5e1", borderRadius:9, background:"#f8fafc", cursor:"pointer", marginBottom:6, width:"100%", boxSizing:"border-box" }}>
          <div style={{ width:40, height:40, borderRadius:10, background:"#e2e8f0", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ImagePlus size={18} color="#94a3b8" />
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:".78rem", fontWeight:700, color:"#334155" }}>Click to Upload Image</div>
            <div style={{ fontSize:".65rem", color:"#94a3b8", marginTop:2 }}>PNG · JPG · WebP · GIF</div>
          </div>
          <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#E03E1A", color:"#fff", borderRadius:7, padding:"5px 14px", fontSize:".73rem", fontWeight:700 }}>
            <ImagePlus size={11} /> Choose File
          </span>
        </label>
      )}
      <input style={css.inp} value={val || ""} placeholder="or paste image URL (https://…)"
        onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function BtnEd({ title, pfx, cfg, set, showEnable }) {
  const on = !showEnable || cfg[`${pfx}_enabled`] !== false;
  const bg = cfg[`${pfx}_bg`]    || "#E03E1A";
  const tx = cfg[`${pfx}_text`]  || "#ffffff";
  const lb = cfg[`${pfx}_label`] || "Button";
  const lk = cfg[`${pfx}_link`]  || "";
  return (
    <div style={{ background:"#f8fafc", border:"1.5px solid #e8ecf0", borderRadius:10, padding:"11px 12px", display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:".68rem", fontWeight:800, color:"#475569", textTransform:"uppercase", letterSpacing:".4px", display:"flex", alignItems:"center", gap:5 }}>
          <MousePointer size={10} /> {title || "Button"}
        </span>
        {showEnable && (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:".67rem", fontWeight:700, color: on ? "#16a34a" : "#94a3b8" }}>{on ? "Enabled" : "Disabled"}</span>
            <Tog val={on} onChange={v => set(`${pfx}_enabled`, v)} />
          </div>
        )}
      </div>
      {on && (
        <>
          <div style={{ display:"flex", gap:9, flexWrap:"wrap" }}>
            <Field label="Label"    value={lb} onChange={v => set(`${pfx}_label`, v)} placeholder="Shop Now" />
            <Field label="Link URL" value={lk} onChange={v => set(`${pfx}_link`,  v)} placeholder="/shop" />
          </div>
          <div style={{ display:"flex", gap:9, flexWrap:"wrap" }}>
            <ColorF label="Background" val={bg} onChange={v => set(`${pfx}_bg`,   v)} />
            <ColorF label="Text Color" val={tx} onChange={v => set(`${pfx}_text`, v)} />
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", background:"#fff", borderRadius:7, border:"1px solid #f1f5f9", flexWrap:"wrap" }}>
            <span style={{ fontSize:".62rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase" }}>Preview</span>
            <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:bg, color:tx, borderRadius:6, padding:"5px 12px", fontSize:".73rem", fontWeight:700, boxShadow:"0 2px 6px rgba(0,0,0,.08)" }}>
              <Link2 size={9} /> {lb}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────── HERO SLIDES EDITOR ─────────────────────── */
function HeroSlidesEditor({ slides, onChange }) {
  const [openId, setOpenId] = useState(slides[0]?.id || null);

  const upd = (id, k, v) => onChange(slides.map(s => s.id === id ? { ...s, [k]: v } : s));
  const add = () => { const s = newSlide(); onChange([...slides, s]); setOpenId(s.id); };
  const rem = id => { const n = slides.filter(s => s.id !== id); onChange(n); if (openId === id) setOpenId(n[0]?.id || null); };
  const mov = (i, d) => {
    const a = [...slides]; const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; onChange(a);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:".77rem", fontWeight:800, color:"#0f172a" }}>Side Banner Slides</div>
          <div style={{ fontSize:".65rem", color:"#94a3b8", marginTop:1 }}>{slides.length} slide{slides.length !== 1 ? "s" : ""} — shown alongside the main hero</div>
        </div>
        <button type="button" onClick={add}
          style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:"1.5px solid #E03E1A", background:"#fff8f6", color:"#E03E1A", fontSize:".72rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          <Plus size={11} /> Add Slide
        </button>
      </div>

      {slides.length === 0 && (
        <div style={{ padding:"24px", textAlign:"center", background:"#f8fafc", borderRadius:10, border:"2px dashed #e2e8f0" }}>
          <span style={{ fontSize:".75rem", color:"#94a3b8", fontWeight:600 }}>No side slides — add one above</span>
        </div>
      )}

      {slides.map((sl, idx) => {
        const open = openId === sl.id;
        return (
          <div key={sl.id}
            style={{ border:`2px solid ${sl.img ? "#22c55e" : open ? "#E03E1A" : "#e2e8f0"}`, borderRadius:11, background:"#fff", overflow:"hidden", transition:"border-color .15s" }}>
            <div onClick={() => setOpenId(open ? null : sl.id)}
              style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 11px", background: open ? "#fff8f6" : "#f8fafc", cursor:"pointer", userSelect:"none", borderBottom: open ? "1.5px solid #f1f5f9" : "none" }}>
              <div style={{ width:42, height:34, borderRadius:6, overflow:"hidden", border:"1.5px solid #e2e8f0", flexShrink:0 }}>
                {sl.img
                  ? <img src={sl.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <div style={{ width:"100%", height:"100%", background:"#e2e8f0", display:"flex", alignItems:"center", justifyContent:"center" }}><ImagePlus size={11} color="#94a3b8" /></div>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:".77rem", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {sl.title || `Slide ${idx + 1}`}
                </div>
                <div style={{ fontSize:".64rem", color:"#94a3b8", marginTop:1, display:"flex", alignItems:"center", gap:5 }}>
                  Slide {idx + 1}
                  {sl.img
                    ? <span style={{ color:"#16a34a", fontWeight:700, display:"flex", alignItems:"center", gap:2 }}><Check size={8} /> Image set</span>
                    : <span style={{ color:"#f59e0b", fontWeight:600 }}>No image</span>
                  }
                </div>
              </div>
              <div style={{ display:"flex", gap:3, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                {[[-1, <ChevronUp size={10} />, idx === 0], [1, <ChevronDown size={10} />, idx === slides.length - 1]].map(([d, icon, dis]) => (
                  <button key={String(d)} type="button" disabled={dis} onClick={() => mov(idx, d)}
                    style={{ width:24, height:24, border:"1.5px solid #e2e8f0", borderRadius:6, background:"#fff", cursor: dis ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity: dis ? 0.3 : 1, color:"#64748b" }}>
                    {icon}
                  </button>
                ))}
                {slides.length > 1 && (
                  <button type="button" onClick={() => rem(sl.id)}
                    style={{ width:24, height:24, border:"1.5px solid #fecaca", borderRadius:6, background:"#fff5f5", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#dc2626" }}>
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
              <span style={{ color: open ? "#E03E1A" : "#94a3b8", flexShrink:0, transition:"transform .15s", transform: open ? "rotate(90deg)" : "none" }}>
                <ArrowRight size={12} />
              </span>
            </div>

            {open && (
              <div style={{ padding:13, display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ borderRadius:8, overflow:"hidden", border:"1.5px solid #e2e8f0", position:"relative", height:96 }}>
                  {sl.img ? <img src={sl.img} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} /> : <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,#334155,#1e293b)" }} />}
                  <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.4)" }} />
                  <div style={{ position:"absolute", bottom:8, left:10, color:"#fff", fontSize:".73rem", fontWeight:800, textShadow:"0 1px 5px rgba(0,0,0,.7)" }}>{sl.title}</div>
                </div>
                <ImgUp val={sl.img} onChange={v => upd(sl.id, "img", v)} label="Banner Image" hint="Recommended: 600x420px" h={88} />
                <Field label="Title" value={sl.title} onChange={v => upd(sl.id, "title", v)} placeholder="e.g. Timeless Traditions" />
                <div style={{ borderTop:"1.5px solid #f1f5f9", paddingTop:11 }}>
                  <BtnEd title="Slide Button" pfx="btn" showEnable
                    cfg={{ btn_enabled:sl.btn_enabled, btn_label:sl.btn_label, btn_link:sl.btn_link, btn_bg:sl.btn_bg, btn_text:sl.btn_text }}
                    set={(k, v) => upd(sl.id, k, v)} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────── EDIT MODAL ─────────────────────── */
function EditModal({ sec, products, categories, onSave, onClose }) {
  const [f,  sf]  = useState({ ...sec, cfg: { ...sec.cfg, slides: (sec.cfg.slides || []).map(s => ({ ...s })) } });
  const set    = (k, v) => sf(p => ({ ...p, [k]: v }));
  const setCfg = (k, v) => sf(p => ({ ...p, cfg: { ...p.cfg, [k]: v } }));
  const meta = ST(f.t); const MI = meta.I; const cfg = f.cfg;

   const TABS = [
     ["hero_banner","promo_banner","handcrafted","values_mission","rich_text"].includes(f.t) && { k:"images",   l:"Images",      I:ImagePlus },
     f.t === "hero_banner"   && { k:"slides",   l:"Slides",      I:Layers },
     { k:"content",  l:"Text",        I:Type },
     ["hero_banner","featured_cats","product_grid","promo_banner","handcrafted","rich_text","video","testimonials"].includes(f.t) && { k:"buttons", l:"Buttons", I:MousePointer },
     f.t === "featured_cats" && { k:"categories", l:"Categories",  I:Grid },
     f.t === "product_grid"  && { k:"products", l:"Products",    I:ShoppingBag },
     { k:"general",  l:"General",     I:Layout },
   ].filter(Boolean);

  const [tab, setTab] = useState(TABS[0].k);

  const togglePid = id => {
    const ids = cfg.product_ids || [];
    setCfg("product_ids", ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
    if (f.cfg.source && f.cfg.source !== "custom") setCfg("source", "custom");
  };

  const InfoBar = ({ text, variant = "blue" }) => {
    const map = { blue:["#eff6ff","#bfdbfe","#1d4ed8"], purple:["#f5f3ff","#ddd6fe","#6d28d9"], green:["#f0fdf4","#bbf7d0","#15803d"] };
    const [bg, bd, c] = map[variant] || map.blue;
    return (
      <div style={{ display:"flex", alignItems:"flex-start", gap:8, borderRadius:9, padding:"9px 11px", fontSize:".73rem", lineHeight:1.5, background:bg, border:`1.5px solid ${bd}`, color:c }}>
        <AlertCircle size={12} style={{ flexShrink:0, marginTop:1 }} />
        <div dangerouslySetInnerHTML={{ __html: text }} />
      </div>
    );
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:14, backdropFilter:"blur(2px)" }}
      onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:720, maxHeight:"91vh", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 28px 70px rgba(0,0,0,.24)" }}
        onClick={e => e.stopPropagation()}>

        {/* header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px 12px", borderBottom:"1.5px solid #f1f5f9", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:meta.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <MI size={14} color={meta.c} />
            </div>
            <div>
              <h3 style={{ fontSize:".88rem", fontWeight:800 }}>{f.l}</h3>
              <p style={{ fontSize:".67rem", color:"#94a3b8", marginTop:1 }}>{meta.l} — edit section</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            style={{ width:26, height:26, borderRadius:6, border:"1.5px solid #e2e8f0", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#64748b" }}>
            <X size={13} />
          </button>
        </div>

        {/* tabs */}
        <div style={{ display:"flex", borderBottom:"1.5px solid #f1f5f9", padding:"0 20px", background:"#fafbfc", overflowX:"auto", flexShrink:0 }}>
          {TABS.map(({ k, l, I }) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"9px 12px", border:"none", borderBottom:`2px solid ${tab === k ? "#E03E1A" : "transparent"}`, background:"transparent", fontSize:".72rem", fontWeight:700, color: tab === k ? "#E03E1A" : "#94a3b8", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", marginBottom:-1.5, flexShrink:0 }}>
              <I size={10} /> {l}
            </button>
          ))}
        </div>

        {/* body */}
        <div style={{ overflowY:"auto", overflowX:"hidden", padding:"15px 20px", display:"flex", flexDirection:"column", gap:13, flex:1 }}>

          {tab === "images" && (
            <>
              <InfoBar text="Upload images or paste URLs. The preview updates as you type." />
              {f.t === "hero_banner" && (
                <div style={{ border:`2px solid ${cfg.bg_img ? "#22c55e" : "#e2e8f0"}`, borderRadius:12, overflow:"hidden" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 13px", background: cfg.bg_img ? "#f0fdf4" : "#f8fafc", borderBottom:"1.5px solid #f1f5f9" }}>
                    <span style={{ fontSize:".69rem", fontWeight:800, color: cfg.bg_img ? "#15803d" : "#475569", display:"flex", alignItems:"center", gap:5 }}><ImagePlus size={11} /> Main Hero Background</span>
                    <span style={{ fontSize:".65rem", fontWeight:700, padding:"2px 7px", borderRadius:4, background: cfg.bg_img ? "#dcfce7" : "#f1f5f9", color: cfg.bg_img ? "#16a34a" : "#94a3b8", display:"flex", alignItems:"center", gap:3 }}>
                      {cfg.bg_img ? <><Check size={8} /> Set</> : "None"}
                    </span>
                  </div>
                  <div style={{ padding:13, display:"flex", flexDirection:"column", gap:11 }}>
                    <div style={{ borderRadius:9, overflow:"hidden", border:"1.5px solid #e2e8f0", position:"relative", height:130 }}>
                      {cfg.bg_img ? <img src={cfg.bg_img} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} /> : <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,#334155,#1e293b)" }} />}
                      <div style={{ position:"absolute", inset:0, background:`rgba(0,0,0,${parseFloat(cfg.overlay || "0.4")})` }} />
                      <div style={{ position:"absolute", bottom:10, left:12 }}>
                        {cfg.headline && <div style={{ color:"#fff", fontSize:".83rem", fontWeight:800, textShadow:"0 1px 5px rgba(0,0,0,.7)" }}>{cfg.headline}</div>}
                      </div>
                      <span style={{ position:"absolute", top:6, right:6, fontSize:".58rem", fontWeight:700, background:"rgba(0,0,0,.4)", color:"#fff", padding:"2px 6px", borderRadius:4 }}>PREVIEW</span>
                    </div>
                    <ImgUp val={cfg.bg_img || ""} onChange={v => setCfg("bg_img", v)} label="Background Image" hint="Recommended: 1440x680px" />
                    <Slider label="Overlay Intensity" val={cfg.overlay || "0.4"} onChange={v => setCfg("overlay", v)} min={0} max={0.85} step={0.05} />
                  </div>
                </div>
              )}
              {f.t === "promo_banner" && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <ImgUp val={cfg.promo_img} onChange={v => setCfg("promo_img", v)} label="Image 1 (Main)" hint="600x500px" />
                  <ImgUp val={cfg.promo_img2} onChange={v => setCfg("promo_img2", v)} label="Image 2" hint="600x500px" />
                  <ImgUp val={cfg.promo_img3} onChange={v => setCfg("promo_img3", v)} label="Image 3" hint="600x500px" />
                  <ImgUp val={cfg.promo_img4} onChange={v => setCfg("promo_img4", v)} label="Image 4" hint="600x500px" />
                </div>
              )}
              {f.t === "handcrafted" && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <ImgUp val={cfg.banner_img} onChange={v => setCfg("banner_img", v)} label="Banner 1 (Main)" hint="900x420px" />
                  <ImgUp val={cfg.banner_img2} onChange={v => setCfg("banner_img2", v)} label="Banner 2" hint="900x420px" />
                  <ImgUp val={cfg.banner_img3} onChange={v => setCfg("banner_img3", v)} label="Banner 3" hint="900x420px" />
                </div>
              )}
              {f.t === "values_mission" && <>
                <ImgUp val={cfg.logo_img || ""} onChange={v => setCfg("logo_img", v)} label="Brand Logo" hint="Optional brand logo above title" h={60} />
                <ImgUp val={cfg.artisan_img} onChange={v => setCfg("artisan_img", v)} label="Artisan Photo" hint="600x500px" />
              </>}
              {f.t === "rich_text"      && <ImgUp val={cfg.img}         onChange={v => setCfg("img",         v)} label="Section Image"     hint="Optional alongside text" />}
            </>
          )}

          {tab === "slides" && (
            <>
              <InfoBar text="Add, remove and reorder side banner slides. Each slide has its own image, title and CTA button." />
              <HeroSlidesEditor slides={cfg.slides || []} onChange={v => setCfg("slides", v)} />
            </>
          )}

          {tab === "content" && (
            <>
              {f.t === "hero_banner" && (
                <>
                  <div style={css.fld}><label style={css.lbl}>Main Headline</label><textarea style={css.txta} rows={2} value={cfg.headline || ""} onChange={e => setCfg("headline", e.target.value)} /></div>
                  <Field label="Sub-headline (optional)" value={cfg.subheadline} onChange={v => setCfg("subheadline", v)} placeholder="Supporting line" />
                  <Slider label="Overlay" val={cfg.overlay || "0.4"} onChange={v => setCfg("overlay", v)} min={0} max={0.85} step={0.05} />
                </>
              )}
              {f.t === "featured_cats" && <Field label="Section Heading" value={cfg.heading} onChange={v => setCfg("heading", v)} />}
              {f.t === "trust_banners" && (
                <>
                  <InfoBar text="Edit the 4 trust-bar items. Upload custom icon or leave blank for default SVG." />
                  {[1,2,3,4].map(n => (
                    <div key={n} style={{ background:"#f8fafc", borderRadius:8, border:"1px solid #f1f5f9", padding:"9px 11px", display:"flex", flexDirection:"column", gap:7 }}>
                      <span style={{ fontSize:".67rem", fontWeight:800, color:"#64748b", textTransform:"uppercase" }}>Item {n}</span>
                      <div style={css.row}>
                        <Field label="Heading" value={cfg[`h${n}`]} onChange={v => setCfg(`h${n}`, v)} />
                        <Field label="Sub-text" value={cfg[`s${n}`]} onChange={v => setCfg(`s${n}`, v)} />
                      </div>
                      <ImgUp val={cfg[`ic${n}`] || ""} onChange={v => setCfg(`ic${n}`, v)} label="Custom Icon (optional)" hint="48x48px SVG or PNG" h={48} />
                    </div>
                  ))}
                </>
              )}
              {f.t === "product_grid" && (
                <>
                  <Field label="Section Heading" value={cfg.heading} onChange={v => setCfg("heading", v)} />
                  <div style={css.row}>
                    <div style={css.fld}><label style={css.lbl}>Source</label><select style={css.sel} value={cfg.source || "custom"} onChange={e => setCfg("source", e.target.value)}>{["custom","top_deals","trending","featured","new_arrivals","all"].map(v => <option key={v}>{v}</option>)}</select></div>
                    <Stepper label="Limit" val={cfg.limit || "12"} onChange={v => setCfg("limit", v)} min={2} max={24} step={2} />
                    <div style={css.fld}><label style={css.lbl}>Image Fit</label><select style={css.sel} value={cfg.img_fit || "contain"} onChange={e => setCfg("img_fit", e.target.value)}>{["contain","cover","fill"].map(v => <option key={v}>{v}</option>)}</select></div>
                  </div>
                  {[["show_price","Show Price"],["show_discount","Show Discount"],["show_rating","Show Rating"],["show_wishlist","Wishlist Button"],["show_cart","Add to Cart"]].map(([k, l]) => (
                    <TRow key={k} label={l} val={cfg[k]} onChange={v => setCfg(k, v)} />
                  ))}
                </>
              )}
              {f.t === "promo_banner" && (
                <>
                  <div style={css.fld}><label style={css.lbl}>Badge Text</label><input style={css.inp} value={cfg.badge_text || ""} onChange={e => setCfg("badge_text", e.target.value)} placeholder="Handcrafted with Love" /></div>
                  <div style={css.fld}><label style={css.lbl}>Title</label><textarea style={css.txta} rows={2} value={cfg.title || ""} onChange={e => setCfg("title", e.target.value)} /></div>
                  <div style={css.fld}><label style={css.lbl}>Description</label><textarea style={{ ...css.txta, minHeight:72 }} rows={3} value={cfg.description || ""} onChange={e => setCfg("description", e.target.value)} /></div>
                  <div style={css.row}>
                    <Field label="Stat 1 Value" value={cfg.stat1_val} onChange={v => setCfg("stat1_val", v)} placeholder="500+" />
                    <Field label="Stat 1 Label" value={cfg.stat1_lbl} onChange={v => setCfg("stat1_lbl", v)} placeholder="Artisans" />
                  </div>
                  <div style={css.row}>
                    <Field label="Stat 2 Value" value={cfg.stat2_val} onChange={v => setCfg("stat2_val", v)} placeholder="50+" />
                    <Field label="Stat 2 Label" value={cfg.stat2_lbl} onChange={v => setCfg("stat2_lbl", v)} placeholder="Crafts" />
                  </div>
                  <div style={css.row}>
                    <Field label="Stat 3 Value" value={cfg.stat3_val} onChange={v => setCfg("stat3_val", v)} placeholder="100%" />
                    <Field label="Stat 3 Label" value={cfg.stat3_lbl} onChange={v => setCfg("stat3_lbl", v)} placeholder="Authentic" />
                  </div>
                </>
              )}
              {f.t === "handcrafted" && (
                <>
                  <div style={css.row}>
                    <Field label="Section Heading" value={cfg.heading} onChange={v => setCfg("heading", v)} />
                    <Field label="Badge Text" value={cfg.badge_text} onChange={v => setCfg("badge_text", v)} placeholder="UP TO 60% OFF" />
                  </div>
                  <div style={css.fld}><label style={css.lbl}>Overlay Text</label><textarea style={css.txta} rows={2} value={cfg.overlay_text || ""} onChange={e => setCfg("overlay_text", e.target.value)} /></div>
                  <div style={{ fontSize:".67rem", fontWeight:800, color:"#64748b", textTransform:"uppercase", letterSpacing:".4px", borderBottom:"1px solid #e2e8f0", paddingBottom:5 }}>Category Tabs</div>
                  {[1,2,3,4].map(n => (
                    <div key={n} style={{ display:"flex", gap:9, flexWrap:"wrap" }}>
                      <div style={{ flex:"0 0 66px" }}><Field label={`Icon ${n}`} value={cfg[`c${n}_icon`]} onChange={v => setCfg(`c${n}_icon`, v)} /></div>
                      <Field label={`Label ${n}`} value={cfg[`c${n}_label`]} onChange={v => setCfg(`c${n}_label`, v)} />
                      <Field label={`Link ${n}`}  value={cfg[`c${n}_link`]}  onChange={v => setCfg(`c${n}_link`,  v)} placeholder="/shop?cat=…" />
                    </div>
                  ))}
                </>
              )}
{f.t === "values_mission" && (
  <>
    <div style={css.fld}><label style={css.lbl}>Title</label><textarea style={css.txta} rows={2} value={cfg.title || ""} onChange={e => setCfg("title", e.target.value)} /></div>
    <div style={css.fld}><label style={css.lbl}>Description</label><textarea style={{ ...css.txta, minHeight:72 }} rows={3} value={cfg.description || ""} onChange={e => setCfg("description", e.target.value)} /></div>
    <div style={css.row}>
      <Field label="Stat 1 Value" value={cfg.stat1_val} onChange={v => setCfg("stat1_val", v)} />
      <Field label="Stat 1 Label" value={cfg.stat1_lbl} onChange={v => setCfg("stat1_lbl", v)} />
    </div>
    <div style={css.row}>
      <Field label="Stat 2 Value" value={cfg.stat2_val} onChange={v => setCfg("stat2_val", v)} />
      <Field label="Stat 2 Label" value={cfg.stat2_lbl} onChange={v => setCfg("stat2_lbl", v)} />
    </div>
    <TRow label="Show Logo Above Title" val={cfg.show_logo} onChange={v => setCfg("show_logo", v)} />
    <div style={{ borderTop:"1.5px solid #f1f5f9", paddingTop:11 }}>
      <BtnEd title="Section CTA"   pfx="btn" cfg={cfg} set={setCfg} showEnable />
    </div>
  </>
)}
              {f.t === "rich_text" && (
                <>
                  <Field label="Heading" value={cfg.heading} onChange={v => setCfg("heading", v)} />
                  <div style={css.fld}><label style={css.lbl}>Body Copy</label><textarea style={{ ...css.txta, minHeight:80 }} rows={4} value={cfg.body || ""} onChange={e => setCfg("body", e.target.value)} /></div>
                  <div style={css.fld}><label style={css.lbl}>Image Position</label><select style={css.sel} value={cfg.img_pos || "right"} onChange={e => setCfg("img_pos", e.target.value)}>{["left","right","none"].map(v => <option key={v}>{v}</option>)}</select></div>
                </>
              )}
               {f.t === "video" && (
                 <>
                   <Field label="Heading" value={cfg.heading} onChange={v => setCfg("heading", v)} />
                   <Field label="Video Embed URL" value={cfg.video_url} onChange={v => setCfg("video_url", v)} placeholder="https://youtube.com/embed/…" />
                   <div style={css.fld}><label style={css.lbl}>Description</label><textarea style={{ ...css.txta, minHeight:68 }} rows={3} value={cfg.description || ""} onChange={e => setCfg("description", e.target.value)} /></div>
                 </>
               )}
               {f.t === "testimonials" && (
                 <>
                   <Field label="Heading" value={cfg.heading} onChange={v => setCfg("heading", v)} />
                   <div style={css.row}>
                     <div style={css.fld}><label style={css.lbl}>Min Rating</label><select style={css.sel} value={cfg.min_rating || "4"} onChange={e => setCfg("min_rating", e.target.value)}>{["3","4","5"].map(v => <option key={v}>{v}</option>)}</select></div>
                     <div style={css.fld}><label style={css.lbl}>Max Shown</label><select style={css.sel} value={cfg.limit || "4"} onChange={e => setCfg("limit", e.target.value)}>{["3","4","6","8"].map(v => <option key={v}>{v}</option>)}</select></div>
                   </div>
                   <div style={css.row}>
                     <TRow label="Show Rating" val={cfg.show_rating} onChange={v => setCfg("show_rating", v)} />
                     <TRow label="Show Name" val={cfg.show_name} onChange={v => setCfg("show_name", v)} />
                     <TRow label="Show Location" val={cfg.show_location} onChange={v => setCfg("show_location", v)} />
                     <TRow label="Show Date" val={cfg.show_date} onChange={v => setCfg("show_date", v)} />
                   </div>
                   <div style={{ borderTop:"1.5px solid #f1f5f9", paddingTop:11 }}>
                     <BtnEd title="Read All Reviews"   pfx="btn" cfg={cfg} set={setCfg} showEnable />
                   </div>
                   <TRow label="Auto-rotate" val={cfg.auto_rotate} onChange={v => setCfg("auto_rotate", v)} />
                 </>
               )}
               {f.t === "reviews" && (
                 <>
                   <Field label="Heading" value={cfg.heading} onChange={v => setCfg("heading", v)} />
                   <div style={css.row}>
                     <div style={css.fld}><label style={css.lbl}>Min Rating</label><select style={css.sel} value={cfg.min_rating || "4"} onChange={e => setCfg("min_rating", e.target.value)}>{["3","4","5"].map(v => <option key={v}>{v}</option>)}</select></div>
                     <div style={css.fld}><label style={css.lbl}>Max Shown</label><select style={css.sel} value={cfg.limit || "4"} onChange={e => setCfg("limit", e.target.value)}>{["3","4","6","8"].map(v => <option key={v}>{v}</option>)}</select></div>
                   </div>
                   <TRow label="Auto-rotate" val={cfg.auto_rotate} onChange={v => setCfg("auto_rotate", v)} />
                 </>
               )}
  {f.t === "testimonials" && (
    <>
      <Field label="Heading" value={cfg.heading} onChange={v => setCfg("heading", v)} />
      <div style={css.row}>
        <div style={css.fld}><label style={css.lbl}>Min Rating</label><select style={css.sel} value={cfg.min_rating || "4"} onChange={e => setCfg("min_rating", e.target.value)}>{["3","4","5"].map(v => <option key={v}>{v}</option>)}</select></div>
        <div style={css.fld}><label style={css.lbl}>Max Shown</label><select style={css.sel} value={cfg.limit || "4"} onChange={e => setCfg("limit", e.target.value)}>{["3","4","6","8"].map(v => <option key={v}>{v}</option>)}</select></div>
      </div>
      <div style={css.row}>
        <TRow label="Show Rating" val={cfg.show_rating} onChange={v => setCfg("show_rating", v)} />
        <TRow label="Show Name" val={cfg.show_name} onChange={v => setCfg("show_name", v)} />
        <TRow label="Show Location" val={cfg.show_location} onChange={v => setCfg("show_location", v)} />
        <TRow label="Show Date" val={cfg.show_date} onChange={v => setCfg("show_date", v)} />
      </div>
      <TRow label="Auto-rotate" val={cfg.auto_rotate} onChange={v => setCfg("auto_rotate", v)} />
    </>
  )}
  {f.t === "reviews" && (
    <>
      <Field label="Heading" value={cfg.heading} onChange={v => setCfg("heading", v)} />
      <div style={css.row}>
        <div style={css.fld}><label style={css.lbl}>Min Rating</label><select style={css.sel} value={cfg.min_rating || "4"} onChange={e => setCfg("min_rating", e.target.value)}>{["3","4","5"].map(v => <option key={v}>{v}</option>)}</select></div>
        <div style={css.fld}><label style={css.lbl}>Max Shown</label><select style={css.sel} value={cfg.limit || "4"} onChange={e => setCfg("limit", e.target.value)}>{["3","4","6","8"].map(v => <option key={v}>{v}</option>)}</select></div>
      </div>
      <TRow label="Auto-rotate" val={cfg.auto_rotate} onChange={v => setCfg("auto_rotate", v)} />
    </>
  )}
              {f.t === "brands" && (
                <>
                  <TRow label="Show Section Heading" val={cfg.show_heading} onChange={v => setCfg("show_heading", v)} />
                  {cfg.show_heading && <Field label="Heading Text" value={cfg.heading} onChange={v => setCfg("heading", v)} />}
                  <div style={css.fld}><label style={css.lbl}>Scroll Speed</label><select style={css.sel} value={cfg.scroll_speed || "normal"} onChange={e => setCfg("scroll_speed", e.target.value)}>{["slow","normal","fast"].map(v => <option key={v}>{v}</option>)}</select></div>
                </>
              )}
            </>
          )}

          {tab === "buttons" && (
            <>
              <InfoBar text="Set label, URL, and colors for each CTA. Toggle to hide without deleting." variant="purple" />
              {f.t === "hero_banner"   && <BtnEd title="Main CTA"     pfx="btn" cfg={cfg} set={setCfg} showEnable />}
              {f.t === "featured_cats" && <BtnEd title="See All"       pfx="sa"  cfg={cfg} set={setCfg} showEnable />}
              {f.t === "product_grid"  && <><Field label="View All link" value={cfg.btn_link} onChange={v => setCfg("btn_link", v)} /><BtnEd title="View All" pfx="btn" cfg={cfg} set={setCfg} showEnable /></>}
              {f.t === "promo_banner"  && <BtnEd title="Promo CTA"    pfx="btn" cfg={cfg} set={setCfg} showEnable />}
              {f.t === "handcrafted"   && <BtnEd title="View All"      pfx="btn" cfg={cfg} set={setCfg} showEnable />}
              {f.t === "rich_text"     && <BtnEd title="Section CTA"   pfx="btn" cfg={cfg} set={setCfg} showEnable />}
              {f.t === "video"         && <BtnEd title="Video CTA"     pfx="btn" cfg={cfg} set={setCfg} showEnable />}
            </>
          )}

          {tab === "categories" && (
            <>
              <InfoBar text="Choose which categories appear in the Featured Categories strip. Only selected ones will show." />
              {categories.length === 0 && <p style={{ padding:'1rem 0', textAlign:'center', color:'#94a3b8', fontSize:'.75rem' }}>No categories loaded. Add categories in Product Management first.</p>}
              {categories.map(cat => {
                const sel = (cfg.cat_ids || []).includes(cat.id);
                return (
                  <div key={cat.id} onClick={() => {
                    const ids = cfg.cat_ids || [];
                    setCfg("cat_ids", ids.includes(cat.id) ? ids.filter(x => x !== cat.id) : [...ids, cat.id]);
                  }}
                    style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 11px", borderRadius:9, border:`1.5px solid ${sel ? "#7c3aed" : "#e2e8f0"}`, background: sel ? "#f5f3ff" : "#fff", cursor:"pointer", transition:"all .12s" }}>
                    {cat.imgUrl
                      ? <img src={cat.imgUrl} alt="" style={{ width:38, height:38, borderRadius:7, objectFit:"cover", border:"1px solid #e2e8f0", flexShrink:0 }} />
                      : <div style={{ width:38, height:38, borderRadius:7, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Grid size={13} color="#d1d5db" /></div>
                    }
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:".78rem", fontWeight:700 }}>{cat.name}</div>
                      <div style={{ fontSize:".65rem", color:"#94a3b8", fontFamily:"monospace" }}>/shop?category={cat.slug}</div>
                    </div>
                    <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${sel ? "#7c3aed" : "#e2e8f0"}`, display:"flex", alignItems:"center", justifyContent:"center", background: sel ? "#7c3aed" : "#fff", flexShrink:0 }}>
                      {sel && <Check size={10} color="#fff" />}
                    </div>
                  </div>
                );
              })}
              {(cfg.cat_ids || []).length > 0 && (
                <InfoBar text={`<strong>${(cfg.cat_ids||[]).length} categories</strong> selected for this strip.`} variant="purple" />
              )}
            </>
          )}

          {tab === "products" && (
            <>
              <InfoBar text="Pin specific products for this section. Source auto-switches to 'custom'." />
              {products.map(p => {
                const sel = (cfg.product_ids || []).includes(p.id);
                const disc = p.regular > p.price ? Math.round((1 - p.price / p.regular) * 100) : 0;
                const [pc, pb] = PSECT[p.section] || ["#64748b","#f1f5f9"];
                return (
                  <div key={p.id} onClick={() => togglePid(p.id)}
                    style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 11px", borderRadius:9, border:`1.5px solid ${sel ? "#E03E1A" : "#e2e8f0"}`, background: sel ? "#fff8f6" : "#fff", cursor:"pointer", transition:"all .12s" }}>
                    {p.imgUrl
                      ? <img src={p.imgUrl} alt="" style={{ width:38, height:38, borderRadius:7, objectFit:"cover", border:"1px solid #e2e8f0", flexShrink:0 }} />
                      : <div style={{ width:38, height:38, borderRadius:7, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><ShoppingBag size={13} color="#d1d5db" /></div>
                    }
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:".78rem", fontWeight:700 }}>{p.name}</div>
                      <div style={{ fontSize:".67rem", color:"#94a3b8", marginTop:2, display:"flex", alignItems:"center", gap:5 }}>
                        Rs.{p.price} {disc > 0 && <span style={{ color:"#16a34a", fontWeight:700 }}>-{disc}%</span>}
                        <span style={{ fontSize:".6rem", fontWeight:700, padding:"1px 5px", borderRadius:4, background:pb, color:pc }}>{p.section}</span>
                      </div>
                    </div>
                    <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${sel ? "#E03E1A" : "#e2e8f0"}`, display:"flex", alignItems:"center", justifyContent:"center", background: sel ? "#E03E1A" : "#fff", flexShrink:0 }}>
                      {sel && <Check size={10} color="#fff" />}
                    </div>
                  </div>
                );
              })}
              {(cfg.product_ids || []).length > 0 && (
                <InfoBar text={`<strong>${(cfg.product_ids||[]).length} products</strong> pinned to this section.`} variant="green" />
              )}
            </>
          )}

          {tab === "general" && (
            <>
              <Field label="Section Label *" value={f.l} onChange={v => set("l", v)} />
              <Field label="Internal Note (admin only)" value={f.note} onChange={v => set("note", v)} placeholder="Optional note for your team" />
              <TRow label="Visible on storefront" hint="Hidden sections are saved but not rendered" val={f.vis} onChange={v => set("vis", v)} />
            </>
          )}
        </div>

        {/* footer */}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:8, padding:"10px 20px", borderTop:"1.5px solid #f1f5f9", background:"#fafbfc", flexShrink:0 }}>
          <button type="button" onClick={onClose}
            style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:8, fontSize:".75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:"transparent", border:"1.5px solid #e2e8f0", color:"#64748b" }}>
            Cancel
          </button>
          <button type="button" disabled={!f.l.trim()} onClick={() => onSave({ ...f, date:"Today" })}
            style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:8, fontSize:".75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:"#E03E1A", color:"#fff", border:"none", opacity: f.l.trim() ? 1 : 0.4 }}>
            <Save size={12} color="#fff" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── ADD MODAL ─────────────────────── */
function AddModal({ onAdd, onClose }) {
  const [picked, setPick] = useState(null);
  const [label,  setLabel] = useState("");
  const [note,   setNote]  = useState("");
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:14, backdropFilter:"blur(2px)" }}
      onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:680, maxHeight:"91vh", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 28px 70px rgba(0,0,0,.24)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px 12px", borderBottom:"1.5px solid #f1f5f9", flexShrink:0 }}>
          <div>
            <h3 style={{ fontSize:".88rem", fontWeight:800 }}>Add Section</h3>
            <p style={{ fontSize:".67rem", color:"#94a3b8", marginTop:1 }}>Pick a type to add to the homepage layout</p>
          </div>
          <button type="button" onClick={onClose}
            style={{ width:26, height:26, borderRadius:6, border:"1.5px solid #e2e8f0", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#64748b" }}>
            <X size={13} />
          </button>
        </div>
        <div style={{ overflowY:"auto", padding:"15px 20px", display:"flex", flexDirection:"column", gap:13, flex:1 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:7 }}>
            {STYPES.map(s => {
              const TI = s.I; const on = picked?.t === s.t;
              return (
                <button type="button" key={s.t}
                  style={{ display:"flex", flexDirection:"column", gap:3, padding:"10px", borderRadius:9, border:`${on ? 2 : 1.5}px solid ${on ? s.c : "#e8ecf0"}`, background: on ? s.c : "#fff", cursor:"pointer", fontFamily:"inherit", position:"relative", transition:"all .13s", textAlign:"left" }}
                  onClick={() => { setPick(s); setLabel(s.l); }}>
                  <div style={{ width:22, height:22, borderRadius:6, background: on ? s.bg : "#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:2 }}>
                    <TI size={12} color={on ? "#fff" : s.c} />
                  </div>
                  <span style={{ fontSize:".72rem", fontWeight:800, color: on ? "#fff" : "#0f172a" }}>{s.l}</span>
                  <span style={{ fontSize:".62rem", lineHeight:1.35, color: on ? "rgba(255,255,255,.75)" : "#64748b" }}>{s.d}</span>
                  {on && <div style={{ position:"absolute", top:5, right:5, width:14, height:14, borderRadius:"50%", background:s.c, display:"flex", alignItems:"center", justifyContent:"center" }}><Check size={8} color="#fff" /></div>}
                </button>
              );
            })}
          </div>
          {picked && (
            <div style={{ borderTop:"1.5px solid #f1f5f9", paddingTop:12, display:"flex", flexDirection:"column", gap:10 }}>
              <Field label="Section Label *" value={label} onChange={setLabel} placeholder="e.g. Summer Sale Banner" />
              <Field label="Internal Note (optional)" value={note} onChange={setNote} placeholder="Note for your team" />
            </div>
          )}
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:8, padding:"10px 20px", borderTop:"1.5px solid #f1f5f9", background:"#fafbfc", flexShrink:0 }}>
          <button type="button" onClick={onClose}
            style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:8, fontSize:".75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:"transparent", border:"1.5px solid #e2e8f0", color:"#64748b" }}>
            Cancel
          </button>
          <button type="button" disabled={!picked || !label.trim()}
            style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:8, fontSize:".75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:"#E03E1A", color:"#fff", border:"none", opacity: picked && label.trim() ? 1 : 0.4 }}
            onClick={() => onAdd({ id:uid(), t:picked.t, l:label, vis:true, date:"Today", note, cfg:{ ...DC[picked.t] || {}, slides: picked.t === "hero_banner" ? DC.hero_banner.slides.map(s => ({ ...s })) : undefined } })}>
            <Plus size={12} color="#fff" /> Add Section
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── PRODUCT MANAGER ─────────────────────── */
function ProductMgr({ products, setProducts, sections, setSections, categories }) {
  const [filter, setFilter] = useState("all");
  const [editP,  setEditP]  = useState(null);

  const SECTION_TABS = [
    { key:"all",           label:"All",         source:null },
    { key:"top_deals",     label:"Top Deals",   source:"top_deals" },
    { key:"trending",      label:"Trending",    source:"trending" },
    { key:"featured",      label:"Featured",    source:"featured" },
    { key:"new_arrivals",  label:"New Arrivals",source:"new_arrivals" },
    { key:"best_selling",  label:"Best Selling",source:"best_selling" },
  ];

  const currentSection = filter !== "all"
    ? sections.find(s => s.t === "product_grid" && s.cfg.source === filter)
    : null;

  const assignedIds = currentSection
    ? new Set((currentSection.cfg.product_ids || []).map(String))
    : new Set();

  const toggleAssignment = (productId) => {
    if (!currentSection) return;
    const ids = (currentSection.cfg.product_ids || []).map(String);
    const sid = String(productId);
    const newIds = ids.includes(sid) ? ids.filter(id => id !== sid) : [...ids, sid];
    setSections(ss => ss.map(s => s.id === currentSection.id
      ? { ...s, cfg: { ...s.cfg, product_ids: newIds, source: "custom" } }
      : s
    ));
  };

  const getAssignedSections = (productId) => {
    const sid = String(productId);
    const result = [];
    for (const tab of SECTION_TABS) {
      if (tab.key === "all") continue;
      const sec = sections.find(s => s.t === "product_grid" && s.cfg.source === tab.key);
      if (sec && (sec.cfg.product_ids || []).map(String).includes(sid)) result.push(tab);
    }
    return result;
  };

  const IcBtn = ({ onClick, children, variant = "default" }) => {
    const vars = { default:["#e2e8f0","#fff","#64748b"], blue:["#bfdbfe","#eff6ff","#2563eb"], red:["#fecaca","#fff5f5","#dc2626"] };
    const [bc, bg, c] = vars[variant] || vars.default;
    return (
      <button type="button" onClick={onClick}
        style={{ width:24, height:24, borderRadius:6, border:`1.5px solid ${bc}`, background:bg, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:c, flexShrink:0 }}>
        {children}
      </button>
    );
  };

  const SecBadge = ({ source, label }) => {
    const [bc, bg] = PSECT[source] || ["#64748b","#f1f5f9"];
    return <span style={{ fontSize:".55rem", fontWeight:700, padding:"1px 5px", borderRadius:3, background:bg, color:bc, flexShrink:0 }}>{label}</span>;
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:8, borderRadius:9, padding:"9px 11px", fontSize:".72rem", lineHeight:1.5, background:"#eff6ff", border:"1.5px solid #bfdbfe", color:"#1d4ed8" }}>
        <AlertCircle size={12} style={{ flexShrink:0, marginTop:1 }} />
        <div><strong>Assign products to sections</strong> — select a section tab below, then toggle products on/off. Products shown on the homepage per the assigned section. Source must be set to <strong>"custom"</strong> in the section editor for manual assignments to display.</div>
      </div>
      <div style={{ background:"#fff", borderRadius:12, border:"1.5px solid #e2e8f0", overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px", borderBottom:"1.5px solid #f1f5f9", flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <Package size={13} color="#E03E1A" />
            <h3 style={{ fontSize:".82rem", fontWeight:800 }}>Products</h3>
            <span style={{ fontSize:".66rem", color:"#94a3b8", background:"#f1f5f9", padding:"2px 8px", borderRadius:5, fontWeight:600 }}>{products.length} total</span>
          </div>
          <button type="button"
            style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:7, fontSize:".71rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:"#E03E1A", color:"#fff", border:"none" }}
            onClick={() => setProducts(p => [...p, { id:uid(), name:"New Product", vendor:"Vendor", price:0, regular:0, imgUrl:"", section:"featured", visible:true }])}>
            <Plus size={11} color="#fff" /> Add Product
          </button>
        </div>
        <div style={{ display:"flex", gap:5, padding:"7px 12px", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
          {SECTION_TABS.map(({ key, label }) => {
            const cnt = key === "all" ? products.length : assignedIds.size;
            const active = filter === key;
            return (
              <button key={key} type="button"
                style={{ padding:"3px 9px", borderRadius:6, fontSize:".69rem", fontWeight:700, cursor:"pointer", border:`1.5px solid ${active ? "#E03E1A" : "transparent"}`, background: active ? "#fee2e2" : "#f1f5f9", color: active ? "#E03E1A" : "#64748b", fontFamily:"inherit", transition:"all .12s" }}
                onClick={() => setFilter(key)}>
                {label} ({cnt})
              </button>
            );
          })}
        </div>
        {filter !== "all" && !currentSection && (
          <div style={{ padding:"24px 18px", textAlign:"center" }}>
            <AlertCircle size={20} color="#e2e8f0" />
            <div style={{ fontSize:".77rem", fontWeight:700, color:"#475569", marginTop:7 }}>No section found</div>
            <div style={{ fontSize:".66rem", color:"#94a3b8", marginTop:3 }}>Create a product_grid section with source "{filter}" first.</div>
          </div>
        )}
        {filter !== "all" && currentSection && (
          <div style={{ background:"#f8fafc", borderBottom:"1px solid #e2e8f0", padding:"6px 12px", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:".64rem", color:"#64748b" }}>
              {assignedIds.size} product{assignedIds.size !== 1 ? "s" : ""} assigned — toggle to add/remove
            </span>
            {(currentSection.cfg.source === "top_deals" || currentSection.cfg.source === "trending" || currentSection.cfg.source === "featured") && (
              <span style={{ fontSize:".6rem", fontWeight:700, padding:"2px 6px", borderRadius:4, background:"#fef3c7", color:"#d97706", display:"flex", alignItems:"center", gap:3 }}>
                <AlertCircle size={8} /> Source set to "{currentSection.cfg.source}" — switch to "custom" in section editor
              </span>
            )}
          </div>
        )}
        {filter !== "all" && currentSection && products.map(p => {
          const sel = assignedIds.has(String(p.id));
          const disc = p.regular > p.price ? Math.round((1 - p.price / p.regular) * 100) : 0;
          return (
            <div key={p.id} className="prow" style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 13px", borderBottom:"1px solid #f8fafc", cursor:"pointer" }}
              onClick={() => toggleAssignment(p.id)}>
              <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${sel ? "#E03E1A" : "#d1d5db"}`, display:"flex", alignItems:"center", justifyContent:"center", background: sel ? "#E03E1A" : "#fff", flexShrink:0 }}>
                {sel && <Check size={10} color="#fff" />}
              </div>
              {p.imgUrl
                ? <img src={p.imgUrl} alt="" className="prow-img" style={{ width:42, height:42, borderRadius:7, objectFit:"cover", border:"1.5px solid #e2e8f0", flexShrink:0 }} />
                : <div className="prow-img" style={{ width:42, height:42, borderRadius:7, border:"1.5px dashed #d1d5db", background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><ShoppingBag size={13} color="#d1d5db" /></div>
              }
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:".79rem", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                <div style={{ fontSize:".68rem", color:"#94a3b8", marginTop:2 }}>
                  Rs.{p.price} {disc > 0 && <><span style={{ textDecoration:"line-through", color:"#d1d5db" }}>Rs.{p.regular}</span><span style={{ color:"#16a34a", fontWeight:700, marginLeft:3 }}>-{disc}%</span></>}
                </div>
              </div>
            </div>
          );
        })}
        {filter === "all" && products.length === 0
          ? <div style={{ padding:"36px 18px", textAlign:"center" }}><ShoppingBag size={24} color="#e2e8f0" /><div style={{ fontSize:".77rem", fontWeight:700, color:"#475569", marginTop:7 }}>No products here</div></div>
          : filter === "all" && products.map(p => {
              const disc = p.regular > p.price ? Math.round((1 - p.price / p.regular) * 100) : 0;
              const assignedTo = getAssignedSections(p.id);
              return (
                <div key={p.id} className="prow" style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 13px", borderBottom:"1px solid #f8fafc" }}>
                  {p.imgUrl
                    ? <img src={p.imgUrl} alt="" className="prow-img" style={{ width:42, height:42, borderRadius:7, objectFit:"cover", border:"1.5px solid #e2e8f0", flexShrink:0 }} />
                    : <div className="prow-img" style={{ width:42, height:42, borderRadius:7, border:"1.5px dashed #d1d5db", background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><ShoppingBag size={13} color="#d1d5db" /></div>
                  }
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:".79rem", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                    <div style={{ fontSize:".68rem", color:"#94a3b8", marginTop:2, display:"flex", alignItems:"center", gap:5 }}>
                      Rs.{p.price} {disc > 0 && <><span style={{ textDecoration:"line-through", color:"#d1d5db" }}>Rs.{p.regular}</span><span style={{ color:"#16a34a", fontWeight:700 }}>-{disc}%</span></>}
                    </div>
                  </div>
                  <div className="prow-badges" style={{ display:"flex", gap:2, flexWrap:"wrap" }}>
                    {assignedTo.length > 0
                      ? assignedTo.map(t => <SecBadge key={t.key} source={t.key} label={t.label} />)
                      : <span style={{ fontSize:".6rem", color:"#cbd5e1", fontStyle:"italic" }}>Unassigned</span>
                    }
                  </div>
                  <div className="prow-acts" style={{ display:"flex", alignItems:"center", gap:3, flexShrink:0 }}>
                    <IcBtn variant="blue" onClick={() => setProducts(pp => [...pp, { ...p, id:uid(), name:p.name + " (copy)" }])}><Copy size={10} /></IcBtn>
                    <IcBtn onClick={() => setEditP({ ...p })}><Edit2 size={10} /></IcBtn>
                    <IcBtn variant="red" onClick={() => setProducts(pp => pp.filter(x => x.id !== p.id))}><Trash2 size={10} /></IcBtn>
                  </div>
                </div>
              );
            })
        }
      </div>

      {editP && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:14, backdropFilter:"blur(2px)" }}
          onClick={() => setEditP(null)}>
          <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:540, maxHeight:"91vh", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 28px 70px rgba(0,0,0,.24)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px 12px", borderBottom:"1.5px solid #f1f5f9", flexShrink:0 }}>
              <div>
                <h3 style={{ fontSize:".88rem", fontWeight:800 }}>Edit Product</h3>
                <p style={{ fontSize:".67rem", color:"#94a3b8", marginTop:1 }}>Update image, pricing and section</p>
              </div>
              <button type="button" onClick={() => setEditP(null)}
                style={{ width:26, height:26, borderRadius:6, border:"1.5px solid #e2e8f0", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#64748b" }}>
                <X size={13} />
              </button>
            </div>
            <div style={{ overflowY:"auto", padding:"15px 20px", display:"flex", flexDirection:"column", gap:13, flex:1 }}>
              <ImgUp val={editP.imgUrl} onChange={v => setEditP(p => ({ ...p, imgUrl:v }))} label="Product Image" hint="Recommended: 800x800px square" />
              <div style={css.row}>
                <Field label="Product Name *" value={editP.name}   onChange={v => setEditP(p => ({ ...p, name:v }))} />
                <div style={{ flex:"0 0 150px" }}><Field label="Vendor" value={editP.vendor} onChange={v => setEditP(p => ({ ...p, vendor:v }))} /></div>
              </div>
              <div style={css.row}>
                <Field label="Sale Price (Rs.)"    value={String(editP.price)}   onChange={v => setEditP(p => ({ ...p, price:+v }))}   type="number" />
                <Field label="Regular Price (Rs.)" value={String(editP.regular)} onChange={v => setEditP(p => ({ ...p, regular:+v }))} type="number" />
              </div>
              <div style={css.fld}>
                <label style={css.lbl}>Section Assignment</label>
                <select style={css.sel} value={editP.section} onChange={e => setEditP(p => ({ ...p, section:e.target.value }))}>
                  {["top_deals","trending","featured","new_arrivals"].map(v => <option key={v} value={v}>{v.replace("_"," ")}</option>)}
                </select>
              </div>
              <TRow label="Visible on storefront" val={editP.visible} onChange={v => setEditP(p => ({ ...p, visible:v }))} />
              {sections.filter(s => s.t === "product_grid" && (s.cfg.product_ids || []).includes(editP.id)).length > 0 && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:8, borderRadius:9, padding:"9px 11px", fontSize:".72rem", background:"#f0fdf4", border:"1.5px solid #bbf7d0", color:"#15803d" }}>
                  <Zap size={11} style={{ flexShrink:0 }} />
                  <div>Used in: <strong>{sections.filter(s => s.t === "product_grid" && (s.cfg.product_ids || []).includes(editP.id)).map(s => s.l).join(", ")}</strong></div>
                </div>
              )}
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8, padding:"10px 20px", borderTop:"1.5px solid #f1f5f9", background:"#fafbfc", flexShrink:0 }}>
              <button type="button" onClick={() => setEditP(null)}
                style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:8, fontSize:".75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:"transparent", border:"1.5px solid #e2e8f0", color:"#64748b" }}>
                Cancel
              </button>
              <button type="button"
                style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:8, fontSize:".75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:"#E03E1A", color:"#fff", border:"none" }}
                onClick={() => { setProducts(pp => pp.map(x => x.id === editP.id ? editP : x)); setEditP(null); }}>
                <Save size={12} color="#fff" /> Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── CATEGORY MANAGER ─────────────────────── */
function CatMgr({ categories, setCategories, sections }) {
  const [editC, setEditC] = useState(null);
  const IcBtn = ({ onClick, children, variant = "default" }) => {
    const vars = { default:["#e2e8f0","#fff","#64748b"], blue:["#bfdbfe","#eff6ff","#2563eb"], red:["#fecaca","#fff5f5","#dc2626"] };
    const [bc, bg, c] = vars[variant] || vars.default;
    return <button type="button" onClick={onClick} style={{ width:24, height:24, borderRadius:6, border:`1.5px solid ${bc}`, background:bg, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:c, flexShrink:0 }}>{children}</button>;
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:8, borderRadius:9, padding:"9px 11px", fontSize:".72rem", lineHeight:1.5, background:"#f5f3ff", border:"1.5px solid #ddd6fe", color:"#6d28d9" }}>
        <AlertCircle size={12} style={{ flexShrink:0, marginTop:1 }} />
        <div><strong>Category icons</strong> appear in the Featured Categories strip. Upload 120x120px SVG/PNG per category.</div>
      </div>
      <div style={{ background:"#fff", borderRadius:12, border:"1.5px solid #e2e8f0", overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px", borderBottom:"1.5px solid #f1f5f9", flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <Tag size={13} color="#7c3aed" />
            <h3 style={{ fontSize:".82rem", fontWeight:800 }}>Categories</h3>
            <span style={{ fontSize:".66rem", color:"#94a3b8", background:"#f1f5f9", padding:"2px 8px", borderRadius:5, fontWeight:600 }}>{categories.filter(c => c.visible).length} visible</span>
          </div>
          <button type="button"
            style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:7, fontSize:".71rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:"#7c3aed", color:"#fff", border:"none" }}
            onClick={() => setCategories(c => [...c, { id:uid(), name:"New Category", slug:"new-cat", visible:true, imgUrl:"" }])}>
            <Plus size={11} color="#fff" /> Add Category
          </button>
        </div>
        {categories.map((cat, i) => {
          const usedIn = sections.filter(s => s.t === "featured_cats" && (s.cfg.cat_ids || []).includes(cat.id)).map(s => s.l);
          return (
            <div key={cat.id} className="crow" style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 13px", borderBottom:"1px solid #f8fafc" }}>
              <span className="crow-num" style={{ fontSize:".65rem", fontWeight:800, color:"#d1d5db", width:18, textAlign:"center", flexShrink:0 }}>{i + 1}</span>
              {cat.imgUrl
                ? <img src={cat.imgUrl} alt={cat.name} className="crow-img" style={{ width:46, height:46, borderRadius:8, objectFit:"cover", border:"1.5px solid #e2e8f0", flexShrink:0 }} />
                : <div className="crow-img" style={{ width:46, height:46, borderRadius:8, border:"1.5px dashed #d1d5db", background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Grid size={14} color="#d1d5db" /></div>
              }
              <div className="crow-info" style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:".79rem", fontWeight:700 }}>{cat.name}</div>
                <div style={{ fontSize:".65rem", color:"#94a3b8", fontFamily:"monospace" }}>/shop?category={cat.slug}</div>
                {usedIn.length > 0 && <div style={{ fontSize:".63rem", color:"#7c3aed", marginTop:2 }}>Used in: {usedIn.join(", ")}</div>}
              </div>
              <div className="crow-foot">
                <span style={{ fontSize:".62rem", fontWeight:700, padding:"2px 7px", borderRadius:4, background: cat.visible ? "#dcfce7" : "#f1f5f9", color: cat.visible ? "#16a34a" : "#94a3b8", display:"flex", alignItems:"center", gap:2 }}>
                  {cat.visible ? <><Eye size={8} /> Visible</> : <><EyeOff size={8} /> Hidden</>}
                </span>
                <div className="crow-acts" style={{ display:"flex", alignItems:"center", gap:3, flexShrink:0 }}>
                  <IcBtn variant="blue" onClick={() => setCategories(c => [...c, { ...cat, id:uid(), name:cat.name + " (copy)" }])}><Copy size={10} /></IcBtn>
                  <IcBtn onClick={() => setEditC({ ...cat })}><Edit2 size={10} /></IcBtn>
                  <IcBtn onClick={() => setCategories(c => c.map(x => x.id === cat.id ? { ...x, visible:!x.visible } : x))}>{cat.visible ? <Eye size={10} /> : <EyeOff size={10} />}</IcBtn>
                  <IcBtn variant="red" onClick={() => setCategories(c => c.filter(x => x.id !== cat.id))}><Trash2 size={10} /></IcBtn>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editC && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:14, backdropFilter:"blur(2px)" }}
          onClick={() => setEditC(null)}>
          <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:480, maxHeight:"91vh", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 28px 70px rgba(0,0,0,.24)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px 12px", borderBottom:"1.5px solid #f1f5f9", flexShrink:0 }}>
              <div>
                <h3 style={{ fontSize:".88rem", fontWeight:800 }}>Edit Category</h3>
                <p style={{ fontSize:".67rem", color:"#94a3b8", marginTop:1 }}>Update icon, name and slug</p>
              </div>
              <button type="button" onClick={() => setEditC(null)}
                style={{ width:26, height:26, borderRadius:6, border:"1.5px solid #e2e8f0", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#64748b" }}>
                <X size={13} />
              </button>
            </div>
            <div style={{ overflowY:"auto", padding:"15px 20px", display:"flex", flexDirection:"column", gap:13, flex:1 }}>
              <ImgUp val={editC.imgUrl} onChange={v => setEditC(c => ({ ...c, imgUrl:v }))} label="Category Icon" hint="Recommended: 120x120px SVG or PNG" />
              <Field label="Category Name *" value={editC.name} onChange={v => setEditC(c => ({ ...c, name:v }))} />
              <div style={css.fld}>
                <label style={css.lbl}>URL Slug</label>
                <div style={{ display:"flex", alignItems:"stretch" }}>
                  <span style={{ padding:"0 9px", lineHeight:"36px", background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRight:"none", borderRadius:"8px 0 0 8px", fontSize:".71rem", color:"#94a3b8", whiteSpace:"nowrap", flexShrink:0 }}>/shop?category=</span>
                  <input style={{ ...css.inp, borderRadius:"0 8px 8px 0" }} value={editC.slug} onChange={e => setEditC(c => ({ ...c, slug:e.target.value }))} />
                </div>
              </div>
              <TRow label="Visible in category strip" val={editC.visible} onChange={v => setEditC(c => ({ ...c, visible:v }))} />
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8, padding:"10px 20px", borderTop:"1.5px solid #f1f5f9", background:"#fafbfc", flexShrink:0 }}>
              <button type="button" onClick={() => setEditC(null)}
                style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:8, fontSize:".75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:"transparent", border:"1.5px solid #e2e8f0", color:"#64748b" }}>
                Cancel
              </button>
              <button type="button"
                style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:8, fontSize:".75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:"#7c3aed", color:"#fff", border:"none" }}
                onClick={() => { setCategories(c => c.map(x => x.id === editC.id ? editC : x)); setEditC(null); }}>
                <Save size={12} color="#fff" /> Save Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── IMAGE GUIDE ─────────────────────── */
const GUIDE = [
  { zone:"Hero Background Image",       where:"Sections > Main Hero Banner > Edit > Images",              I:Image,       c:"#2563eb", bg:"#dbeafe", size:"1440x680px" },
  { zone:"Hero Side Slides (dynamic)",  where:"Sections > Main Hero Banner > Edit > Slides",              I:Layers,      c:"#2563eb", bg:"#dbeafe", size:"600x420px"  },
  { zone:"Hero Headline and Sub-text",  where:"Sections > Main Hero Banner > Edit > Text",                I:Type,        c:"#7c3aed", bg:"#ede9fe", size:"Text"       },
  { zone:"Hero CTA Buttons",            where:"Sections > Main Hero Banner > Edit > Buttons",             I:MousePointer,c:"#E03E1A", bg:"#fee2e2", size:"Buttons"    },
  { zone:"Category Icons x8",           where:"Categories tab > edit each > upload icon",                 I:Grid,        c:"#7c3aed", bg:"#ede9fe", size:"120x120px"  },
  { zone:"Trust Banner Text x4",        where:"Sections > Trust Banners > Edit > Text",                   I:Check,       c:"#0891b2", bg:"#e0f2fe", size:"Text"       },
  { zone:"Top Deals Products",          where:"Products tab > section=top_deals, pin inside section",     I:ShoppingBag, c:"#E03E1A", bg:"#fee2e2", size:"800x800px"  },
  { zone:"Promo Banner Image and Text", where:"Sections > Authentic Products Banner > Edit > Images",     I:Percent,     c:"#d97706", bg:"#fef3c7", size:"400x300px"  },
  { zone:"Trending Products",           where:"Products tab > section=trending, pin inside section",      I:ShoppingBag, c:"#9333ea", bg:"#f3e8ff", size:"800x800px"  },
  { zone:"Handcrafted Banner Image",    where:"Sections > Hand Crafted With Tradition > Edit > Images",   I:Layers,      c:"#16a34a", bg:"#dcfce7", size:"900x420px"  },
  { zone:"Featured Products",           where:"Products tab > section=featured, pin inside section",      I:ShoppingBag, c:"#d97706", bg:"#fef3c7", size:"800x800px"  },
  { zone:"Artisan Photo (Values)",      where:"Sections > Values/Mission > Edit > Images",                I:AlignLeft,   c:"#64748b", bg:"#f1f5f9", size:"600x500px"  },
  { zone:"Testimonials Settings",       where:"Sections > Testimonials > Edit > Text",                    I:Star,        c:"#9333ea", bg:"#f3e8ff", size:"Heading + Toggles + Button"  },
];

function Guide() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:8, borderRadius:9, padding:"9px 11px", fontSize:".72rem", lineHeight:1.5, background:"#f0fdf4", border:"1.5px solid #bbf7d0", color:"#15803d" }}>
        <AlertCircle size={12} style={{ flexShrink:0, marginTop:1 }} />
        <div><strong>Where to edit what</strong> — every image, text and button on the homepage mapped to its exact location in this CMS.</div>
      </div>
      <div style={{ background:"#fff", borderRadius:12, border:"1.5px solid #e2e8f0", overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 14px", borderBottom:"1.5px solid #f1f5f9" }}>
          <FolderOpen size={13} color="#475569" />
          <h3 style={{ fontSize:".82rem", fontWeight:800 }}>Homepage Content Map</h3>
        </div>
        {GUIDE.map((g, i) => {
          const GI = g.I;
          return (
            <div key={i} className="grow" style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderBottom:"1px solid #f8fafc" }}>
              <div style={{ width:30, height:30, borderRadius:7, background:g.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><GI size={12} color={g.c} /></div>
              <div className="grow-info" style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:".79rem", fontWeight:700 }}>{g.zone}</div>
                <div style={{ fontSize:".67rem", color:"#94a3b8", marginTop:1, display:"flex", alignItems:"center", gap:3 }}><ArrowRight size={9} /> {g.where}</div>
              </div>
              <span className="grow-badge" style={{ fontSize:".61rem", fontWeight:700, padding:"2px 7px", borderRadius:4, background:g.bg, color:g.c, flexShrink:0 }}>{g.size}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────── SECTION ROW ─────────────────────── */
/* Mobile-responsive: uses className "srow" so CSS controls columns per breakpoint */
function SecRow({ sec, idx, total, onUp, onDown, onToggle, onEdit, onDup, onDel }) {
  const meta = ST(sec.t); const MI = meta.I;
  const cfgN  = Object.keys(sec.cfg || {}).filter(k => { const v = sec.cfg[k]; return v !== "" && v != null && !(Array.isArray(v) && !v.length); }).length;
  const hasImg = ["bg_img","promo_img","banner_img","artisan_img","img"].some(k => sec.cfg?.[k]) || (sec.cfg?.slides || []).some(s => s.img);

  const IcBtn = ({ onClick, disabled, title, variant = "default", children }) => {
    const vars = { default:["#e2e8f0","#fff","#64748b"], blue:["#bfdbfe","#eff6ff","#2563eb"], red:["#fecaca","#fff5f5","#dc2626"] };
    const [bc, bg, c] = vars[variant] || vars.default;
    return (
      <button type="button" title={title} disabled={disabled} onClick={onClick}
        style={{ width:28, height:28, borderRadius:6, border:`1.5px solid ${bc}`, background:bg, display:"flex", alignItems:"center", justifyContent:"center", cursor: disabled ? "not-allowed" : "pointer", color:c, flexShrink:0, opacity: disabled ? 0.3 : 1 }}>
        {children}
      </button>
    );
  };

  return (
    <div className="srow"
      onMouseEnter={e => e.currentTarget.style.background = "#fafbfc"}
      onMouseLeave={e => e.currentTarget.style.background = "#fff"}>

      {/* # */}
      <div className="srow-num">{idx + 1}</div>
      {/* grip */}
      <div className="srow-grip"><GripVertical size={11} /></div>
      {/* type icon */}
      <div className="srow-ico" style={{ background:meta.bg }}><MI size={11} color={meta.c} /></div>
      {/* info */}
      <div className="srow-info">
        <div className="srow-lbl">{sec.l}</div>
        <div className="srow-meta">
          <span style={{ fontSize:".61rem", fontWeight:700, padding:"1px 6px", borderRadius:4, background:meta.bg, color:meta.c, whiteSpace:"nowrap", flexShrink:0 }}>{meta.l}</span>
          {cfgN > 0 && <span style={{ display:"inline-flex", alignItems:"center", gap:2, fontSize:".61rem", fontWeight:700, color:"#7c3aed", background:"#f3e8ff", padding:"1px 6px", borderRadius:4, flexShrink:0 }}><Check size={7} />{cfgN}</span>}
          {hasImg     && <span style={{ display:"inline-flex", alignItems:"center", gap:2, fontSize:".61rem", fontWeight:700, color:"#2563eb", background:"#dbeafe", padding:"1px 6px", borderRadius:4, flexShrink:0 }}><ImagePlus size={7} />img</span>}
          {sec.note   && <span className="srow-note">{sec.note}</span>}
        </div>
      </div>
      {/* visibility */}
      <div>
        {sec.vis
          ? <span className="vis-on"><Eye size={8} /> Visible</span>
          : <span className="vis-off"><EyeOff size={8} /> Hidden</span>
        }
      </div>
      {/* updated */}
      <div className="srow-date">{sec.date}</div>
      {/* actions */}
      <div className="srow-acts">
        <IcBtn disabled={idx === 0}           onClick={() => onUp(idx)}        title="Move up">  <ChevronUp   size={10} /></IcBtn>
        <IcBtn disabled={idx === total - 1}   onClick={() => onDown(idx)}      title="Move down"><ChevronDown size={10} /></IcBtn>
        <IcBtn                                onClick={() => onToggle(sec.id)} title={sec.vis ? "Hide" : "Show"}>{sec.vis ? <Eye size={10} /> : <EyeOff size={10} />}</IcBtn>
        <IcBtn variant="blue"                 onClick={() => onDup(sec)}       title="Duplicate"><Copy    size={10} /></IcBtn>
        <IcBtn                                onClick={() => onEdit(sec)}      title="Edit">      <Edit2   size={10} /></IcBtn>
        <IcBtn variant="red"                  onClick={() => onDel(sec.id)}    title="Delete">    <Trash2  size={10} /></IcBtn>
      </div>
    </div>
  );
}

/* ─────────────────────── CONVERSION HELPERS ─────────────────────── */
const toClient = e => {
  let cfg = {};
  try { cfg = JSON.parse(e.configJson || "{}"); } catch { console.warn('Invalid configJson for section', e.id); }
  const date = cfg._date ? new Date(Number(cfg._date)).toLocaleDateString("en-IN", {day:"numeric",month:"short"}) : new Date(e.updatedAt||Date.now()).toLocaleDateString("en-IN", {day:"numeric",month:"short"});
  const note = cfg._note || "";
  delete cfg._date; delete cfg._note;
  return { id: String(e.id), t: e.sectionType, l: e.label || "", vis: e.visible !== false, date, note, cfg };
};
const toServer = s => ({
  sectionType: s.t,
  label: s.l,
  visible: s.vis,
  configJson: JSON.stringify({ _date: Date.now(), _note: s.note || "", ...s.cfg }),
});

/* ─────────────────────── ROOT APP ─────────────────────── */
export default function CmsHomepageBuilder() {
  const [sections,   setSections]   = useState(INIT_SECS);
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const origCatIds = useRef(new Set());
  const [mainTab,    setMainTab]    = useState("sections");
  const [adding,     setAdding]     = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [delConf,    setDelConf]    = useState(null);
  const [saved,          setSaved]          = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [preview,        setPreview]        = useState("desktop");

  useEffect(() => {
    let cancelled = false;
    getAdminHomepageSections()
      .then(data => { if (!cancelled && Array.isArray(data) && data.length) setSections(data.map(toClient)); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setInitialLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getAllProducts().catch(() => []),
      getCategories().catch(() => []),
    ]).then(([prods, cats]) => {
      if (cancelled) return;
      const mappedProds = (Array.isArray(prods) ? prods : []).map(p => ({
        id: String(p.id),
        name: p.name,
        vendor: p.vendor?.storeName || p.vendor || '',
        price: p.discountPrice || p.regularPrice || 0,
        regular: p.regularPrice || 0,
        imgUrl: p.media?.[0]?.fileName
          ? (p.media[0].fileName.startsWith('http') ? p.media[0].fileName : `${BACKEND_URL}/uploads/products/${p.media[0].fileName}`)
          : '',
        section: p.category || 'all',
        visible: true,
      }));
      const mappedCats = (Array.isArray(cats) ? cats : []).map(c => ({
        id: String(c.id),
        name: c.name,
        slug: c.slug || c.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        visible: c.status === 'Active',
        imgUrl: c.image || '',
      }));
      if (mappedProds.length) setProducts(mappedProds);
      if (mappedCats.length) {
        setCategories(mappedCats);
        origCatIds.current = new Set(mappedCats.filter(c => !c.id.startsWith('id')).map(c => c.id));
      }
    });
    return () => { cancelled = true; };
  }, []);

  const moveUp   = i => { if (!i) return; const a = [...sections]; [a[i-1],a[i]]=[a[i],a[i-1]]; setSections(a); };
  const moveDown = i => { if (i === sections.length-1) return; const a=[...sections]; [a[i],a[i+1]]=[a[i+1],a[i]]; setSections(a); };
  const toggle   = id => setSections(ss => ss.map(s => s.id === id ? { ...s, vis:!s.vis } : s));
  const duplicate = sec => {
    const copy = { ...sec, id:uid(), l:sec.l+" (copy)", date:"Today", cfg:{ ...sec.cfg, product_ids:[...(sec.cfg.product_ids||[])], cat_ids:[...(sec.cfg.cat_ids||[])], slides:(sec.cfg.slides||[]).map(s=>({...s,id:uid()})) }};
    const i = sections.findIndex(s => s.id === sec.id);
    setSections(ss => [...ss.slice(0, i+1), copy, ...ss.slice(i+1)]);
  };
  const doAdd  = sec  => { setSections(ss => [...ss, sec]); setAdding(false); };
  const doEdit = form => { setSections(ss => ss.map(s => s.id === form.id ? form : s)); setEditing(null); };
  const doDel  = id   => { setSections(ss => ss.filter(s => s.id !== id)); setDelConf(null); };
  const saveCategoriesToBackend = async () => {
    const origIds = origCatIds.current;
    const currentIds = new Set(categories.map(c => c.id));
    const deleted = [...origIds].filter(id => !currentIds.has(id));
    for (const id of deleted) {
      try { await deleteCategory(id); } catch (e) { console.warn("Failed to delete category", id, e); }
    }
    const uploadImage = async (imgUrl) => {
      if (!imgUrl || !imgUrl.startsWith('data:')) return imgUrl;
      try {
        const blob = await (await fetch(imgUrl)).blob();
        const file = new File([blob], 'category.png', { type: blob.type });
          const result = await uploadCategoryImage(file);
          const uploaded = result?.url || result?.fileName || '';
          if (!uploaded) return imgUrl;
          return uploaded.startsWith('http') ? uploaded : `${BACKEND_URL}${uploaded}`;
      } catch (e) {
        console.warn("Failed to upload category image:", e);
        return imgUrl;
      }
    };
    const updatedCats = [...categories];
    for (let i = 0; i < updatedCats.length; i++) {
      const cat = updatedCats[i];
      const isNew = cat.id.startsWith('id');
      const imgUrl = await uploadImage(cat.imgUrl);
      const payload = {
        name: cat.name,
        slug: cat.slug,
        status: cat.visible ? 'Active' : 'Inactive',
        image: imgUrl || cat.imgUrl,
      };
      try {
        if (isNew) {
          const result = await createCategory(payload);
          if (result?.id) {
            updatedCats[i] = { ...cat, id: String(result.id), imgUrl: imgUrl || cat.imgUrl };
            origCatIds.current = new Set([...origCatIds.current, String(result.id)]);
          }
        } else {
          if (imgUrl !== cat.imgUrl) payload.image = imgUrl;
          await updateCategory(cat.id, payload);
        }
      } catch (e) {
        toast.error(`Failed to save category "${cat.name}": ${e.message || e}`);
      }
    }
    setCategories(updatedCats);
  };

  const doSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await saveCategoriesToBackend();
      const payload = sections.map(toServer);
      await saveAllHomepageSections(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success("Layout & categories saved");
    } catch (e) {
      toast.error("Failed to save layout: " + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const vis  = sections.filter(s => s.vis).length;
  const imgs = sections.filter(s =>
    ["bg_img","promo_img","banner_img","artisan_img","img"].some(k => s.cfg?.[k]) ||
    (s.cfg?.slides || []).some(sl => sl.img)
  ).length;

  const KPI = [
    { l:"Total",       v:sections.length,         c:"#475569" },
    { l:"Visible",    v:vis,                     c:"#16a34a" },
    { l:"Hidden",     v:sections.length - vis,   c:"#94a3b8" },
    { l:"With Images", v:imgs,                    c:"#2563eb" },
  ];

    const MAIN_TABS = [
      { k:"sections",   l:"Sections",    I:Layout,      cnt:sections.length },
      { k:"guide",      l:"Image Guide", I:FolderOpen,  cnt:null },
    ];

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',-apple-system,sans-serif", background:"#f0f2f5", minHeight:"100vh", color:"#0f172a" }}>

      {/* ── TOP BAR ── */}
      <div className="hb-topbar" style={{ background:"#fff", borderBottom:"1.5px solid #e2e8f0", padding:"10px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, flexWrap:"wrap", position:"sticky", top:0, zIndex:40, boxShadow:"0 1px 6px rgba(0,0,0,.06)" }}>
        <div>
          <h2 className="hb-topbar-title" style={{ fontSize:".97rem", fontWeight:800, letterSpacing:"-.2px" }}>Homepage Builder</h2>
          <p className="hb-topbar-sub" style={{ fontSize:".67rem", color:"#94a3b8", marginTop:1 }}>
            Sections &middot; Images &middot; Text &middot; Buttons &middot; Products &middot; Categories &rarr;&nbsp;
            <code style={{ fontSize:".63rem", background:"#f1f5f9", padding:"1px 5px", borderRadius:4, color:"#7c3aed" }}>HomePage.jsx</code>
          </p>
        </div>
        <div className="hb-topbar-actions" style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
          {saved && (
            <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:".7rem", fontWeight:700, color:"#16a34a", background:"#dcfce7", padding:"5px 10px", borderRadius:7 }}>
              <Check size={11} /> Saved
            </span>
          )}
          {/* preview device */}
          <div className="hb-preview-switcher" style={{ display:"flex", border:"1.5px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
            {[[Monitor,"desktop"],[Tablet,"tablet"],[Smartphone,"mobile"]].map(([VI, v]) => (
              <button key={v} type="button"
                style={{ width:30, height:30, border:"none", background: preview === v ? "#f1f5f9" : "#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color: preview === v ? "#0f172a" : "#94a3b8" }}
                onClick={() => setPreview(v)}>
                <VI size={12} />
              </button>
            ))}
          </div>
          {mainTab === "sections" && (
            <button type="button" onClick={() => setAdding(true)}
              style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8, fontSize:".75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:"#fff", border:"1.5px solid #e2e8f0", color:"#475569" }}>
              <Plus size={12} color="#475569" /> <span className="hb-add-label">Add Section</span>
            </button>
          )}
          <button type="button" onClick={() => window.open('/?preview=true', '_blank')}
            style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8, fontSize:".75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:"#fff", border:"1.5px solid #e2e8f0", color:"#475569" }}>
            <ExternalLink size={12} /> Preview
          </button>
          <button type="button" onClick={doSave} disabled={loading}
            style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8, fontSize:".75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:"#E03E1A", color:"#fff", border:"none", opacity: loading ? 0.7 : 1 }}>
            {loading ? <RefreshCw size={12} color="#fff" className="spin" /> : <Save size={12} color="#fff" />} {loading ? "Saving..." : "Save Layout"}
          </button>
        </div>
      </div>

      {/* ── MAIN TABS ── */}
      <div className="hb-maintabs" style={{ display:"flex", background:"#fff", borderBottom:"1.5px solid #e2e8f0", padding:"0 20px", overflowX:"auto" }}>
        {MAIN_TABS.map(({ k, l, I, cnt }) => (
          <button key={k} type="button" className={`hb-maintab${mainTab === k ? " on" : ""}`}
            style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"11px 14px", border:"none", borderBottom:`2.5px solid ${mainTab === k ? "#E03E1A" : "transparent"}`, background:"transparent", fontSize:".77rem", fontWeight:700, color: mainTab === k ? "#E03E1A" : "#64748b", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", marginBottom:-1.5 }}
            onClick={() => setMainTab(k)}>
            <I size={12} /> <span className="tab-label">{l}</span>
            {cnt != null && <span style={{ background:"#fee2e2", color:"#E03E1A", fontSize:".59rem", fontWeight:800, padding:"1px 6px", borderRadius:9 }}>{cnt}</span>}
          </button>
        ))}
      </div>

      {/* ── BODY ── */}
      <div className="hb-body-wrap" style={{ padding:"15px 20px", display:"flex", flexDirection:"column", gap:13 }}>

        {mainTab === "sections" && (
          <>
            {initialLoading ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 18px", gap:12, textAlign:"center" }}>
                <RefreshCw size={28} color="#94a3b8" className="spin" />
                <p style={{ fontSize:".8rem", color:"#94a3b8", fontWeight:600 }}>Loading sections…</p>
              </div>
            ) : (<>
            {/* KPI row */}
            <div className="grid-containers">
              {KPI.map(({ l, v, c }, i) => (
                <div key={i} style={{ background:"#fff", borderRadius:10, border:"1.5px solid #e2e8f0", padding:"12px 14px" ,alignItems: "center",     gap: "20px"}}>
                  <div style={{ fontSize:"1.5rem", fontWeight:800, lineHeight:1, color:c }}>{v}</div>
                  <div style={{ fontSize:".62rem", fontWeight:600, color:"#94a3b8", marginTop:3, textTransform:"uppercase", letterSpacing:".4px" }}>{l}</div>
                </div>
              ))}
            </div>

            {/* section table */}
            <div style={{ background:"#fff", borderRadius:12, border:"1.5px solid #e2e8f0", overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px", borderBottom:"1.5px solid #f1f5f9", flexWrap:"wrap", gap:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <Layout size={13} color="#475569" />
                  <h3 style={{ fontSize:".82rem", fontWeight:800 }}>Homepage Layout</h3>
                  <span style={{ fontSize:".66rem", color:"#94a3b8", background:"#f1f5f9", padding:"2px 8px", borderRadius:5, fontWeight:600 }}>{sections.length} sections &middot; {vis} visible</span>
                </div>
                <span className="hb-layout-hint" style={{ fontSize:".67rem", color:"#94a3b8" }}>Edit &rarr; choose Images / Slides / Text / Buttons / Products tabs</span>
              </div>

              {/* table header */}
              <div className="thead">
                {["#","","","Section","Visibility","Updated","Actions"].map((h, i) => (
                  <span key={i} style={{ textAlign: i === 6 ? "right" : "left" }}>{h}</span>
                ))}
              </div>

              {sections.length === 0
                ? <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"44px 18px", gap:8, textAlign:"center" }}>
                    <Layout size={26} color="#e2e8f0" />
                    <h3 style={{ fontSize:".83rem", fontWeight:700, color:"#475569" }}>No sections yet</h3>
                    <p style={{ fontSize:".71rem", color:"#94a3b8", maxWidth:240, lineHeight:1.5 }}>Click &ldquo;Add Section&rdquo; to start building your homepage.</p>
                    <button type="button" onClick={() => setAdding(true)}
                      style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8, fontSize:".75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:"#fff", border:"1.5px solid #e2e8f0", color:"#475569", marginTop:6 }}>
                      <Plus size={12} /> Add Section
                    </button>
                  </div>
                : sections.map((sec, i) => (
                    <SecRow key={sec.id} sec={sec} idx={i} total={sections.length}
                      onUp={moveUp} onDown={moveDown} onToggle={toggle}
                      onEdit={setEditing} onDup={duplicate} onDel={setDelConf} />
                  ))
              }
            </div>
          </>)}
        </>
        )}

        {mainTab === "guide"      && <Guide />}
      </div>

      {/* ── MODALS ── */}
      {adding  && <AddModal onAdd={doAdd} onClose={() => setAdding(false)} />}
      {editing && <EditModal sec={editing} products={products} categories={categories} onSave={doEdit} onClose={() => setEditing(null)} />}

      {delConf && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:14, backdropFilter:"blur(2px)" }}
          onClick={() => setDelConf(null)}>
          <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:320, padding:"24px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:10, boxShadow:"0 28px 70px rgba(0,0,0,.24)", textAlign:"center" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width:46, height:46, borderRadius:12, background:"#fee2e2", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Trash2 size={18} color="#dc2626" />
            </div>
            <h3 style={{ fontSize:".88rem", fontWeight:800 }}>Remove Section?</h3>
            <p style={{ fontSize:".73rem", color:"#64748b", lineHeight:1.55, maxWidth:220 }}>This section will be permanently removed from the homepage layout.</p>
            <div style={{ display:"flex", gap:8, width:"100%", marginTop:2 }}>
              <button type="button" onClick={() => setDelConf(null)}
                style={{ flex:1, display:"inline-flex", alignItems:"center", justifyContent:"center", gap:5, padding:"7px", borderRadius:8, fontSize:".74rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:"transparent", border:"1.5px solid #e2e8f0", color:"#64748b" }}>
                Cancel
              </button>
              <button type="button" onClick={() => doDel(delConf)}
                style={{ flex:1, display:"inline-flex", alignItems:"center", justifyContent:"center", gap:5, padding:"7px", borderRadius:8, fontSize:".74rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:"#dc2626", color:"#fff", border:"none" }}>
                <Trash2 size={12} color="#fff" /> Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}