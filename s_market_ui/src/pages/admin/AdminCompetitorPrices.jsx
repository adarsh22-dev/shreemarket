import React, { useState } from 'react';
import { Search, TrendingDown, TrendingUp, BarChart3, Plus, Trash2 } from 'lucide-react';
import { getPriceComparison, addCompetitorPrice, deleteCompetitorPrice } from '../../api/api';
import toast from 'react-hot-toast';

const AdminCompetitorPrices = () => {
    const [productId, setProductId] = useState('');
    const [ourPrice, setOurPrice] = useState('');
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(false);
    const [newCompetitor, setNewCompetitor] = useState({ competitorName: '', price: '', productUrl: '', notes: '' });

    const fetchComparison = async () => {
        if (!productId) { toast.error('Enter a product ID'); return; }
        setLoading(true);
        try {
            const data = await getPriceComparison(productId, ourPrice || null);
            setComparison(data);
        } catch (err) {
            toast.error('Failed to fetch price comparison');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCompetitor = async () => {
        if (!newCompetitor.competitorName || !newCompetitor.price) {
            toast.error('Competitor name and price are required');
            return;
        }
        try {
            await addCompetitorPrice({
                productId: parseInt(productId),
                competitorName: newCompetitor.competitorName,
                price: parseFloat(newCompetitor.price),
                productUrl: newCompetitor.productUrl,
                notes: newCompetitor.notes
            });
            toast.success('Competitor added');
            setNewCompetitor({ competitorName: '', price: '', productUrl: '', notes: '' });
            fetchComparison();
        } catch (err) {
            toast.error('Failed to add competitor');
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteCompetitorPrice(id);
            toast.success('Competitor removed');
            fetchComparison();
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart3 size={22} /> Competitor Price Analysis
                </h1>
                <p style={{ margin: '0.5rem 0 0', color: '#8A7F75', fontSize: '0.85rem' }}>
                    Track and compare competitor pricing to stay competitive
                </p>
            </div>

            {/* Search */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#8A7F75', marginBottom: '0.3rem' }}>Product ID</label>
                    <input value={productId} onChange={e => setProductId(e.target.value)} placeholder="Enter product ID" style={{ padding: '0.75rem 1rem', border: '1px solid #E8DDD4', borderRadius: '8px', width: '200px', fontSize: '0.9rem' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#8A7F75', marginBottom: '0.3rem' }}>Our Price (optional)</label>
                    <input value={ourPrice} onChange={e => setOurPrice(e.target.value)} placeholder="e.g. 599" style={{ padding: '0.75rem 1rem', border: '1px solid #E8DDD4', borderRadius: '8px', width: '150px', fontSize: '0.9rem' }} />
                </div>
                <button onClick={fetchComparison} disabled={loading} style={{ padding: '0.75rem 2rem', background: '#FF5722', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                    {loading ? 'Loading...' : 'Analyze'}
                </button>
            </div>

            {comparison && (
                <>
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #eee' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8A7F75', marginBottom: '0.5rem' }}>AVERAGE COMPETITOR PRICE</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e' }}>₹{comparison.averageCompetitorPrice?.toFixed(2) || 'N/A'}</div>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #eee' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8A7F75', marginBottom: '0.5rem' }}>LOWEST PRICE</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>₹{comparison.lowestPrice?.toFixed(2) || 'N/A'}</div>
                            <div style={{ fontSize: '0.8rem', color: '#8A7F75' }}>by {comparison.lowestCompetitor}</div>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #eee' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8A7F75', marginBottom: '0.5rem' }}>PRICE ADVANTAGE</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: comparison.ourPriceAdvantage > 0 ? '#22c55e' : '#ef4444' }}>
                                {comparison.ourPriceAdvantage > 0 ? '+' : ''}{comparison.ourPriceAdvantage}%
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#8A7F75' }}>vs market average</div>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #eee' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8A7F75', marginBottom: '0.5rem' }}>COMPETITORS</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e' }}>{comparison.competitorCount}</div>
                        </div>
                    </div>

                    {/* Add Competitor Form */}
                    <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid #eee' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}><Plus size={16} /> Add Competitor Price</h3>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <input placeholder="Competitor name" value={newCompetitor.competitorName} onChange={e => setNewCompetitor({ ...newCompetitor, competitorName: e.target.value })} style={{ padding: '0.65rem 1rem', border: '1px solid #E8DDD4', borderRadius: '8px', flex: 1, minWidth: '150px', fontSize: '0.85rem' }} />
                            <input placeholder="Price" type="number" value={newCompetitor.price} onChange={e => setNewCompetitor({ ...newCompetitor, price: e.target.value })} style={{ padding: '0.65rem 1rem', border: '1px solid #E8DDD4', borderRadius: '8px', width: '120px', fontSize: '0.85rem' }} />
                            <input placeholder="Product URL" value={newCompetitor.productUrl} onChange={e => setNewCompetitor({ ...newCompetitor, productUrl: e.target.value })} style={{ padding: '0.65rem 1rem', border: '1px solid #E8DDD4', borderRadius: '8px', flex: 1, minWidth: '200px', fontSize: '0.85rem' }} />
                            <button onClick={handleAddCompetitor} style={{ padding: '0.65rem 1.2rem', background: '#FF5722', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Add</button>
                        </div>
                    </div>

                    {/* Competitors List */}
                    {comparison.competitors?.length > 0 && (
                        <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', border: '1px solid #eee' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f9f9f9', fontSize: '0.75rem', fontWeight: 600, color: '#8A7F75', textTransform: 'uppercase' }}>
                                        <th style={{ padding: '0.9rem 1rem', textAlign: 'left' }}>Competitor</th>
                                        <th style={{ padding: '0.9rem 1rem', textAlign: 'left' }}>Price</th>
                                        <th style={{ padding: '0.9rem 1rem', textAlign: 'left' }}>Status</th>
                                        <th style={{ padding: '0.9rem 1rem', textAlign: 'left' }}>Last Checked</th>
                                        <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparison.competitors.map((cp) => (
                                        <tr key={cp.id} style={{ borderTop: '1px solid #f0f0f0', fontSize: '0.9rem' }}>
                                            <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: '#1a1a2e' }}>{cp.competitorName}</td>
                                            <td style={{ padding: '0.9rem 1rem' }}>
                                                <span style={{ fontWeight: 700 }}>₹{cp.price?.toFixed(2)}</span>
                                                {comparison.ourPrice && cp.price && (
                                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: cp.price < comparison.ourPrice ? '#ef4444' : '#22c55e' }}>
                                                        {cp.price < comparison.ourPrice ? <TrendingDown size={14} style={{ verticalAlign: 'middle' }} /> : <TrendingUp size={14} style={{ verticalAlign: 'middle' }} />}
                                                        {Math.abs(((cp.price - comparison.ourPrice) / comparison.ourPrice) * 100).toFixed(1)}%
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.9rem 1rem' }}>
                                                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: cp.inStock ? '#dcfce7' : '#fef2f2', color: cp.inStock ? '#166534' : '#991b1b' }}>
                                                    {cp.inStock ? 'In Stock' : 'Out of Stock'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.9rem 1rem', color: '#8A7F75', fontSize: '0.8rem' }}>
                                                {cp.lastChecked ? new Date(cp.lastChecked).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                                                <button onClick={() => handleDelete(cp.id)} style={{ background: '#fef2f2', border: 'none', borderRadius: '6px', padding: '0.4rem 0.6rem', cursor: 'pointer' }}>
                                                    <Trash2 size={14} color="#ef4444" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminCompetitorPrices;
