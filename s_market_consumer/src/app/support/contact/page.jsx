export const metadata = { title: 'Contact Us - SreeMarket' };

export default function ContactPage() {
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Contact Us</h1>
      <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '2rem' }}>Have questions? We are here to help. Reach out to us through any of the following channels.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#666' }}>
        <p><strong>Email:</strong> support@sreemarket.com</p>
        <p><strong>Phone:</strong> +91 1234 567 890</p>
        <p><strong>Hours:</strong> Monday - Saturday, 9 AM - 6 PM IST</p>
        <p><strong>Address:</strong> SreeMarket HQ, Hyderabad, India</p>
      </div>
    </div>
  );
}
