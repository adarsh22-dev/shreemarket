export const metadata = { title: 'Privacy Policy - SreeMarket' };

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Privacy Policy</h1>
      <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '1.5rem' }}>At SreeMarket, we are committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your personal information.</p>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Information We Collect</h2>
      <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '1.5rem' }}>We collect information you provide during registration, orders, and interactions with our platform, including name, email, phone, and shipping addresses.</p>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>How We Use Your Information</h2>
      <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '1.5rem' }}>Your information is used to process orders, improve our services, send relevant communications, and ensure platform security.</p>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Data Protection</h2>
      <p style={{ color: '#666', lineHeight: 1.8 }}>We use 256-bit SSL encryption and follow industry best practices to protect your data. We never sell your personal information to third parties.</p>
    </div>
  );
}
