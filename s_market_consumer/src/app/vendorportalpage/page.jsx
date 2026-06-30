'use client';

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function VendorPortalPage() {
  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Become a SreeMarket Vendor</h1>
        <p style={{ fontSize: '1.1rem', color: '#666', lineHeight: 1.8, marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Join our growing community of artisans and vendors. Reach thousands of customers who value authentic handmade products.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ padding: '1.5rem', background: '#fff5f2', borderRadius: '8px' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Low Commission</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Competitive rates that keep more money in your pocket</p>
          </div>
          <div style={{ padding: '1.5rem', background: '#fff5f2', borderRadius: '8px' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Easy Dashboard</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Manage products, orders, and analytics in one place</p>
          </div>
          <div style={{ padding: '1.5rem', background: '#fff5f2', borderRadius: '8px' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Wide Reach</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Access to customers across India and worldwide</p>
          </div>
        </div>
        <Link href="/register" style={{ display: 'inline-block', padding: '12px 32px', backgroundColor: '#FF5722', color: 'white', borderRadius: '6px', fontWeight: 600, textDecoration: 'none' }}>
          Apply as Vendor
        </Link>
      </div>
      <Footer />
    </div>
  );
}
