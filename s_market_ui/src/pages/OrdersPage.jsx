import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Search, ChevronDown, Leaf, HeartHandshake, Package, Printer } from 'lucide-react';
import './OrdersPage.css';
import { fetchUserOrders, createMockOrder, getAllProducts, submitProductReview, getUserReviews, BACKEND_URL, submitReturnAPI } from '../api/api';
import { Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

const OrdersPage = () => {
    const [activeTab, setActiveTab] = useState('All Orders');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [productsCache, setProductsCache] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    // Order Details Modal State
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Review Modal State
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [reviewProduct, setReviewProduct] = useState(null);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [userReviews, setUserReviews] = useState({}); // { productId: reviewObject }
    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    // Return Modal State
    const [isReturnOpen, setIsReturnOpen] = useState(false);
    const [returnOrder, setReturnOrder] = useState(null);
    const [returnReason, setReturnReason] = useState('');
    const [returnImages, setReturnImages] = useState([]);
    const [returnImagePreviews, setReturnImagePreviews] = useState([]);
    const [submittingReturn, setSubmittingReturn] = useState(false);

    // Store requested returns locally
    const [returnedOrderIds, setReturnedOrderIds] = useState(new Set());

    const tabs = ['All Orders', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    useEffect(() => {
        window.scrollTo(0, 0);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUserId(parsedUser.userId || parsedUser.id);
            loadOrders(parsedUser.userId || parsedUser.id);
            loadUserReviews(parsedUser.userId || parsedUser.id);
        } else {
            setLoading(false);
            // Optionally redirect to login here
        }
    }, []);

    const loadOrders = async (id) => {
        setLoading(true);
        try {
            const data = await fetchUserOrders(id);
            setOrders(data);

            // Fetch products to show details
            try {
                const productsData = await getAllProducts();
                const pMap = {};
                productsData.forEach(p => { pMap[p.id] = p; });
                setProductsCache(pMap);
            } catch (e) {
                console.error("Failed to fetch products cache:", e);
            }

        } catch (error) {
            console.error("Failed to load orders:", error);
            toast.error("Failed to load your orders");
        } finally {
            setLoading(false);
        }
    };

    const loadUserReviews = async (id) => {
        try {
            const reviews = await getUserReviews(id);
            const reviewMap = {};
            reviews.forEach(r => {
                reviewMap[r.productId] = r;
            });
            setUserReviews(reviewMap);
        } catch (error) {
            console.error("Failed to load user reviews:", error);
        }
    };

    const handleGenerateMocks = async () => {
        if (!userId) return;
        const toastId = toast.loading("Generating mock orders...");
        try {
            await createMockOrder(userId);
            toast.success("Mock orders generated!", { id: toastId });
            await loadOrders(userId); // Refresh the list
        } catch (error) {
            toast.error("Failed to generate orders", { id: toastId });
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown Date';
        const date = new Date(timestamp);
        const today = new Date();

        // Check if today
        if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
            return 'Today';
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleOpenReview = (product) => {
        setReviewProduct(product);
        setIsReviewOpen(true);

        const existingReview = userReviews[product.id];
        if (existingReview) {
            setRating(existingReview.rating);
            setHoveredRating(existingReview.rating);
            setReviewText(existingReview.text || '');

            // Populate existing images
            if (existingReview.images && existingReview.images.length > 0) {
                const previews = existingReview.images.map(img => ({
                    url: `${BACKEND_URL}/uploads/reviews/${img}`,
                    type: 'existing',
                    name: img
                }));
                setImagePreviews(previews);
            } else {
                setImagePreviews([]);
            }
        } else {
            setRating(0);
            setHoveredRating(0);
            setReviewText('');
            setImagePreviews([]);
        }

        setSelectedImages([]);
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + imagePreviews.length > 5) {
            toast.error("You can only upload up to 5 images");
            return;
        }

        const newSelected = [...selectedImages, ...files];
        setSelectedImages(newSelected);

        const newPreviews = files.map(file => ({
            url: URL.createObjectURL(file),
            type: 'new',
            file: file,
            name: file.name
        }));
        setImagePreviews([...imagePreviews, ...newPreviews]);
    };

    const removeImage = (index) => {
        const itemToRemove = imagePreviews[index];

        if (itemToRemove.type === 'new') {
            URL.revokeObjectURL(itemToRemove.url);
            setSelectedImages(prev => prev.filter(f => f !== itemToRemove.file));
        }

        const newPreviews = [...imagePreviews];
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error("Please select a rating from 1 to 5 stars");
            return;
        }
        if (!reviewText.trim()) {
            toast.error("Please write a review");
            return;
        }

        setSubmittingReview(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const rawUserId = user?.id || userId;

            if (!rawUserId) {
                toast.error("User ID not found. Please log in again.");
                setSubmittingReview(false);
                return;
            }

            const existingReview = userReviews[reviewProduct.id];

            const reviewJson = {
                productId: Number(reviewProduct.id),
                userId: Number(rawUserId),
                reviewerName: user?.fullName || "Valued Customer",
                rating: Number(rating),
                text: reviewText,
                verifiedBuyer: true,
                // Keep existing images that weren't removed
                images: imagePreviews.filter(p => p.type === 'existing').map(p => p.name)
            };

            // If we are editing, include the existing review ID
            if (existingReview && existingReview.id) {
                reviewJson.id = existingReview.id;
            }

            const formData = new FormData();
            formData.append("review", JSON.stringify(reviewJson));

            // Append only new image files
            imagePreviews.filter(p => p.type === 'new').forEach(p => {
                formData.append("images", p.file);
            });

            await submitProductReview(formData);
            toast.success(existingReview ? "Review updated!" : "Review submitted! Thank you.");

            // Refresh reviews to update the state
            loadUserReviews(rawUserId);

            setIsReviewOpen(false);
            setRating(0);
            setReviewText('');
            setSelectedImages([]);
            setImagePreviews([]);
        } catch (error) {
            console.error("Failed to submit review:", error);
            // Show more detailed error if available from the backend JSON response
            const errorMessage = error.message || "Failed to submit review";
            toast.error(errorMessage);
            // Close the modal on error as requested
            setIsReviewOpen(false);
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleOpenReturn = (order) => {
        setReturnOrder(order);
        setIsReturnOpen(true);
        setReturnReason('');
        setReturnImages([]);
        setReturnImagePreviews([]);
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    const generateInvoice = (order) => {
        const subtotal = order.totalAmount - (order.taxAmount || 0);
        const taxRate = order.taxRate || 0;
        const cgstRate = order.cgstRate || (taxRate / 2);
        const sgstRate = order.sgstRate || (taxRate / 2);
        const cgstAmount = order.cgst || (subtotal * (cgstRate / 100));
        const sgstAmount = order.sgst || (subtotal * (sgstRate / 100));
        const taxAmount = order.taxAmount || (cgstAmount + sgstAmount);

        const doc = new jsPDF();
        let y = 20;

        // Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('SreeMarket', 105, y, { align: 'center' });
        y += 8;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Multi-Vendor E-Commerce Platform', 105, y, { align: 'center' });
        y += 5;
        doc.setFontSize(7);
        doc.text('www.sreemarket.com | support@sreemarket.com | +91-XXXXXXXXXX', 105, y, { align: 'center' });
        y += 5;
        doc.setDrawColor(0, 0, 0);
        doc.line(20, y, 190, y);
        y += 8;

        // Invoice Title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('TAX INVOICE', 105, y, { align: 'center' });
        y += 10;

        // Invoice Info
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Invoice No: ${order.orderNumber}`, 20, y);
        doc.text(`Date: ${formatDate(order.datePlaced)}`, 120, y);
        y += 6;
        doc.text(`Order Status: ${order.status}`, 20, y);
        y += 10;

        // Bill To & Billing Address - side by side
        const startY = y;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Bill To / Ship To:', 20, y);
        doc.text('Billing Address:', 120, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        // Name
        doc.text(`${order.customerName || 'N/A'}`, 20, y);
        doc.text(`${order.billingName || order.customerName || 'N/A'}`, 120, y);
        y += 5;
        
        // Address lines
        const shipAddr = (order.deliveryLocation || 'N/A').split(',').map(s => s.trim()).filter(s => s);
        const billAddr = (order.billingAddress || order.deliveryLocation || 'N/A').split(',').map(s => s.trim()).filter(s => s);
        
        const maxLines = Math.max(shipAddr.length, billAddr.length);
        
        if (maxLines > 0) {
            // First line (city)
            doc.text(shipAddr[0] || '', 20, y);
            doc.text(billAddr[0] || '', 120, y);
            y += 5;
            
            // Second line (state + rest)
            if (maxLines > 1) {
                doc.text(shipAddr.slice(1).join(', ') || '', 20, y);
                doc.text(billAddr.slice(1).join(', ') || '', 120, y);
                y += 5;
            }
        }
        
        // Country
        doc.text('India', 20, y);
        doc.text('India', 120, y);
        y += 10;

        // Table Header
        y += 5;
        doc.setDrawColor(0, 0, 0);
        doc.line(20, y, 190, y);
        y += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Description', 22, y);
        doc.text('Qty', 130, y, { align: 'center' });
        doc.text('Rate', 150, y, { align: 'right' });
        doc.text('Amount', 185, y, { align: 'right' });
        y += 6;
        doc.line(20, y, 190, y);
        y += 6;

        // Items
        doc.setFont('helvetica', 'normal');
        Object.entries(order.productQuantities || {}).forEach(([productId, quantity]) => {
            const product = productsCache[productId];
            const itemPrice = product?.discountPrice || product?.regularPrice || 0;
            const itemTotal = itemPrice * quantity;
            const productName = product ? product.name : `Product #${productId}`;
            
            // Check if we need a new page
            if (y > 260) {
                doc.addPage();
                y = 20;
            }
            
            doc.text(productName, 22, y);
            doc.text(String(quantity), 130, y, { align: 'center' });
            doc.text(`Rs. ${itemPrice.toFixed(2)}`, 150, y, { align: 'right' });
            doc.text(`Rs. ${itemTotal.toFixed(2)}`, 185, y, { align: 'right' });
            y += 7;
        });

        y += 3;
        doc.line(20, y, 190, y);
        y += 8;

        // Summary
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Subtotal:', 130, y);
        doc.text(`₹${subtotal.toFixed(2)}`, 185, y, { align: 'right' });
        y += 6;
        doc.text('Shipping:', 130, y);
        doc.text('FREE', 185, y, { align: 'right' });
        y += 6;
        doc.text(`GST (${taxRate}%):`, 130, y);
        doc.text(`₹${taxAmount.toFixed(2)}`, 185, y, { align: 'right' });
        y += 6;
        doc.setFontSize(8);
        doc.text(`   CGST (${cgstRate}%):`, 130, y);
        doc.text(`₹${cgstAmount.toFixed(2)}`, 185, y, { align: 'right' });
        y += 5;
        doc.text(`   SGST (${sgstRate}%):`, 130, y);
        doc.text(`₹${sgstAmount.toFixed(2)}`, 185, y, { align: 'right' });
        y += 7;
        doc.setDrawColor(0, 0, 0);
        doc.line(130, y, 190, y);
        y += 7;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Total Paid:', 130, y);
        doc.text(`₹${(order.totalAmount || 0).toFixed(2)}`, 185, y, { align: 'right' });
        y += 15;

        // Terms & Conditions
        doc.setDrawColor(0, 0, 0);
        doc.line(20, y, 190, y);
        y += 8;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Terms & Conditions:', 20, y);
        y += 6;
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        const terms = [
            '1. This is a computer-generated invoice and does not require a signature.',
            '2. Goods once sold will not be taken back or exchanged.',
            '3. All disputes subject to Mumbai jurisdiction only.',
            '4. Payment to be made within 30 days of invoice date.',
            '5. Interest @ 18% p.a. will be charged on overdue payments.',
            '6. GSTIN: 27AAAAA0000A1Z5 | PAN: AAAAA0000A',
            '7. This invoice is valid for input tax credit.',
        ];
        terms.forEach(term => {
            if (y > 275) {
                doc.addPage();
                y = 20;
            }
            doc.text(term, 20, y);
            y += 4.5;
        });

        y += 5;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Thank you for your order!', 105, y, { align: 'center' });
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('SreeMarket - Multi-Vendor E-Commerce', 105, y, { align: 'center' });

        doc.save(`Invoice_${order.orderNumber.replace('#', '')}.pdf`);
        toast.success('Invoice downloaded as PDF!');
    };

    const handleReturnImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + returnImagePreviews.length > 5) {
            toast.error("You can only upload up to 5 images");
            return;
        }

        const newSelected = [...returnImages, ...files];
        setReturnImages(newSelected);

        const newPreviews = files.map(file => ({
            url: URL.createObjectURL(file),
            file: file,
            name: file.name
        }));
        setReturnImagePreviews([...returnImagePreviews, ...newPreviews]);
    };

    const removeReturnImage = (index) => {
        const itemToRemove = returnImagePreviews[index];
        URL.revokeObjectURL(itemToRemove.url);

        setReturnImages(prev => prev.filter(f => f !== itemToRemove.file));

        const newPreviews = [...returnImagePreviews];
        newPreviews.splice(index, 1);
        setReturnImagePreviews(newPreviews);
    };

    const handleSubmitReturn = async (e) => {
        e.preventDefault();
        if (!returnReason.trim()) {
            toast.error("Please provide a reason for return");
            return;
        }

        setSubmittingReturn(true);
        try {
            // Ideally, an API call would be made here to submit the return request
            const formData = new FormData();
            formData.append('reason', returnReason);
            returnImages.forEach(img => formData.append('images', img));
            await submitReturnAPI(returnOrder.id, formData);

            // Simulating API call for now
            // await new Promise(resolve => setTimeout(resolve, 1000));
            setReturnedOrderIds(prev => new Set(prev).add(returnOrder.id));
            toast.success("Return request submitted successfully");
            setIsReturnOpen(false);
        } catch (error) {
            toast.error("Failed to submit return request");
        } finally {
            setSubmittingReturn(false);
        }
    };

    // Filter orders based on active tab
    const filteredOrders = orders.filter(order => {
        const orderStatus = order.status?.toUpperCase();
        const matchesTab = activeTab === 'All Orders' ||
            (activeTab === 'Processing' && (orderStatus === 'PROCESSING' || orderStatus === 'ACCEPTED')) ||
            orderStatus === activeTab.toUpperCase();
        if (!matchesTab) return false;

        // Filter by search query
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();

        // Match order number
        if (order.orderNumber?.toLowerCase().includes(query)) return true;

        // Match product names
        const productNames = Object.keys(order.productQuantities || {}).map(pid =>
            productsCache[pid]?.name?.toLowerCase() || ""
        );
        return productNames.some(name => name.includes(query));
    });

    return (
        <div className="orders-page-wrapper">
            <Navbar />

            <div className="orders-container">
                <div className="orders-header">
                    <div>
                        <h1>Your Orders</h1>
                        <p>Track your impact and manage your conscious purchases.</p>
                    </div>

                </div>

                <div className="orders-filters-container">
                    <div className="orders-tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                className={`orders-tab ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="orders-controls">
                        <div className="search-input-wrapper">
                            <Search size={16} color="#999" />
                            <input
                                type="text"
                                placeholder="Search order ID or product..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="date-dropdown">
                            <span>Last 3 months</span>
                            <ChevronDown size={14} />
                        </div>
                    </div>
                </div>

                <div className="orders-list">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>Loading orders...</div>
                    ) : filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => {
                            // Define actions dynamically based on status
                            const actions = [];
                            actions.push({ label: 'View Details', type: 'secondary', onClick: () => handleViewDetails(order) });
                            const statusUpper = order.status?.toUpperCase();
                            if (statusUpper === 'DELIVERED') {
                                actions.push({ label: 'Order Again', type: 'primary' });
                                if (returnedOrderIds.has(order.id)) {
                                    actions.push({ label: 'Return Requested', type: 'disabled', disabled: true });
                                } else {
                                    actions.push({ label: 'Return', type: 'dark', onClick: () => handleOpenReturn(order) });
                                }
                            }
                            if (statusUpper === 'SHIPPED') actions.push({ label: 'Track Order', type: 'dark' });

                            return (
                                <div key={order.id} className="order-card">
                                    <div className="order-card-header">
                                        <div className="order-meta">
                                            <div className="meta-group">
                                                <span className="meta-label">ORDER NUMBER</span>
                                                <span className="meta-value black-heavy">{order.orderNumber}</span>
                                            </div>
                                            <div className="meta-group">
                                                <span className="meta-label">DATE PLACED</span>
                                                <span className="meta-value black-heavy">{formatDate(order.datePlaced)}</span>
                                            </div>
                                            <div className="meta-group">
                                                <span className="meta-label">TOTAL AMOUNT</span>
                                                <span className="meta-value brand-color">₹{(order.totalAmount || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="order-status-container">
                                            <div className={`status-pill ${order.status?.toLowerCase()}`}>
                                                {statusUpper === 'DELIVERED' && <div className="status-dot green"></div>}
                                                {statusUpper === 'SHIPPED' && <Package size={12} />}
                                                {(statusUpper === 'PROCESSING' || statusUpper === 'ACCEPTED') && <div className="status-dot orange"></div>}
                                                {(statusUpper === 'REJECTED' || statusUpper === 'CANCELLED') && <div className="status-dot red"></div>}
                                                {order.status}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="order-card-body">
                                        <div className="order-products-preview">
                                            {(order.images || []).filter(Boolean).map((img, index) => (
                                                <div key={index} className="product-thumbnail">
                                                    <img src={img} alt="Product Thumbnail" />
                                                </div>
                                            ))}
                                            {order.additionalItems > 0 && (
                                                <div className="product-thumbnail additional-items-indicator">
                                                    +{order.additionalItems}
                                                </div>
                                            )}
                                        </div>
                                        {order.productQuantities && Object.keys(order.productQuantities).length > 0 && (
                                            <div style={{ marginTop: '0.75rem' }}>
                                                {Object.entries(order.productQuantities).map(([productId, quantity]) => {
                                                    const product = productsCache[productId];
                                                    return (
                                                        <div key={productId} style={{ marginBottom: '6px', fontSize: '0.9rem', color: '#333' }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: '8px 0',
                                                                borderBottom: '1px solid #f8f9fa'
                                                            }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                    <div>
                                                                        <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                                                            {product ? product.name : `Product #${productId}`}
                                                                        </span>
                                                                        <span style={{ color: '#64748b', marginLeft: '6px', fontSize: '0.85rem' }}>x{quantity}</span>
                                                                    </div>
                                                                </div>
                                                                {statusUpper === 'DELIVERED' && product && (
                                                                    <button
                                                                        onClick={() => handleOpenReview(product)}
                                                                        style={{
                                                                            fontSize: '0.75rem',
                                                                            color: '#FF5722',
                                                                            background: 'rgba(255, 87, 34, 0.08)',
                                                                            border: '1px solid rgba(255, 87, 34, 0.2)',
                                                                            borderRadius: '20px',
                                                                            padding: '6px 14px',
                                                                            cursor: 'pointer',
                                                                            fontWeight: '600',
                                                                            transition: 'all 0.2s ease',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '4px'
                                                                        }}
                                                                        onMouseOver={(e) => {
                                                                            e.currentTarget.style.background = 'rgba(255, 87, 34, 0.15)';
                                                                        }}
                                                                        onMouseOut={(e) => {
                                                                            e.currentTarget.style.background = 'rgba(255, 87, 34, 0.08)';
                                                                        }}
                                                                    >
                                                                        <Star size={12} fill="#FF5722" color="#FF5722" />
                                                                        {userReviews[product.id] ? 'Edit Review' : 'Write Review'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="order-card-actions">
                                        {actions.map((action, index) => (
                                            <button
                                                key={index}
                                                className={`btn-order-action ${action.type}`}
                                                onClick={action.onClick}
                                                disabled={action.disabled}
                                            >
                                                {action.label === 'Order Again' && <span className="action-icon">↺</span>}
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '12px', border: '1px solid #ebebeb' }}>
                            <Package size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
                            <h3>No Orders Found</h3>
                            <p style={{ color: '#666', marginBottom: '2rem' }}>You haven't placed any orders yet, or they don't match this filter.</p>
                            {/* {activeTab === 'All Orders' && userId && (
                                <button
                                    className="btn-order-action dark"
                                    onClick={handleGenerateMocks}
                                >
                                    Generate Mock Orders
                                </button>
                            )} */}
                        </div>
                    )}
                </div>


            </div>

            <Footer />

            {/* Review Modal */}
            {isReviewOpen && (
                <div className="review-modal-overlay">
                    <div className="review-modal-content">
                        <div className="review-modal-header">
                            <h3>Review Product</h3>
                            <button onClick={() => setIsReviewOpen(false)} className="close-modal-btn">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="review-modal-body">
                            <div className="review-product-info">
                                <span className="review-product-name">{reviewProduct?.name}</span>
                            </div>

                            <form onSubmit={handleSubmitReview}>
                                <div className="rating-input-group">
                                    <label>Your Rating</label>
                                    <div className="stars-container" onMouseLeave={() => setHoveredRating(0)}>
                                        {[1, 2, 3, 4, 5].map((star) => {
                                            const isFilled = star <= (hoveredRating || rating);
                                            return (
                                                <Star
                                                    key={star}
                                                    size={32}
                                                    className={`star-icon ${isFilled ? 'filled' : ''}`}
                                                    onClick={() => setRating(star)}
                                                    onMouseEnter={() => setHoveredRating(star)}
                                                    fill={isFilled ? "#FF5722" : "none"}
                                                    color={isFilled ? "#FF5722" : "#E0E0E0"}
                                                    strokeWidth={isFilled ? 1 : 1.5}
                                                    style={{
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        transform: hoveredRating === star ? 'scale(1.15)' : 'scale(1)'
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="review-input-group">
                                    <label>Your Review</label>
                                    <textarea
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        placeholder="What did you like or dislike?"
                                        required
                                    ></textarea>
                                </div>

                                <div className="review-input-group">
                                    <label>Add Photos (Optional)</label>
                                    <div className="review-image-upload-container">
                                        <div className="image-previews">
                                            {imagePreviews.map((preview, index) => (
                                                <div key={index} className="image-preview-item">
                                                    <img src={preview.url} alt={`Preview ${index}`} />
                                                    <button type="button" onClick={() => removeImage(index)} className="remove-image-btn">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            {imagePreviews.length < 5 && (
                                                <label className="add-image-label">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={handleImageChange}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <div className="add-image-placeholder">
                                                        <span>+</span>
                                                        <span style={{ fontSize: '10px' }}>Add Photo</span>
                                                    </div>
                                                </label>
                                            )}
                                        </div>
                                        <p className="upload-hint">You can add up to 5 photos.</p>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="submit-review-btn"
                                    disabled={submittingReview}
                                >
                                    {submittingReview ? "Submitting..." : "Submit Review"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Return Modal */}
            {isReturnOpen && (
                <div className="review-modal-overlay">
                    <div className="review-modal-content">
                        <div className="review-modal-header">
                            <h3>Return Order</h3>
                            <button onClick={() => setIsReturnOpen(false)} className="close-modal-btn">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="review-modal-body">
                            <div className="review-product-info">
                                <span className="review-product-name">Order {returnOrder?.orderNumber}</span>
                            </div>

                            <form onSubmit={handleSubmitReturn}>
                                <div className="review-input-group">
                                    <label>Reason for Return</label>
                                    <textarea
                                        value={returnReason}
                                        onChange={(e) => setReturnReason(e.target.value)}
                                        placeholder="Please explain why you are returning this item..."
                                        required
                                    ></textarea>
                                </div>

                                <div className="review-input-group">
                                    <label>Add Photos (Optional)</label>
                                    <div className="review-image-upload-container">
                                        <div className="image-previews">
                                            {returnImagePreviews.map((preview, index) => (
                                                <div key={index} className="image-preview-item">
                                                    <img src={preview.url} alt={`Preview ${index}`} />
                                                    <button type="button" onClick={() => removeReturnImage(index)} className="remove-image-btn">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            {returnImagePreviews.length < 5 && (
                                                <label className="add-image-label">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={handleReturnImageChange}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <div className="add-image-placeholder">
                                                        <span>+</span>
                                                        <span style={{ fontSize: '10px' }}>Add Photo</span>
                                                    </div>
                                                </label>
                                            )}
                                        </div>
                                        <p className="upload-hint">You can add up to 5 photos.</p>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="submit-review-btn"
                                    disabled={submittingReturn}
                                >
                                    {submittingReturn ? "Submitting..." : "Submit Return Request"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            {isDetailsOpen && selectedOrder && (
                <div className="review-modal-overlay">
                    <div className="review-modal-content" style={{ maxWidth: '700px', width: '90%' }}>
                        <div className="review-modal-header">
                            <h3>Order Details</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button 
                                    onClick={() => generateInvoice(selectedOrder)}
                                    className="btn-order-action primary"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                >
                                    <Printer size={14} style={{ marginRight: '0.35rem' }} />
                                    Download Invoice
                                </button>
                                <button onClick={() => setIsDetailsOpen(false)} className="close-modal-btn">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="review-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="order-detail-section">
                                <div className="detail-row">
                                    <span className="detail-label">Order Number</span>
                                    <span className="detail-value">{selectedOrder.orderNumber}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Date Placed</span>
                                    <span className="detail-value">{formatDate(selectedOrder.datePlaced)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Status</span>
                                    <span className={`detail-value status-pill ${selectedOrder.status?.toLowerCase()}`}>{selectedOrder.status}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Total Amount</span>
                                    <span className="detail-value brand-color">₹{(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="order-detail-section" style={{ marginTop: '1.5rem' }}>
                                <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>Shipping Address</h4>
                                <table className="address-table">
                                    <tbody>
                                        <tr><td className="addr-label">Name</td><td>{selectedOrder.customerName || 'N/A'}</td></tr>
                                        <tr><td className="addr-label">Address</td><td>{selectedOrder.deliveryLocation || 'N/A'}</td></tr>
                                        <tr><td className="addr-label">Country</td><td>India</td></tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="order-detail-section" style={{ marginTop: '1.5rem' }}>
                                <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>Billing Address</h4>
                                <table className="address-table">
                                    <tbody>
                                        <tr><td className="addr-label">Name</td><td>{selectedOrder.billingName || selectedOrder.customerName || 'N/A'}</td></tr>
                                        <tr><td className="addr-label">Address</td><td>{selectedOrder.billingAddress || selectedOrder.deliveryLocation || 'N/A'}</td></tr>
                                        <tr><td className="addr-label">Country</td><td>India</td></tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="order-detail-section" style={{ marginTop: '1.5rem' }}>
                                <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>Order Items</h4>
                                {selectedOrder.productQuantities && Object.keys(selectedOrder.productQuantities).length > 0 && (
                                    <table className="items-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th style={{ textAlign: 'center', width: '80px' }}>Qty</th>
                                                <th style={{ textAlign: 'right', width: '120px' }}>Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(selectedOrder.productQuantities).map(([productId, quantity]) => {
                                                const product = productsCache[productId];
                                                const itemPrice = product?.discountPrice || product?.regularPrice || 0;
                                                const itemTotal = itemPrice * quantity;
                                                const displayName = product ? product.name : `Product #${productId}`;
                                                return (
                                                    <tr key={productId}>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                                {product?.image && (
                                                                    <img src={product.image} alt={displayName} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                                                                    onError={(e) => { e.target.style.display = 'none'; }} />
                                                                )}
                                                                <div>
                                                                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{displayName}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>{quantity}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>₹{itemTotal.toFixed(2)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            <div className="order-detail-section" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                <table className="summary-table">
                                    <tbody>
                                        <tr>
                                            <td className="detail-label">Subtotal</td>
                                            <td className="detail-value">₹{(selectedOrder.totalAmount - (selectedOrder.taxAmount || 0)).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="detail-label">Shipping</td>
                                            <td className="detail-value">FREE</td>
                                        </tr>
                                        {selectedOrder.taxAmount > 0 && (
                                            <>
                                                <tr>
                                                    <td className="detail-label">GST ({selectedOrder.taxRate || 0}%)</td>
                                                    <td className="detail-value">₹{(selectedOrder.taxAmount || 0).toFixed(2)}</td>
                                                </tr>
                                                {selectedOrder.cgst && (
                                                    <tr className="tax-sub-row">
                                                        <td className="detail-label">CGST ({(selectedOrder.cgstRate || (selectedOrder.taxRate / 2) || ((selectedOrder.cgst / ((selectedOrder.totalAmount - (selectedOrder.taxAmount || 0))) * 100)).toFixed(0))}%)</td>
                                                        <td className="detail-value">₹{(selectedOrder.cgst || 0).toFixed(2)}</td>
                                                    </tr>
                                                )}
                                                {selectedOrder.sgst && (
                                                    <tr className="tax-sub-row">
                                                        <td className="detail-label">SGST ({(selectedOrder.sgstRate || (selectedOrder.taxRate / 2) || ((selectedOrder.sgst / ((selectedOrder.totalAmount - (selectedOrder.taxAmount || 0))) * 100)).toFixed(0))}%)</td>
                                                        <td className="detail-value">₹{(selectedOrder.sgst || 0).toFixed(2)}</td>
                                                    </tr>
                                                )}
                                            </>
                                        )}
                                        <tr className="total-row">
                                            <td className="detail-label">Total Paid</td>
                                            <td className="detail-value brand-color">₹{(selectedOrder.totalAmount || 0).toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {selectedOrder.estimatedDelivery && (
                                <div className="order-detail-section" style={{ marginTop: '1.5rem' }}>
                                    <div className="detail-row">
                                        <span className="detail-label">Estimated Delivery</span>
                                        <span className="detail-value">{selectedOrder.estimatedDelivery}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Extracted purely for scoping reasons.
const iconSize = 18;

export default OrdersPage;
