'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getVendorById } from '@/lib/api/client';
import { BACKEND_URL } from '@/lib/api/shared';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function VendorProfilePage() {
  const searchParams = useSearchParams();
  const vendorId = searchParams.get('id');
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vendorId) {
      getVendorById(vendorId)
        .then(data => setVendor(data))
        .catch(err => console.error('Failed to load vendor', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [vendorId]);

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        {loading ? (
          <p>Loading vendor profile...</p>
        ) : vendor ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
              {vendor.storeLogo && <img src={`${BACKEND_URL}${vendor.storeLogo}`} alt={vendor.storeName} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />}
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>{vendor.storeName || vendor.fullName}</h1>
                <p style={{ color: '#666' }}>{vendor.storeDescription || 'Verified SreeMarket vendor'}</p>
              </div>
            </div>
            <Link href={`/shop?vendor=${vendorId}`} style={{ display: 'inline-block', padding: '10px 24px', backgroundColor: '#FF5722', color: 'white', borderRadius: '6px', fontWeight: 500, textDecoration: 'none' }}>
              View Products
            </Link>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <h2>Vendor not found</h2>
            <Link href="/shop" style={{ color: '#FF5722', marginTop: '1rem', display: 'inline-block' }}>Browse Shop</Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
