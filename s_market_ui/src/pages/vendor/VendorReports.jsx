import React, { useState } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import { API_BASE_URL } from '../../api/api';
import { Download, FileText, Table, Package, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './VendorReports.css';

const VendorReports = () => {
    const [loadingUrl, setLoadingUrl] = useState(null);

    const reports = [
        {
            title: 'Orders Report',
            description: 'Export all your orders with customer details, amounts, and delivery info',
            icon: <FileText size={24} />,
            downloads: [
                { label: 'Download CSV', url: `${API_BASE_URL}/vendor/reports/orders/csv`, filename: 'orders.csv' },
                { label: 'Download Excel', url: `${API_BASE_URL}/vendor/reports/orders/excel`, filename: 'orders.xls' },
            ]
        },
        {
            title: 'Products Report',
            description: 'Export your product catalog with pricing, stock levels, and SKUs',
            icon: <Package size={24} />,
            downloads: [
                { label: 'Download CSV', url: `${API_BASE_URL}/vendor/reports/products/csv`, filename: 'products.csv' },
            ]
        }
    ];

    const handleDownload = async (url, filename) => {
        setLoadingUrl(url);
        try {
            const response = await fetch(url, { credentials: 'include' });
            if (!response.ok) {
                const err = await response.text().catch(() => '');
                throw new Error(err || `Export failed (${response.status})`);
            }
            const blob = await response.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
            toast.success(`${filename} downloaded`);
        } catch (error) {
            toast.error(error.message || 'Export failed');
        } finally {
            setLoadingUrl(null);
        }
    };

    return (
        <VendorLayout>
            <div className="vendor-reports">
                <div className="vr-header">
                    <h1><Download size={24} /> Exportable Reports</h1>
                    <p className="vr-subtitle">Download your business data as CSV or Excel files</p>
                </div>

                <div className="vr-grid">
                    {reports.map((report, idx) => (
                        <div key={idx} className="vr-card">
                            <div className="vr-card-icon">{report.icon}</div>
                            <h3>{report.title}</h3>
                            <p>{report.description}</p>
                            <div className="vr-download-actions">
                                {report.downloads.map((dl, i) => (
                                    <button key={i} className="vr-download-btn" onClick={() => handleDownload(dl.url, dl.filename)} disabled={loadingUrl === dl.url}>
                                        {loadingUrl === dl.url ? <Loader2 size={16} className="spinning-loader" /> : (i === 0 ? <FileText size={16} /> : <Table size={16} />)}
                                        {loadingUrl === dl.url ? 'Downloading…' : dl.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorReports;
