export const metadata = { title: 'Terms of Service - SreeMarket' };

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Terms of Service</h1>
      <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '1.5rem' }}>By using SreeMarket, you agree to these terms and conditions. Please read them carefully.</p>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Account Responsibilities</h2>
      <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '1.5rem' }}>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Orders and Payments</h2>
      <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '1.5rem' }}>All prices are listed in INR. We reserve the right to modify prices. Payment is required at the time of order placement.</p>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Intellectual Property</h2>
      <p style={{ color: '#666', lineHeight: 1.8 }}>All content on SreeMarket, including images, text, and logos, is the property of SreeMarket and its vendors.</p>
    </div>
  );
}
