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
    Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VendorLayout from '../../components/vendor/VendorLayout';
import './VendorProducts.css';
import { getVendorProducts, getUserDetails, BACKEND_URL, deleteProduct, deleteProductsBulk, bulkUploadProducts } from '../../api/api';
import toast from 'react-hot-toast';

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

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Multi-Selection State
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [isBulkDelete, setIsBulkDelete] = useState(false);

    // Bulk Upload State
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Fetch vendor ID on mount
    useEffect(() => {
        const initVendorInfo = async () => {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData.userId) {
                try {
                    const userDetails = await getUserDetails(userData.userId);
                    setVendorId(userDetails.id);
                } catch (error) {
                    console.error("Failed to fetch user details:", error);
                    // Fallback to local storage id if API fails
                    setVendorId(userData.userId);
                }
            } else {
                setLoading(false);
                console.error("No user session found. Please log in as a vendor.");
            }
        };
        initVendorInfo();
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
        setIsDeleteModalOpen(true);
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

    const getStockBadgeClass = (qty) => {
        if (qty === 0) return 'stock-out';
        if (qty <= 5) return 'stock-low';
        return 'stock-in';
    };

    const getStockText = (qty) => {
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
                            <option value="All Categories">All Categories</option>
                            <option value="grocery">Grocery & Gourmet Food</option>
                            <option value="health">Health & Household</option>
                            <option value="home">Home & Kitchen</option>
                            <option value="beauty">Beauty & Personal Care</option>
                            <option value="clothing">Clothing, Shoes & Jewellery</option>
                            <option value="toys">Toys & Games</option>
                            <option value="patio">Patio, Lawn & Garden</option>
                            <option value="musical">Musical Instruments</option>
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
                    {/* <button className="btn-more-filters">
                        <Filter size={16} /> More Filters
                    </button> */}
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
                        <button className="action-text-btn">
                            <RefreshCw size={16} /> Change Status
                        </button>
                    </div>
                    <div className="showing-text">
                        Showing {totalElements === 0 ? 0 : (page * size) + 1}-{Math.min((page + 1) * size, totalElements)} of {totalElements} products
                    </div>
                </div>

                {/* Data Table Area */}
                <div className="products-table-wrapper">
                    <table className="products-data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}></th> {/* Checkbox column */}
                                <th>PRODUCT INFO</th>
                                <th>SKU</th>
                                <th>CATEGORY</th>
                                <th>PRICE</th>
                                <th>STOCK STATUS</th>
                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            className="checkbox-custom"
                                            checked={selectedProductIds.includes(product.id)}
                                            onChange={() => handleToggleProduct(product.id)}
                                        />
                                    </td>
                                    <td>
                                        <div className="product-info-cell">
                                            <img
                                                src={product.media && product.media.length > 0 ? `${BACKEND_URL}/uploads/products/${product.media[0].fileName}` : '/placeholder-image.png'}
                                                alt={product.name}
                                                className="product-image"
                                            />
                                            <div className="product-details">
                                                <div className="product-name">{product.name}</div>
                                                <div className="product-desc">{product.shortDescription || product.description || 'No description available'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="sku-text">{product.sku}</div>
                                    </td>
                                    <td>
                                        <span className="category-badge">{product.category}</span>
                                    </td>
                                    <td>
                                        <div className="price-text">₹{product.regularPrice || product.discountPrice || '0.00'}</div>
                                    </td>
                                    <td>
                                        <span className={`stock-badge ${getStockBadgeClass(product.initialStock || product.stock || 0)}`}>
                                            {getStockText(product.initialStock || product.stock || 0)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <button className="row-action-btn" onClick={() => navigate(`/vendor/products/edit/${product.id}`)} title="Edit Product"><Edit2 size={16} /></button>
                                            <button className="row-action-btn" title="Duplicate Product"><Copy size={16} /></button>
                                            <button className="row-action-btn" onClick={() => handleDeleteProduct(product)} title="Delete Product"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
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
            </div>
        </VendorLayout>
    );
};

export default VendorProducts;