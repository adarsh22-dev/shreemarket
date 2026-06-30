import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    ChevronDown,
    Filter,
    Trash2,
    RefreshCw,
    Edit2,
    Copy,
    ChevronLeft,
    ChevronRight,
    Upload,
    FileText,
    Download,
    Package,
    Eye,
    GitCompare,
    Loader2,
    X,
    ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VendorLayout from '../../components/vendor/VendorLayout';
import './VendorProducts.css';
import { getVendorProducts, getVendorById, getUserDetails, BACKEND_URL, deleteProduct, deleteProductsBulk, bulkUploadProducts, updateProduct, updateProductsStockBulk, bulkEditProducts, PLACEHOLDER_IMG, getCategories } from '../../api/api';
import toast from 'react-hot-toast';
import ViewProduct, { ViewProductModal } from './ViewProduct';
import * as XLSX from 'xlsx';

// Bulk Edit Modal Component
const BulkEditModal = ({ products, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [editMode, setEditMode] = useState('individual'); // 'individual' or 'bulk'
    const [productEdits, setProductEdits] = useState({});
    const [saving, setSaving] = useState(false);

    // Initialize product edits
    useState(() => {
        const edits = {};
        products.forEach(p => {
            edits[p.id] = {
                name: p.name || '',
                shortDescription: p.shortDescription || '',
                description: p.description || '',
                category: p.category || '',
                brand: p.brand || '',
                regularPrice: p.regularPrice || '',
                discountPrice: p.discountPrice || '',
                initialStock: p.initialStock || '',
                status: p.status || 'in',
                sku: p.sku || '',
            };
        });
        setProductEdits(edits);
    });

    const handleFieldChange = (productId, field, value) => {
        setProductEdits(prev => ({
            ...prev,
            [productId]: { ...prev[productId], [field]: value }
        }));
    };

    const handleBulkFieldChange = (field, value) => {
        const updated = { ...productEdits };
        Object.keys(updated).forEach(id => {
            updated[id] = { ...updated[id], [field]: value };
        });
        setProductEdits(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        const updatedProducts = Object.entries(productEdits).map(([id, fields]) => ({
            id: parseInt(id),
            ...fields,
            regularPrice: parseFloat(fields.regularPrice) || 0,
            discountPrice: parseFloat(fields.discountPrice) || null,
            initialStock: parseInt(fields.initialStock) || 0,
        }));
        await onSave(updatedProducts);
        setSaving(false);
    };

    const fields = [
        { key: 'name', label: 'Product Title', type: 'text', required: true },
        { key: 'shortDescription', label: 'Short Description', type: 'textarea' },
        { key: 'description', label: 'Full Description', type: 'textarea' },
        { key: 'category', label: 'Category', type: 'text' },
        { key: 'brand', label: 'Brand', type: 'text' },
        { key: 'sku', label: 'SKU', type: 'text' },
        { key: 'regularPrice', label: 'Regular Price', type: 'number' },
        { key: 'discountPrice', label: 'Discount Price', type: 'number' },
        { key: 'initialStock', label: 'Stock Quantity', type: 'number' },
        { key: 'status', label: 'Status', type: 'select', options: [{ value: 'in', label: 'In Stock' }, { value: 'low', label: 'Low Stock' }, { value: 'out', label: 'Out of Stock' }, { value: 'draft', label: 'Draft' }] },
    ];

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '1000px', maxHeight: '90vh', width: '95%' }}>
                <div className="modal-header">
                    <h3>Bulk Edit ({products.length} products)</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={() => setEditMode('individual')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: 'none',
                                background: editMode === 'individual' ? '#FF5722' : '#f1f5f9',
                                color: editMode === 'individual' ? 'white' : '#64748b',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Individual Edit
                        </button>
                        <button
                            onClick={() => setEditMode('bulk')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: 'none',
                                background: editMode === 'bulk' ? '#FF5722' : '#f1f5f9',
                                color: editMode === 'bulk' ? 'white' : '#64748b',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Bulk Edit
                        </button>
                        <button className="modal-close-btn" onClick={onClose}>&times;</button>
                    </div>
                </div>

                <div className="modal-body" style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 130px)', padding: '20px' }}>
                    {editMode === 'individual' ? (
                        <>
                            {/* Product Tabs */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
                                {products.map((product, index) => (
                                    <button
                                        key={product.id}
                                        onClick={() => setActiveTab(index)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 14px',
                                            borderRadius: '10px',
                                            border: activeTab === index ? '2px solid #FF5722' : '1px solid #e2e8f0',
                                            background: activeTab === index ? '#FFF3E0' : 'white',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            minWidth: '120px'
                                        }}
                                    >
                                    {(() => {
                                        const thumb = product.media?.find(m => m.mediaType !== 'manufacturer') || product.media?.[0];
                                        return (
                                            <img
                                                 src={thumb?.fileName ? `${BACKEND_URL}/uploads/products/${thumb.fileName}` : PLACEHOLDER_IMG}
                                                alt={product.name}
                                                style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain', background: 'white' }}
                                            />
                                        );
                                    })()}
                                        <span style={{ fontSize: '0.82rem', fontWeight: activeTab === index ? 600 : 400, color: activeTab === index ? '#FF5722' : '#64748b' }}>
                                            {product.name?.substring(0, 15)}{product.name?.length > 15 ? '...' : ''}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Product Fields */}
                            {products[activeTab] && productEdits[products[activeTab].id] && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {fields.map(field => (
                                        <div key={field.key} style={{ gridColumn: field.type === 'textarea' ? '1 / -1' : 'auto' }}>
                                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {field.label}
                                            </label>
                                            {field.type === 'textarea' ? (
                                                <textarea
                                                    value={productEdits[products[activeTab].id][field.key]}
                                                    onChange={(e) => handleFieldChange(products[activeTab].id, field.key, e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px 12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e2e8f0',
                                                        fontSize: '0.9rem',
                                                        minHeight: '80px',
                                                        resize: 'vertical',
                                                        fontFamily: 'inherit'
                                                    }}
                                                />
                                            ) : field.type === 'select' ? (
                                                <select
                                                    value={productEdits[products[activeTab].id][field.key]}
                                                    onChange={(e) => handleFieldChange(products[activeTab].id, field.key, e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px 12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e2e8f0',
                                                        fontSize: '0.9rem',
                                                        background: 'white'
                                                    }}
                                                >
                                                    {field.options.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type={field.type}
                                                    value={productEdits[products[activeTab].id][field.key]}
                                                    onChange={(e) => handleFieldChange(products[activeTab].id, field.key, e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px 12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e2e8f0',
                                                        fontSize: '0.9rem'
                                                    }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Bulk Edit Mode */}
                            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '20px' }}>
                                Changes below will apply to all {products.length} selected products. Leave fields empty to keep original values.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                {fields.filter(f => f.key !== 'name').map(field => (
                                    <div key={field.key} style={{ gridColumn: field.type === 'textarea' ? '1 / -1' : 'auto' }}>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {field.label}
                                        </label>
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                value={productEdits[Object.keys(productEdits)[0]]?.[field.key] || ''}
                                                onChange={(e) => handleBulkFieldChange(field.key, e.target.value)}
                                                placeholder={`Update ${field.label.toLowerCase()} for all products`}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e2e8f0',
                                                    fontSize: '0.9rem',
                                                    minHeight: '80px',
                                                    resize: 'vertical',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        ) : field.type === 'select' ? (
                                            <select
                                                value={productEdits[Object.keys(productEdits)[0]]?.[field.key] || ''}
                                                onChange={(e) => handleBulkFieldChange(field.key, e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e2e8f0',
                                                    fontSize: '0.9rem',
                                                    background: 'white'
                                                }}
                                            >
                                                <option value="">Keep original</option>
                                                {field.options.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type={field.type}
                                                value={productEdits[Object.keys(productEdits)[0]]?.[field.key] || ''}
                                                onChange={(e) => handleBulkFieldChange(field.key, e.target.value)}
                                                placeholder={`Update ${field.label.toLowerCase()} for all products`}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e2e8f0',
                                                    fontSize: '0.9rem'
                                                }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-confirm-edit" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : `Save Changes`}
                    </button>
                </div>
            </div>
        </div>
    );
};

const VendorProducts = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [size] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All Categories');
    const [status, setStatus] = useState('All Status');
    const [vendorId, setVendorId] = useState(null);
    const [categoryOptions, setCategoryOptions] = useState(['All Categories', 'grocery', 'health', 'home', 'beauty', 'clothing', 'toys', 'patio', 'musical']);

    // Instagram story modal state
    const [storyProduct, setStoryProduct] = useState(null);
    const [storyPostIndex, setStoryPostIndex] = useState(0);

    const extractShortcode = (url) => {
        if (!url) return null;
        const match = url.match(/(?:instagram\.com\/p\/|instagram\.com\/reel\/)([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    };

    const isInstagramReel = (url) => url && url.includes('/reel/');

    const getInstagramEmbedUrl = (url) => {
        const shortcode = extractShortcode(url);
        if (!shortcode) return null;
        const base = isInstagramReel(url) ? 'reel' : 'p';
        return `https://www.instagram.com/${base}/${shortcode}/embed/${isInstagramReel(url) ? '?autoplay=1' : ''}`;
    };

    const getProductPrimaryImage = (product) => {
        if (!product?.media?.length) return PLACEHOLDER_IMG;
        const primary = product.media.find(m => m.isPrimary) || product.media[0];
        if (!primary?.fileName) return PLACEHOLDER_IMG;
        if (primary.fileName.startsWith('http://') || primary.fileName.startsWith('https://')) return primary.fileName;
        return `${BACKEND_URL}/uploads/products/${primary.fileName}`;
    };

    const getInstaThumbnail = (product) => {
        const instaMedia = product?.media?.find(m => m.fileType === 'instagram-url' && m.fileName);
        if (!instaMedia?.fileName) return getProductPrimaryImage(product);
        if (instaMedia.customThumbnail) return `${BACKEND_URL}/uploads/products/${instaMedia.customThumbnail}`;
        return getProductPrimaryImage(product);
    };

    const instaProducts = products.filter(p => p?.media?.some(m => m.fileType === 'instagram-url'));

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Multi-Selection State
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [isBulkDelete, setIsBulkDelete] = useState(false);
    const [isBulkStockUpdate, setIsBulkStockUpdate] = useState(false);

    // Bulk Edit State
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [isBulkEditing, setIsBulkEditing] = useState(false);
    const [bulkEditFields, setBulkEditFields] = useState({
        category: '', subCategory: '', brand: '', status: '',
        regularPrice: '', discountPrice: '', initialStock: ''
    });
    const [bulkEditEnabled, setBulkEditEnabled] = useState({
        category: false, subCategory: false, brand: false, status: false,
        regularPrice: false, discountPrice: false, initialStock: false
    });

    // Bulk Upload State
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Stock Update Modal State
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [productToUpdateStock, setProductToUpdateStock] = useState(null);
    const [newStockCount, setNewStockCount] = useState('');
    const [isUpdatingStock, setIsUpdatingStock] = useState(false);

    // Linked Products Modal State
    const [isLinkedProductsModalOpen, setIsLinkedProductsModalOpen] = useState(false);
    const [productForLinking, setProductForLinking] = useState(null);
    const [linkType, setLinkType] = useState('UPSELL'); // UPSELL, CROSS_SELL, BOUGHT_TOGETHER
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedLinkProducts, setSelectedLinkProducts] = useState({}); // Changed to object keyed by link type
    const [isSearching, setIsSearching] = useState(false);

    // View Product Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [productToView, setProductToView] = useState(null);

    // Fetch vendor ID on mount
    useEffect(() => {
        const initVendorInfo = async () => {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData.userId) {
                try {
                    // For vendor accounts (roleId 3), use the vendors endpoint
                    if (userData.roleId === 3) {
                        const vendorDetails = await getVendorById(userData.userId);
                        setVendorId(vendorDetails.id);
                    } else {
                        const userDetails = await getUserDetails(userData.userId);
                        setVendorId(userDetails.id);
                    }
                } catch (error) {
                    console.error("Failed to fetch user/vendor details:", error);
                    // Fallback to local storage id if API fails
                    setVendorId(userData.userId);
                }
            } else {
                setLoading(false);
                console.error("No user session found. Please log in as a vendor.");
            }
        };
        initVendorInfo();
        getCategories().then(data => {
            if (Array.isArray(data) && data.length) {
                const names = data.map(c => c.name || c.categoryName || c.slug || c).filter(Boolean);
                setCategoryOptions(['All Categories', ...names]);
            }
        }).catch(() => {});
    }, []);

    const fetchProducts = async () => {
        if (!vendorId) return; // Wait until vendorId is fetched

        setLoading(true);
        try {
            const queryParams = {
                page: page,
                size: size,
                sort: 'id,desc'
            };

            if (search) queryParams.search = search;
            if (category && category !== 'All Categories') queryParams.category = category;
            if (status && status !== 'All Status') queryParams.status = status;

            const data = await getVendorProducts(vendorId, queryParams);
            setProducts(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (vendorId) {
            fetchProducts();
        }
    }, [page, size, search, category, status, vendorId]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(0); // Reset to first page
    };

    const handleCategoryChange = (e) => {
        setCategory(e.target.value);
        setPage(0); // Reset to first page
    };

    const handleStatusChange = (e) => {
        setStatus(e.target.value);
        setPage(0); // Reset to first page
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
        }
    };

    const handleDeleteProduct = (product) => {
        setIsBulkDelete(false);
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    const handleBulkDeleteInitiate = () => {
        if (selectedProductIds.length === 0) {
            toast.error("Please select at least one product to delete");
            return;
        }
        setIsBulkDelete(true);
        setIsBulkStockUpdate(false);
        setIsDeleteModalOpen(true);
    };

    const handleBulkStockUpdateInitiate = () => {
        if (selectedProductIds.length === 0) {
            toast.error("Please select at least one product to update stock");
            return;
        }
        setIsBulkStockUpdate(true);
        setNewStockCount('');
        setProductToUpdateStock(null);
        setIsStockModalOpen(true);
    };

    const handleToggleAll = () => {
        if (selectedProductIds.length === products.length) {
            setSelectedProductIds([]);
        } else {
            setSelectedProductIds(products.map(p => p.id));
        }
    };

    const handleToggleProduct = (productId) => {
        setSelectedProductIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            if (isBulkDelete) {
                await deleteProductsBulk(selectedProductIds);
                toast.success(`${selectedProductIds.length} products deleted successfully`);
                setSelectedProductIds([]);
            } else {
                if (!productToDelete) return;
                await deleteProduct(productToDelete.id);
                toast.success("Product deleted successfully");
                // Remove from selection if it was selected
                setSelectedProductIds(prev => prev.filter(id => id !== productToDelete.id));
            }

            setIsDeleteModalOpen(false);
            setProductToDelete(null);
            fetchProducts(); // Refresh the list
        } catch (error) {
            console.error("Failed to delete product(s):", error);
            toast.error("Failed to delete selected items. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkUpload = async () => {
        if (!uploadFile) {
            toast.error("Please select a CSV file first");
            return;
        }

        setIsUploading(true);
        try {
            const response = await bulkUploadProducts(uploadFile, vendorId);
            toast.success(response.message);
            setIsBulkUploadModalOpen(false);
            setUploadFile(null);
            fetchProducts(); // Refresh the list
        } catch (error) {
            console.error("Bulk upload failed:", error);
            toast.error(error.message || "Bulk upload failed. Please check your CSV format.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdateStock = (product) => {
        setProductToUpdateStock(product);
        setNewStockCount(product.initialStock ?? 0);
        setIsStockModalOpen(true);
    };

    const handleViewProduct = (product) => {
        setProductToView(product);
        setIsViewModalOpen(true);
    };

    const confirmUpdateStock = async () => {
        setIsUpdatingStock(true);
        try {
            if (isBulkStockUpdate) {
                if (selectedProductIds.length === 0) return;
                await updateProductsStockBulk(selectedProductIds, parseInt(newStockCount, 10));
                toast.success(`${selectedProductIds.length} products stock updated successfully`);
                setSelectedProductIds([]);
            } else {
                if (!productToUpdateStock) return;
                await updateProductsStockBulk([productToUpdateStock.id], parseInt(newStockCount, 10));
                toast.success("Stock updated successfully");
            }

            setIsStockModalOpen(false);
            setProductToUpdateStock(null);
            setIsBulkStockUpdate(false);
            fetchProducts(); // Refresh the list
        } catch (error) {
            console.error("Failed to update stock:", error);
            toast.error("Failed to update stock. Please try again.");
        } finally {
            setIsUpdatingStock(false);
        }
    };

    // Generates a sample CSV template for vendors to use as a reference when bulk uploading products
    const downloadSampleCSV = () => {
        const headers = "Name,SKU,Category,Price,Stock,ShortDescription\n";
        const sampleRows = "Organic Apple,APP-001,grocery,120,50,Fresh organic red apples\n" +
            "Cotton T-Shirt,TSH-002,clothing,599,100,Premium 100% cotton t-shirt";
        const csvContent = "data:text/csv;charset=utf-8," + headers + sampleRows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "product_upload_sample.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ── Bulk Export ──────────────────────────────────────────────────
    const getFormattedDate = () => new Date().toISOString().slice(0, 10);

    const buildExportData = (items) => items.map(p => ({
        'Name': p.name || '',
        'SKU': p.sku || '',
        'Category': p.category || '',
        'Sub-Category': p.subCategory || '',
        'Brand': p.brand || '',
        'Status': p.status === 'in' ? 'In Stock' : p.status === 'low' ? 'Low Stock' : p.status === 'out' ? 'Out of Stock' : p.status || '',
        'Regular Price': p.regularPrice ?? '',
        'Discount Price': p.discountPrice ?? '',
        'Stock': p.initialStock ?? 0,
        'Short Description': p.shortDescription || '',
    }));

    const handleExportSelected = () => {
        if (selectedProductIds.length === 0) {
            toast.error("Please select at least one product to export");
            return;
        }
        const selected = products.filter(p => selectedProductIds.includes(p.id));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildExportData(selected)), 'Products');
        XLSX.writeFile(wb, `Products_Selected_${getFormattedDate()}.xlsx`);
        toast.success(`Exported ${selected.length} products`);
    };

    const handleExportAll = () => {
        if (products.length === 0) {
            toast.error("No products to export");
            return;
        }
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildExportData(products)), 'Products');
        XLSX.writeFile(wb, `Products_All_${getFormattedDate()}.xlsx`);
        toast.success(`Exported ${products.length} products`);
    };

    // ── Bulk Edit ────────────────────────────────────────────────────
    const handleBulkEditInitiate = () => {
        if (selectedProductIds.length === 0) {
            toast.error("Please select at least one product to edit");
            return;
        }
        setBulkEditFields({ category: '', subCategory: '', brand: '', status: '', regularPrice: '', discountPrice: '', initialStock: '' });
        setBulkEditEnabled({ category: false, subCategory: false, brand: false, status: false, regularPrice: false, discountPrice: false, initialStock: false });
        setIsBulkEditModalOpen(true);
    };

    const handleBulkEditFieldChange = (field, value) => {
        setBulkEditFields(prev => ({ ...prev, [field]: value }));
    };

    const handleBulkEditToggle = (field) => {
        setBulkEditEnabled(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const confirmBulkEdit = async () => {
        const fieldsToUpdate = {};
        Object.keys(bulkEditEnabled).forEach(field => {
            if (bulkEditEnabled[field] && bulkEditFields[field] !== '') {
                if (['regularPrice', 'discountPrice', 'initialStock'].includes(field)) {
                    fieldsToUpdate[field] = parseFloat(bulkEditFields[field]) || 0;
                } else {
                    fieldsToUpdate[field] = bulkEditFields[field];
                }
            }
        });

        if (Object.keys(fieldsToUpdate).length === 0) {
            toast.error("Please enable and fill at least one field to update");
            return;
        }

        setIsBulkEditing(true);
        try {
            await bulkEditProducts(selectedProductIds, fieldsToUpdate);
            toast.success(`${selectedProductIds.length} products updated successfully`);
            setSelectedProductIds([]);
            setIsBulkEditModalOpen(false);
            fetchProducts();
        } catch (error) {
            console.error("Bulk edit failed:", error);
            toast.error(error.message || "Bulk edit failed. Please try again.");
        } finally {
            setIsBulkEditing(false);
        }
    };

    const getStockBadgeClass = (product) => {
        const qty = product.initialStock;
        if (qty != null) {
            if (qty === 0) return 'stock-out';
            if (qty <= 5) return 'stock-low';
            return 'stock-in';
        }
        // Fallback to status field
        if (product.status === 'out') return 'stock-out';
        if (product.status === 'low') return 'stock-low';
        if (product.status === 'in') return 'stock-in';
        return 'stock-out';
    };

    const getStockText = (product) => {
        const qty = product.initialStock ?? 0;
        if (qty === 0) return 'Out of Stock (0)';
        if (qty <= 5) return `Low Stock (${qty})`;
        return `In Stock (${qty})`;
    };

    return (
        <VendorLayout>
            <div className="vendor-products-container">
                {/* Header Actions */}
                <div className="products-header-row">
                    <div>
                        <h1>Product Management</h1>
                        <p>Manage your inventory, stock levels, and product details.</p>
                    </div>
                    <div className="header-actions-group">
                        <button className="btn-bulk-upload" onClick={() => setIsBulkUploadModalOpen(true)}>
                            <Upload size={18} />
                            Bulk Upload
                        </button>
                        <button className="btn-add-product" onClick={() => navigate('/vendor/products/add')}>
                            <Plus size={18} />
                            Add New Product
                        </button>
                    </div>
                </div>

                {/* Instagram Story Circles */}
                {instaProducts.length > 0 && (
                <div className="vendor-insta-stories">
                    <div className="vendor-insta-stories-scroll">
                        {instaProducts.map(product => (
                                <div key={product.id} className="story-circle active" onClick={() => { setStoryProduct(product); setStoryPostIndex(0); }}>
                                    <img
                                        src={getInstaThumbnail(product)}
                                        alt={product.name}
                                        className="story-image"
                                        onError={(e) => { e.target.style.display = 'none'; const fb = e.target.nextElementSibling; if (fb) fb.style.display = 'flex'; }}
                                    />
                                    <div className="story-placeholder" style={{ display: 'none' }}>
                                        <Loader2 size={24} />
                                    </div>
                                    <div className="story-ring"></div>
                                </div>
                        ))}
                    </div>
                </div>
                )}

                {/* Filter Bar */}
                <div className="filter-bar">
                    <div className="search-input-wrapper">
                        <Search size={18} color="#888" />
                        <input
                            type="text"
                            placeholder="Search products by name or SKU..."
                            value={search}
                            onChange={handleSearchChange}
                        />
                    </div>

                    <div className="filter-dropdown-container">
                        <select className="filter-dropdown-select" value={category} onChange={handleCategoryChange}>
                            {categoryOptions.map(cat => (
                                <option key={cat} value={cat}>{cat === 'All Categories' ? cat : cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ')}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} color="#666" className="dropdown-icon" />
                    </div>

                    <div className="filter-dropdown-container">
                        <select className="filter-dropdown-select" value={status} onChange={handleStatusChange}>
                            <option value="All Status">All Status</option>
                            <option value="in">In Stock</option>
                            <option value="low">Low Stock</option>
                            <option value="out">Out of Stock</option>
                        </select>
                        <ChevronDown size={16} color="#666" className="dropdown-icon" />
                    </div>
                </div>

                {/* Bulk Actions */}
                <div className="bulk-actions-bar">
                    <div className="bulk-actions-left">
                        <label className="select-all-wrapper">
                            <input
                                type="checkbox"
                                className="checkbox-custom"
                                checked={products.length > 0 && selectedProductIds.length === products.length}
                                onChange={handleToggleAll}
                            />
                            <span style={{ fontStyle: 'italic', color: '#888' }}>Select All</span>
                        </label>
                        <button
                            className={`action-text-btn ${selectedProductIds.length === 0 ? 'disabled' : ''}`}
                            onClick={handleBulkDeleteInitiate}
                            disabled={selectedProductIds.length === 0}
                        >
                            <Trash2 size={16} /> Delete Selected ({selectedProductIds.length})
                        </button>
                        <button
                            className={`action-text-btn ${selectedProductIds.length === 0 ? 'disabled' : ''}`}
                            onClick={handleBulkStockUpdateInitiate}
                            disabled={selectedProductIds.length === 0}
                        >
                            <RefreshCw size={16} /> Update Stock ({selectedProductIds.length})
                        </button>
                        <button
                            className={`action-text-btn ${selectedProductIds.length === 0 ? 'disabled' : ''}`}
                            onClick={handleBulkEditInitiate}
                            disabled={selectedProductIds.length === 0}
                        >
                            <Edit2 size={16} /> Bulk Edit ({selectedProductIds.length})
                        </button>
                        <button
                            className={`action-text-btn ${selectedProductIds.length === 0 ? 'disabled' : ''}`}
                            onClick={handleExportSelected}
                            disabled={selectedProductIds.length === 0}
                        >
                            <Download size={16} /> Export Selected
                        </button>
                        <button
                            className="action-text-btn"
                            onClick={handleExportAll}
                        >
                            <Download size={16} /> Export All
                        </button>
                    </div>
                    <div className="showing-text">
                        Showing {totalElements === 0 ? 0 : (page * size) + 1}-{Math.min((page + 1) * size, totalElements)} of {totalElements} products
                    </div>
                </div>

                {/* Data Table Area */}
                <div className="products-table-wrapper">
                    <table className="products-data-table">
                        <thead><tr><th style={{ width: '40px' }}>{/* Checkbox column */}</th><th>PRODUCT INFO</th><th>SKU</th><th>CATEGORY</th><th>PRICE</th><th>STOCK STATUS</th><th>RATING</th><th style={{ textAlign: 'right' }}>ACTIONS</th></tr></thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}><td>
                                    <input
                                        type="checkbox"
                                        className="checkbox-custom"
                                        checked={selectedProductIds.includes(product.id)}
                                        onChange={() => handleToggleProduct(product.id)}
                                    />
                                </td><td>
                                        <div className="product-info-cell">
                                            {(() => {
                                                const thumb = product.media?.find(m => m.mediaType !== 'manufacturer') || product.media?.[0];
                                                return (
                                                    <img
                                                        src={thumb?.fileName ? `${BACKEND_URL}/uploads/products/${thumb.fileName}` : PLACEHOLDER_IMG}
                                                        alt={product.name}
                                                        className="product-image"
                                                    />
                                                );
                                            })()}
                                            <div className="product-details">
                                                <div className="product-name">{product.name}</div>
                                                <div className="product-desc">{product.shortDescription || product.description || 'No description available'}</div>
                                            </div>
                                        </div>
                                    </td><td>
                                        <div className="sku-text">{product.sku}</div>
                                    </td><td>
                                        <span className="category-badge">{product.category}</span>
                                    </td><td>
                                        <div className="price-text">₹{product.regularPrice || product.discountPrice || '0.00'}</div>
                                    </td><td>
                                        {(() => {
                                            const qty = product.initialStock != null ? product.initialStock : 0;
                                            let badgeClass = 'stock-in';
                                            let label = `In Stock (${qty})`;
                                            if (qty === 0) {
                                                badgeClass = 'stock-out';
                                                label = 'Out of Stock (0)';
                                            } else if (qty <= 5) {
                                                badgeClass = 'stock-low';
                                                label = `Low Stock (${qty})`;
                                            }
                                            return (
                                                <span className={` ${badgeClass}`}>
                                                    {label}
                                                </span>
                                            );
                                        })()}
                                    </td><td>
                                        <div className="rating-text" style={{ color: '#FFB800' }}>
                                            ★ {(product.averageRating || 0).toFixed(1)} <span style={{ color: '#888', fontSize: '11px' }}>({product.reviewCount || 0})</span>
                                        </div>
                                    </td><td>
<div className="row-actions">
     <button className="row-action-btn" onClick={() => handleViewProduct(product)} title="View Product"><Eye size={16} /></button>
     <button className="row-action-btn" onClick={() => navigate(`/vendor/products/edit/${product.id}`)} title="Edit Product"><Edit2 size={16} /></button>
     <button className="row-action-btn" onClick={() => handleUpdateStock(product)} title="Update Stock"><Package size={16} /></button>
     <button className="row-action-btn" onClick={() => {
        setProductForLinking(product);
        setLinkType('UPSELL');
        setSearchQuery('');
        setSearchResults([]);
        setSelectedLinkProducts({});
        setIsLinkedProductsModalOpen(true);
     }} title="Manage Linked Products"><GitCompare size={16} /></button>
     <button className="row-action-btn" onClick={() => handleDeleteProduct(product)} title="Delete Product"><Trash2 size={16} /></button>
 </div>
                                    </td></tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="pagination-row">
                        <div className="pagination-text">
                            Showing <span style={{ fontWeight: 700, color: '#111' }}>{totalElements === 0 ? 0 : (page * size) + 1}</span> to <span style={{ fontWeight: 700, color: '#111' }}>{Math.min((page + 1) * size, totalElements)}</span> of <span style={{ fontWeight: 700, color: '#111' }}>{totalElements}</span> results
                        </div>
                        <div className="pagination-controls">
                            <button
                                className="page-btn"
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 0}>
                                <ChevronLeft size={16} />
                            </button>

                            {[...Array(totalPages)].map((_, index) => {
                                // Simple pagination logic for demo, showing all pages
                                return (
                                    <button
                                        key={index}
                                        className={`page-btn ${page === index ? 'active' : ''}`}
                                        onClick={() => handlePageChange(index)}
                                    >
                                        {index + 1}
                                    </button>
                                );
                            })}

                            <button
                                className="page-btn"
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= totalPages - 1}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && (
                    <div className="modal-overlay">
                        <div className="delete-modal-box">
                            <div className="delete-modal-icon">
                                <Trash2 size={32} />
                            </div>
                            <h2>{isBulkDelete ? 'Delete Products?' : 'Delete Product?'}</h2>
                            <p>
                                {isBulkDelete
                                    ? `Are you sure you want to delete ${selectedProductIds.length} selected products?`
                                    : <>Are you sure you want to delete <strong>{productToDelete?.name}</strong>?</>
                                } This action will permanently remove the items from your store and cannot be undone.
                            </p>

                            <div className="delete-modal-actions">
                                <button
                                    className="btn-cancel-modal"
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setProductToDelete(null);
                                    }}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-confirm-delete"
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <>
                                            <RefreshCw className="spinning-icon" size={16} />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete Forever'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Update Stock Modal */}
                {isStockModalOpen && (
                    <div className="modal-overlay">
                        <div className="delete-modal-box">
                            <div className="delete-modal-icon" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>
                                <Package size={32} />
                            </div>
                            <h2>{isBulkStockUpdate ? 'Update Stock Count (Bulk)?' : 'Update Stock Count'}</h2>
                            <p>
                                {isBulkStockUpdate
                                    ? `Enter the new stock count for ${selectedProductIds.length} selected products.`
                                    : <>Enter the new stock count for <strong>{productToUpdateStock?.name}</strong>.</>
                                }
                            </p>
                            <div style={{ margin: '20px 0', textAlign: 'left' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#444' }}>New Stock Count</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newStockCount}
                                    onChange={(e) => setNewStockCount(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>

                            <div className="delete-modal-actions">
                                <button
                                    className="btn-cancel-modal"
                                    onClick={() => {
                                        setIsStockModalOpen(false);
                                        setProductToUpdateStock(null);
                                        setIsBulkStockUpdate(false);
                                    }}
                                    disabled={isUpdatingStock}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-confirm-delete"
                                    style={{ background: '#0ea5e9' }}
                                    onClick={confirmUpdateStock}
                                    disabled={isUpdatingStock}
                                >
                                    {isUpdatingStock ? (
                                        <>
                                            <RefreshCw className="spinning-icon" size={16} />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Stock'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk Upload Modal */}
                {isBulkUploadModalOpen && (
                    <div className="modal-overlay">
                        <div className="upload-modal-box">
                            <div className="upload-modal-header">
                                <h2>Bulk Product Upload</h2>
                                <button className="close-modal-btn" onClick={() => setIsBulkUploadModalOpen(false)}>×</button>
                            </div>

                            <div className="upload-content">
                                <p className="upload-hint">Upload a CSV file containing your product information. You can download our sample template to ensure the correct format.</p>

                                <div className="sample-download-area">
                                    <button className="btn-download-sample" onClick={downloadSampleCSV}>
                                        <Download size={16} /> Download Sample template (.csv)
                                    </button>
                                </div>

                                <div className={`drop-zone ${uploadFile ? 'has-file' : ''}`}>
                                    <input
                                        type="file"
                                        id="csv-upload"
                                        accept=".csv"
                                        onChange={(e) => setUploadFile(e.target.files[0])}
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="csv-upload" className="drop-zone-label">
                                        {uploadFile ? (
                                            <div className="file-info">
                                                <FileText size={40} color="#E03E1A" />
                                                <span className="file-name">{uploadFile.name}</span>
                                                <span className="file-size">{(uploadFile.size / 1024).toFixed(2)} KB</span>
                                            </div>
                                        ) : (
                                            <div className="drop-hint">
                                                <Upload size={40} color="#ccc" />
                                                <span>Click to browse or drag & drop CSV file</span>
                                            </div>
                                        )}
                                    </label>
                                </div>

                                {uploadFile && (
                                    <div className="upload-actions">
                                        <button
                                            className="btn-cancel-upload"
                                            onClick={() => setUploadFile(null)}
                                            disabled={isUploading}
                                        >
                                            Remove File
                                        </button>
                                        <button
                                            className="btn-start-upload"
                                            onClick={handleBulkUpload}
                                            disabled={isUploading}
                                        >
                                            {isUploading ? (
                                                <>
                                                    <RefreshCw className="spinning-icon" size={16} />
                                                    Uploading...
                                                </>
                                            ) : (
                                                'Process Upload'
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk Edit Modal */}
                {isBulkEditModalOpen && (
                    <BulkEditModal
                        products={products.filter(p => selectedProductIds.includes(p.id))}
                        onClose={() => setIsBulkEditModalOpen(false)}
                        onSave={async (updatedProducts) => {
                            try {
                                for (const prod of updatedProducts) {
                                    await updateProduct(prod.id, prod);
                                }
                                toast.success(`${updatedProducts.length} products updated successfully`);
                                fetchProducts();
                                setIsBulkEditModalOpen(false);
                                setSelectedProductIds([]);
                            } catch (err) {
                                toast.error('Failed to update products');
                            }
                        }}
                    />
                )}

                {/* View Product Modal */}
                {isViewModalOpen && productToView && (
                    <ViewProductModal
                        productId={productToView.id}
                        onClose={() => setIsViewModalOpen(false)}
                    />
                )}

                {/* Manage Linked Products Modal */}
                {isLinkedProductsModalOpen && productForLinking && (
                    <ManageLinkedProductsModal
                        product={productForLinking}
                        onClose={() => setIsLinkedProductsModalOpen(false)}
                        onSave={handleSaveLinkedProducts}
                    />
                )}

                {/* Instagram Story Modal */}
                {storyProduct && (
                <div className="insta-story-overlay" onClick={() => setStoryProduct(null)}>
                    <div className="insta-story-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="insta-story-close" onClick={() => setStoryProduct(null)}>
                            <X size={20} />
                        </button>
                        <div className="insta-story-body">
                            <div className="insta-story-embed">
                                {storyProduct.media?.filter(m => m.fileType === 'instagram-url')[storyPostIndex]?.fileName ? (
                                    <iframe
                                        key={extractShortcode(storyProduct.media.filter(m => m.fileType === 'instagram-url')[storyPostIndex].fileName)}
                                        src={getInstagramEmbedUrl(storyProduct.media.filter(m => m.fileType === 'instagram-url')[storyPostIndex].fileName)}
                                        title="Instagram content"
                                        className="insta-story-iframe"
                                        allow="autoplay; encrypted-media"
                                        allowFullScreen
                                        scrolling="no"
                                    />
                                ) : (
                                    <div className="insta-story-embed-placeholder">
                                        <Loader2 size={32} />
                                    </div>
                                )}
                            </div>
                            <div className="insta-story-product">
                                <div className="insta-story-product-image-wrapper">
                                    <img src={getProductPrimaryImage(storyProduct)} alt={storyProduct.name} className="insta-story-product-image" />
                                </div>
                                <h3 className="insta-story-product-name">{storyProduct.name}</h3>
                                <p className="insta-story-product-price">
                                    ₹{((storyProduct.discountPrice || storyProduct.regularPrice) || 0).toFixed(2)}
                                </p>
                                {storyProduct.discountPrice && storyProduct.regularPrice > storyProduct.discountPrice && (
                                    <p className="insta-story-product-old-price">
                                        <s>₹{storyProduct.regularPrice.toFixed(2)}</s>
                                        <span className="insta-story-discount-badge">
                                            -{Math.round(((storyProduct.regularPrice - storyProduct.discountPrice) / storyProduct.regularPrice) * 100)}%
                                        </span>
                                    </p>
                                )}
                                <button className="insta-story-shop-btn" onClick={() => window.open(`/product/${storyProduct.id}`, '_self')}>
                                    <ShoppingBag size={16} /> Shop Now
                                </button>
                            </div>
                        </div>
                        {storyProduct.media?.filter(m => m.fileType === 'instagram-url').length > 1 && (
                            <div className="insta-story-nav">
                                <button type="button" className="insta-story-nav-btn" onClick={() => setStoryPostIndex(prev => (prev - 1 + storyProduct.media.filter(m => m.fileType === 'instagram-url').length) % storyProduct.media.filter(m => m.fileType === 'instagram-url').length)}>
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="insta-story-counter">
                                    {storyPostIndex + 1} / {storyProduct.media.filter(m => m.fileType === 'instagram-url').length}
                                </span>
                                <button type="button" className="insta-story-nav-btn" onClick={() => setStoryPostIndex(prev => (prev + 1) % storyProduct.media.filter(m => m.fileType === 'instagram-url').length)}>
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                )}
            </div>
        </VendorLayout>
    );
};

const ManageLinkedProductsModal = ({ product, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [saving, setSaving] = useState(false);
    const [linkTypes] = useState([
        { id: 'UPSELL', label: 'Upsells (Premium Alternatives)' },
        { id: 'CROSS_SELL', label: 'Cross-sells (Related Products)' },
        { id: 'BOUGHT_TOGETHER', label: 'Frequently Bought Together' }
    ]);

    // Get current linked products for each type
    const getCurrentLinks = (type) => {
        return selectedLinkProducts[type] || [];
    };

    const handleTabChange = (tabIndex) => {
        setActiveTab(tabIndex);
        // Reset search when changing tabs
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleSearchChange = (e) => {
        const query = e.target.value.trim();
        setSearchQuery(query);
        
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        // Debounce search
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(async () => {
            try {
                const results = await searchProducts(query);
                // Filter out the current product and already selected products
                const currentIds = getCurrentLinks(linkTypes[activeTab].id).map(p => p.id);
                const filteredResults = (Array.isArray(results) ? results : results?.content || [])
                    .filter(p => p.id !== product.id && !currentIds.includes(p.id));
                setSearchResults(filteredResults);
            } catch (error) {
                console.error("Search error:", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    const handleSelectProduct = (productToLink) => {
        const type = linkTypes[activeTab].id;
        setSelectedLinkProducts(prev => ({
            ...prev,
            [type]: [...(prev[type] || []), productToLink]
        }));
    };

    const handleRemoveProduct = (productToRemove) => {
        const type = linkTypes[activeTab].id;
        setSelectedLinkProducts(prev => ({
            ...prev,
            [type]: (prev[type] || []).filter(p => p.id !== productToRemove.id)
        }));
    };

    const handleSaveLinkedProducts = async () => {
        setSaving(true);
        try {
            // Prepare linked products data
            const linkedProducts = [];
            linkTypes.forEach(type => {
                (getCurrentLinks(type.id) || []).forEach(linkedProduct => {
                    linkedProducts.push({
                        linkedType: type.id,
                        linkedProductName: linkedProduct.name
                    });
                });
            });

            // Update the product with linked products
            await updateProduct(product.id, {
                ...product,
                linkedProducts: linkedProducts
            });

            toast.success(`Linked products updated successfully`);
            onClose();
        } catch (error) {
            console.error("Failed to save linked products:", error);
            toast.error("Failed to update linked products");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', width: '95%' }}>
                <div className="modal-header">
                    <h3>Manage Linked Products for {product.name}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button className="modal-close-btn" onClick={onClose}>&times;</button>
                    </div>
                </div>

                <div className="modal-body" style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 130px)', padding: '20px' }}>
                    {/* Link Types Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
                        {linkTypes.map((type, index) => (
                            <button
                                key={type.id}
                                onClick={() => handleTabChange(index)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 14px',
                                    borderRadius: '10px',
                                    border: activeTab === index ? '2px solid #FF5722' : '1px solid #e2e8f0',
                                    background: activeTab === index ? '#FFF3E0' : 'white',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.82rem',
                                    fontWeight: activeTab === index ? 600 : 400,
                                    color: activeTab === index ? '#FF5722' : '#64748b'
                                }}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Section */}
                    <div style={{ marginBottom: '24px' }}>
                        <div className="search-input-wrapper">
                            <Search size={18} color="#888" />
                            <input
                                type="text"
                                placeholder={`Search products to link as ${linkTypes[activeTab].label.toLowerCase()}...`}
                                value={searchQuery}
                                onChange={handleSearchChange}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>
                    </div>

                    {/* Search Results or Placeholder */}
                    {isSearching && searchQuery.length >= 2 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                            Searching...
                        </div>
                    ) : (searchResults.length > 0 && searchQuery.length >= 2) ? (
                        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                            {searchResults.map(result => (
                                <div
                                    key={result.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '12px',
                                        borderBottom: '1px solid #f1f5f9',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => handleSelectProduct(result)}
                                >
                                    <div style={{ flex: '0 0 80px' }}>
                                        {result.media?.find(m => m.mediaType !== 'manufacturer')?.fileName || result.media?.[0]?.fileName ? (
                                            <img
                                                src={`${BACKEND_URL}/uploads/products/${(result.media.find(m => m.mediaType !== 'manufacturer') || result.media[0]).fileName}`}
                                                alt={result.name}
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    objectFit: 'cover',
                                                    borderRadius: '6px'
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '80px',
                                                height: '80px',
                                                background: '#f1f5f9',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#64748b'
                                            }}>
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ flex: '1', marginLeft: '12px' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{result.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            {result.category || ''} • 
                                            {result.brand || ''} • 
                                            SKU: {result.sku || 'N/A'}
                                        </div>
                                        <div style={{ marginTop: '8px', fontSize: '0.88rem', color: '#FF5722' }}>
                                            ₹{(result.discountPrice || result.regularPrice).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                            {searchQuery.length < 2 ? (
                                'Type at least 2 characters to search for products'
                            ) : (
                                'No products found. Try a different search term.'
                            )}
                        </div>
                    )}

                    {/* Selected Products Section */}
                    <div style={{ marginTop: '24px' }}>
                        <h4 style={{ marginBottom: '16px', color: '#64748b' }}>
                            Selected {linkTypes[activeTab].label}
                        </h4>
                        {getCurrentLinks(linkTypes[activeTab].id).length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                {getCurrentLinks(linkTypes[activeTab].id).map(selected => (
                                    <div
                                        key={selected.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            background: '#fff3e0',
                                            border: '1px solid #ffcc80',
                                            borderRadius: '8px',
                                            padding: '8px 12px'
                                        }}
                                    >
                                        <div style={{ flex: '0 0 60px' }}>
                                            {selected.media?.find(m => m.mediaType !== 'manufacturer')?.fileName || selected.media?.[0]?.fileName ? (
                                                <img
                                                    src={`${BACKEND_URL}/uploads/products/${(selected.media.find(m => m.mediaType !== 'manufacturer') || selected.media[0]).fileName}`}
                                                    alt={selected.name}
                                                    style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        objectFit: 'cover',
                                                        borderRadius: '4px'
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '60px',
                                                    height: '60px',
                                                    background: '#f1f5f9',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#64748b'
                                                }}>
                                                    No Image
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ flex: '1', marginLeft: '10px' }}>
                                            <div style={{ fontWeight: 600 }}>{selected.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                {selected.category || ''} • SKU: {selected.sku || 'N/A'}
                                            </div>
                                        </div>
                                        <div style={{ marginLeft: '12px' }}>
                                            <button
                                                onClick={() => handleRemoveProduct(selected)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#ff5722',
                                                    cursor: 'pointer',
                                                    fontSize: '1rem',
                                                    padding: '4px'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                                No {linkTypes[activeTab].label.toLowerCase()} selected yet
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-confirm-edit" onClick={handleSaveLinkedProducts} disabled={saving}>
                        {saving ? 'Saving...' : `Save Linked Products`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VendorProducts;
