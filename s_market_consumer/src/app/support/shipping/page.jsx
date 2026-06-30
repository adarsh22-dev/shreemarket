export const metadata = { title: 'Shipping Info - SreeMarket' };

export default function ShippingPage() {
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Shipping Information</h1>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Delivery Options</h2>
      <ul style={{ color: '#666', lineHeight: 2, paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
        <li><strong>Standard Delivery:</strong> Free, 3-5 business days</li>
        <li><strong>Express Delivery:</strong> ₹15, 1-2 business days</li>
        <li><strong>Overnight:</strong> ₹35, next business day</li>
      </ul>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Shipping Areas</h2>
      <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '1.5rem' }}>We ship across India and to 45+ countries internationally. International shipping rates and delivery times vary by destination.</p>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Order Tracking</h2>
      <p style={{ color: '#666', lineHeight: 1.8 }}>Once shipped, you will receive a tracking number via email. Track your order through your account dashboard.</p>
    </div>
  );
}
