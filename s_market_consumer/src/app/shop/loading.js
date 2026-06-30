export default function ShopLoading() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ height: '32px', width: '200px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '2rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ background: '#f0f0f0', borderRadius: '8px', height: '320px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
