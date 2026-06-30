import { useEffect } from 'react';

export function WebsiteSeo() {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'seo-website';
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "SreeMarket",
      "url": window.location.origin,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${window.location.origin}/shop?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      },
      "description": "India's marketplace for authentic handmade products. Shop from verified artisans across pottery, textiles, jewellery, home decor & more."
    });
    document.head.appendChild(script);
    return () => { const s = document.getElementById('seo-website'); if (s) s.remove(); };
  }, []);
  return null;
}

export function OrganizationSeo() {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'seo-organization';
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "SreeMarket",
      "url": window.location.origin,
      "logo": `${window.location.origin}/logo.svg`,
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+91-XXX-XXX-XXXX",
        "contactType": "customer service"
      },
      "sameAs": [
        "https://facebook.com/sreemarket",
        "https://instagram.com/sreemarket"
      ]
    });
    document.head.appendChild(script);
    return () => { const s = document.getElementById('seo-organization'); if (s) s.remove(); };
  }, []);
  return null;
}

export function BreadcrumbSeo({ items }) {
  useEffect(() => {
    if (!items?.length) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'seo-breadcrumb';
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": item.name,
        "item": `${window.location.origin}${item.path}`
      }))
    });
    document.head.appendChild(script);
    return () => { const s = document.getElementById('seo-breadcrumb'); if (s) s.remove(); };
  }, [items]);
  return null;
}

export function ProductSeo({ product }) {
  useEffect(() => {
    if (!product) return;
    const imageUrl = product.media?.length
      ? (product.media[0].fileName?.startsWith('http') ? product.media[0].fileName : `${window.location.origin}/uploads/products/${product.media[0].fileName}`)
      : undefined;
    const price = product.discountPrice || product.regularPrice || 0;
    const currency = 'INR';
    const avail = product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'seo-product';
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": product.shortDescription || product.description || '',
      "image": imageUrl,
      "sku": product.sku || String(product.id),
      "mpn": String(product.id),
      "brand": {
        "@type": "Brand",
        "name": product.vendor?.storeName || 'SreeMarket'
      },
      "offers": {
        "@type": "Offer",
        "url": `${window.location.origin}/product/${product.id}`,
        "priceCurrency": currency,
        "price": price,
        "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "itemCondition": "https://schema.org/NewCondition",
        "availability": avail
      },
      "aggregateRating": product.averageRating ? {
        "@type": "AggregateRating",
        "ratingValue": product.averageRating,
        "reviewCount": product.reviewCount || 0,
        "bestRating": "5"
      } : undefined
    });
    document.head.appendChild(script);
    return () => { const s = document.getElementById('seo-product'); if (s) s.remove(); };
  }, [product]);
  return null;
}

export function MetaTags({ title, description, keywords }) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | SreeMarket` : 'SreeMarket - Authentic Indian Handmade Products';
    const desc = document.querySelector('meta[name="description"]');
    if (description && desc) desc.setAttribute('content', description);
    if (keywords) {
      let kw = document.querySelector('meta[name="keywords"]');
      if (!kw) { kw = document.createElement('meta'); kw.setAttribute('name', 'keywords'); document.head.appendChild(kw); }
      kw.setAttribute('content', keywords);
    }
    return () => { document.title = prev; };
  }, [title, description, keywords]);
  return null;
}
