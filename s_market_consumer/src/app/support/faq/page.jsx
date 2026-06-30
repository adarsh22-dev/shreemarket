export const metadata = { title: 'FAQ - SreeMarket' };

export default function FAQPage() {
  const faqs = [
    { q: 'How do I place an order?', a: 'Browse our products, add items to your cart, and proceed to checkout. You can pay using credit/debit cards, UPI, or cash on delivery.' },
    { q: 'Are all products handmade?', a: 'Yes, all products on SreeMarket are crafted by verified artisans from across India using traditional techniques.' },
    { q: 'What is your return policy?', a: 'We offer a 30-day return policy on most items. Visit our Returns page for more details.' },
    { q: 'Do you ship internationally?', a: 'Yes, we ship to 45+ countries. International shipping rates vary by destination.' },
    { q: 'How can I become a vendor?', a: 'Visit our Vendor Portal to apply. We review all applications to ensure quality standards are met.' },
    { q: 'How do I contact customer support?', a: 'Email us at support@sreemarket.com or call +91 1234 567 890 during business hours.' },
  ];

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Frequently Asked Questions</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {faqs.map((faq, i) => (
          <div key={i} style={{ borderBottom: '1px solid #E5E5E5', paddingBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{faq.q}</h3>
            <p style={{ color: '#666', lineHeight: 1.7 }}>{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
