export const metadata = { title: 'Returns & Refunds - SreeMarket' };

export default function ReturnsPage() {
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Returns & Refunds</h1>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Return Policy</h2>
      <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '1.5rem' }}>We offer a 30-day return policy on most items. Products must be unused, in original packaging, and in the same condition as received.</p>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>How to Return</h2>
      <ol style={{ color: '#666', lineHeight: 2, paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
        <li>Go to your Orders page and select the item</li>
        <li>Click "Return" and provide a reason</li>
        <li>Upload photos if applicable</li>
        <li>Ship the item back using the provided label</li>
      </ol>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Refunds</h2>
      <p style={{ color: '#666', lineHeight: 1.8 }}>Refunds are processed within 5-7 business days after we receive the returned item. The amount will be credited to your original payment method.</p>
    </div>
  );
}
