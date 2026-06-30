import Link from 'next/link';

export const metadata = {
  title: 'Wholesale - SreeMarket',
  description: 'Wholesale pricing for authentic Indian handmade products. Contact us for bulk orders.',
};

export default function WholesalePage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Wholesale Orders</h1>
      <p style={{ fontSize: '1.1rem', color: '#666', lineHeight: 1.8, marginBottom: '2rem' }}>
        Looking to stock authentic Indian handmade products in your store? SreeMarket offers competitive wholesale pricing with direct access to artisan cooperatives.
      </p>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Why Wholesale with SreeMarket?</h2>
      <ul style={{ color: '#666', lineHeight: 2, paddingLeft: '1.5rem', marginBottom: '2rem' }}>
        <li>Direct sourcing from 45+ artisan cooperatives</li>
        <li>Competitive bulk pricing</li>
        <li>Customizable product ranges</li>
        <li>Reliable supply chain across India</li>
        <li>Quality assurance on every order</li>
      </ul>
      <Link href="/support/contact" style={{ display: 'inline-block', padding: '12px 32px', backgroundColor: '#FF5722', color: 'white', borderRadius: '6px', fontWeight: 600, textDecoration: 'none' }}>
        Contact Us for Wholesale
      </Link>
    </div>
  );
}
