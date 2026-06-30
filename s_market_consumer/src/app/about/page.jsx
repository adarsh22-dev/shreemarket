import Link from 'next/link';

export const metadata = {
  title: 'About - SreeMarket',
  description: 'About SreeMarket — a multi-vendor marketplace for authentic Indian handmade products.',
};

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>About SreeMarket</h1>
      <p style={{ fontSize: '1.1rem', color: '#666', lineHeight: 1.8, marginBottom: '2rem' }}>
        SreeMarket is a multi-vendor e-commerce platform dedicated to bringing authentic Indian handmade products to customers worldwide. We connect skilled artisans directly with conscious consumers who value quality craftsmanship.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '2rem', fontWeight: 700, color: '#FF5722' }}>45+</h3>
          <p style={{ color: '#666' }}>Partner Co-ops</p>
        </div>
        <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '2rem', fontWeight: 700, color: '#FF5722' }}>1000+</h3>
          <p style={{ color: '#666' }}>Artisan Partners</p>
        </div>
        <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '2rem', fontWeight: 700, color: '#FF5722' }}>5000+</h3>
          <p style={{ color: '#666' }}>Unique Products</p>
        </div>
      </div>
      <Link href="/shop" style={{ display: 'inline-block', padding: '12px 32px', backgroundColor: '#FF5722', color: 'white', borderRadius: '6px', fontWeight: 600, textDecoration: 'none' }}>
        Start Shopping
      </Link>
    </div>
  );
}
