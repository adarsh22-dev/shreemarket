import React, { useState } from 'react';
import './AdminBulkStock.css';
import { exportStockCsv, exportStockExcel, importStockFile } from '../../api/api';
import {
  Download, Upload, FileSpreadsheet, FileText, AlertCircle, CheckCircle, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminBulkStock = () => {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleExportCsv = async () => {
    try {
      const blob = await exportStockCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'stock_export.csv'; a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch { toast.error('Export failed'); }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await exportStockExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'stock_export.xlsx'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel exported');
    } catch { toast.error('Export failed'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const res = await importStockFile(file);
      setResult(res);
      toast.success(`Imported ${res.successCount} products`);
    } catch {
      toast.error('Import failed');
    } finally { setImporting(false); }
  };

  return (
    <div className="bs">
      <div className="bs-hdr">
        <div>
          <h1 className="bs-hdr__t"><Upload size={20} style={{ color: '#E03E1A' }} /> Bulk Stock Import/Export</h1>
          <p className="bs-hdr__s">Export current stock levels or import updates via CSV/Excel</p>
        </div>
      </div>

      <div className="bs-grid">
        <div className="bs-card">
          <h2 className="bs-card__ttl"><Download size={18} style={{ color: '#2563eb' }} /> Export Stock</h2>
          <p className="bs-card__sub">Download current inventory stock levels</p>
          <div className="flex" style={{ gap: 8 }}>
            <button className="bs-btn bs-btn--out" onClick={handleExportCsv}>
              <FileText size={15} /> Export CSV
            </button>
            <button className="bs-btn bs-btn--out" onClick={handleExportExcel}>
              <FileSpreadsheet size={15} /> Export Excel
            </button>
          </div>
        </div>

        <div className="bs-card">
          <h2 className="bs-card__ttl"><Upload size={18} style={{ color: '#16a34a' }} /> Import Stock</h2>
          <p className="bs-card__sub">Upload a CSV or Excel file with SKU and new stock quantities</p>
          <label className={`bs-upload${importing ? ' bs-upload--active' : ''}`}>
            <Upload size={18} />
            <span>{importing ? 'Importing...' : 'Choose File'}</span>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} style={{ display: 'none' }} disabled={importing} />
          </label>
          {result && (
            <div className="bs-result">
              <div className="bs-result__item bs-result__suc">
                <CheckCircle size={15} /> {result.successCount} products updated
              </div>
              {result.failCount > 0 && (
                <div className="bs-result__item bs-result__fail">
                  <AlertCircle size={15} /> {result.failCount} failed
                </div>
              )}
              {result.errors?.length > 0 && (
                <div className="bs-result__errs">
                  <ul>{result.errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bs-help">
        <p className="bs-help__ttl"><Info size={14} /> File Format Guide</p>
        <p className="bs-help__txt">The import file should have these columns:</p>
        <code className="bs-help__code">SKU, Product Name, Current Stock, Status</code>
        <p className="bs-help__note">Only the SKU and Current Stock columns are used for updates. Leave other columns as-is from the export.</p>
      </div>
    </div>
  );
};

export default AdminBulkStock;
