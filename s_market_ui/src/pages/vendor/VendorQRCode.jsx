import React, { useState, useEffect } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import { API_BASE_URL, getVendorProducts } from '../../api/api';
import { QrCode, Download, Search, Loader2, RefreshCw } from 'lucide-react';
import './VendorQRCode.css';

const VendorQRCode = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const uid = user.userId;
            const data = await getVendorProducts(uid, { size: 100 });
            setProducts(data.content || []);
        } catch (err) {
            console.error('Failed to fetch products:', err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (productId) => {
        window.open(`${API_BASE_URL}/vendor/qr-codes/product/${productId}`, '_blank');
    };

    const productList = Array.isArray(products) ? products : [];
    const filteredProducts = productList.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <VendorLayout>
            <div className="vendor-qrcode">
                <div className="vqr-header">
                    <h1><QrCode size={24} /> Product QR Codes</h1>
                    <p className="vqr-subtitle">Generate QR codes for your products to use in offline stores or marketing</p>
                    <button className="vqr-refresh-btn" onClick={fetchProducts}><RefreshCw size={16} /> Refresh</button>
                </div>

                <div className="vqr-search-bar">
                    <Search size={18} />
                    <input type="text" placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>

                {loading ? (
                    <div className="vqr-loading"><Loader2 className="animate-spin" size={24} /> Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="vqr-empty"><QrCode size={48} /><h3>No products found</h3></div>
                ) : (
                    <div className="vqr-grid">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="vqr-card">
                                <div className="vqr-card-icon"><QrCode size={32} /></div>
                                <div className="vqr-card-info">
                                    <h3>{product.name}</h3>
                                    <p>SKU: {product.sku || 'N/A'} · {product.status}</p>
                                </div>
                                <button className="vqr-download-btn" onClick={() => handleDownload(product.id)}>
                                    <Download size={16} /> Download QR
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </VendorLayout>
    );
};

export default VendorQRCode;
