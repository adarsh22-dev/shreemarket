export default function ProductLoading() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div style={{ background: '#f0f0f0', borderRadius: '8px', height: '500px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div>
          <div style={{ height: '28px', width: '70%', background: '#f0f0f0', borderRadius: '4px', marginBottom: '1rem' }} />
          <div style={{ height: '20px', width: '40%', background: '#f0f0f0', borderRadius: '4px', marginBottom: '2rem' }} />
          <div style={{ height: '36px', width: '30%', background: '#f0f0f0', borderRadius: '4px', marginBottom: '2rem' }} />
          <div style={{ height: '100px', width: '100%', background: '#f0f0f0', borderRadius: '4px', marginBottom: '1.5rem' }} />
          <div style={{ height: '48px', width: '200px', background: '#f0f0f0', borderRadius: '6px' }} />
        </div>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
