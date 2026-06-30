import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Package,
    ClipboardList,
    Truck,
    AlertCircle,
    Filter,
    Eye,
    Printer,
    Download,
    RefreshCw,
    Calendar,
    MapPin,
    ChevronRight,
    X,
    Search,
    ExternalLink,
    CheckCircle2,
    Clock,
    PackageCheck,
    Edit3,
    Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import VendorLayout from '../../components/vendor/VendorLayout';
import {
    getVendorShipmentsListSafe as getVendorShipmentsList,
    getVendorShippingLabelsSafe as getVendorShippingLabels,
    getShippingCarriersSafe as getShippingCarriers,
    createVendorShipmentSafe as createVendorShipment,
    generateShippingLabelSafe as generateShippingLabel,
    schedulePickupSafe as schedulePickup,
    trackVendorShipmentSafe as trackVendorShipment,
    fetchVendorOrders,
    getVendorShippingZones,
    createVendorShippingZone,
    updateVendorShippingZone,
    deleteVendorShippingZone,
    log,
    logError
} from '../../api/api';
import './VendorShipping.css';

const VendorShipping = () => {
    const [shipments, setShipments] = useState([]);
    const [labels, setLabels] = useState([]);
    const [orders, setOrders] = useState([]);
    const [carriers, setCarriers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState('');
    const [selectedCarrier, setSelectedCarrier] = useState('shiprocket');
    const [creating, setCreating] = useState(false);
    const [trackingModal, setTrackingModal] = useState(null);
    const [trackingData, setTrackingData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [activeTab, setActiveTab] = useState('shipments');
    const [zones, setZones] = useState([]);
    const [showZoneModal, setShowZoneModal] = useState(false);
    const [editingZone, setEditingZone] = useState(null);
    const [zoneForm, setZoneForm] = useState({
        name: '', regions: '', pincodes: '', deliveryType: 'STANDARD',
        baseRate: '', ratePerKg: '', freeShippingAbove: '',
        estimatedDaysMin: '', estimatedDaysMax: '', isActive: true
    });
    const [zoneSaving, setZoneSaving] = useState(false);

    const [metrics, setMetrics] = useState({
        totalShipments: 0,
        pendingPickup: 0,
        inTransit: 0,
        delayed: 0
    });

    const fetchData = useCallback(async () => {
        log('VENDOR_PAGE', 'VendorShipping fetchData started');
        setLoading(true);
        setError(null);
        try {
            const [shipData, labelData, carrierData] = await Promise.all([
                getVendorShipmentsList(),
                getVendorShippingLabels(),
                getShippingCarriers()
            ]);
            log('VENDOR_PAGE', 'VendorShipping data loaded', { shipments: shipData?.length, labels: labelData?.length });
            const shipmentsArr = Array.isArray(shipData) ? shipData : [];
            const labelsArr = Array.isArray(labelData) ? labelData : [];
            const carriersArr = Array.isArray(carrierData) ? carrierData : [];

            setShipments(shipmentsArr);
            setLabels(labelsArr);
            setCarriers(carriersArr);

            try {
                const zoneData = await getVendorShippingZones();
                setZones(Array.isArray(zoneData) ? zoneData : []);
            } catch (e) {
                logError('VENDOR_PAGE', 'Failed to fetch zones:', e.message);
            }

            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const orderData = await fetchVendorOrders(user.userId);
                    if (Array.isArray(orderData)) {
                        setOrders(orderData.filter(o =>
                            ['PROCESSING', 'ACCEPTED', 'READY_TO_SHIP', 'SHIPPED'].includes(o.status)
                        ));
                    }
                }
            } catch (e) {
                logError('VENDOR_PAGE', 'VendorShipping fetchOrders failed:', e.message);
            }

            const pending = labelsArr.filter(l => l.status === 'PENDING' || l.status === 'GENERATED').length;
            const transit = labelsArr.filter(l => l.status === 'PICKUP_SCHEDULED' || l.status === 'IN_TRANSIT').length;
            setMetrics({
                totalShipments: shipmentsArr.length,
                pendingPickup: pending,
                inTransit: transit,
                delayed: 0
            });
        } catch (err) {
            logError('VENDOR_PAGE', 'VendorShipping fetchData failed:', err.message);
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        log('VENDOR_PAGE', 'VendorShipping mounted');
        fetchData();
    }, [fetchData]);

    const handleCreateShipment = async () => {
        if (!selectedOrder) return;
        setCreating(true);
        try {
            const result = await createVendorShipment({
                orderId: Number(selectedOrder),
                carrierCode: selectedCarrier
            });
            if (result.success) {
                await fetchData();
                setShowCreateModal(false);
                setSelectedOrder('');
                setSelectedCarrier('shiprocket');
            }
        } catch (err) {
            logError('VENDOR_PAGE', 'Failed to create shipment:', err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleGenerateLabel = async (labelId) => {
        try {
            await generateShippingLabel(labelId);
            await fetchData();
        } catch (err) {
            logError('VENDOR_PAGE', 'Failed to generate label:', err.message);
        }
    };

    const handleSchedulePickup = async (labelId) => {
        try {
            await schedulePickup(labelId);
            await fetchData();
        } catch (err) {
            logError('VENDOR_PAGE', 'Failed to schedule pickup:', err.message);
        }
    };

    const handleTrack = async (awbNumber) => {
        if (!awbNumber) return;
        setTrackingModal(awbNumber);
        setTrackingData(null);
        try {
            const data = await trackVendorShipment(awbNumber);
            setTrackingData(data);
        } catch (err) {
            setTrackingData({ error: err.message });
        }
    };

    const filteredLabels = labels.filter(l => {
        if (filterStatus !== 'All' && l.status !== filterStatus) return false;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
                (l.awbNumber && l.awbNumber.toLowerCase().includes(term)) ||
                (l.carrierName && l.carrierName.toLowerCase().includes(term)) ||
                String(l.orderId).includes(term)
            );
        }
        return true;
    });

    const openZoneModal = (zone) => {
        if (zone) {
            setEditingZone(zone);
            setZoneForm({
                name: zone.name || '', regions: zone.regions || '', pincodes: zone.pincodes || '',
                deliveryType: zone.deliveryType || 'STANDARD',
                baseRate: zone.baseRate?.toString() || '', ratePerKg: zone.ratePerKg?.toString() || '',
                freeShippingAbove: zone.freeShippingAbove?.toString() || '',
                estimatedDaysMin: zone.estimatedDaysMin?.toString() || '',
                estimatedDaysMax: zone.estimatedDaysMax?.toString() || '',
                isActive: zone.isActive ?? true,
            });
        } else {
            setEditingZone(null);
            setZoneForm({
                name: '', regions: '', pincodes: '', deliveryType: 'STANDARD',
                baseRate: '', ratePerKg: '', freeShippingAbove: '',
                estimatedDaysMin: '', estimatedDaysMax: '', isActive: true
            });
        }
        setShowZoneModal(true);
    };

    const handleSaveZone = async () => {
        if (!zoneForm.name.trim()) return;
        setZoneSaving(true);
        try {
            const payload = {
                name: zoneForm.name.trim(),
                regions: zoneForm.regions,
                pincodes: zoneForm.pincodes,
                deliveryType: zoneForm.deliveryType,
                baseRate: zoneForm.baseRate ? parseFloat(zoneForm.baseRate) : null,
                ratePerKg: zoneForm.ratePerKg ? parseFloat(zoneForm.ratePerKg) : null,
                freeShippingAbove: zoneForm.freeShippingAbove ? parseFloat(zoneForm.freeShippingAbove) : null,
                estimatedDaysMin: zoneForm.estimatedDaysMin ? parseInt(zoneForm.estimatedDaysMin) : null,
                estimatedDaysMax: zoneForm.estimatedDaysMax ? parseInt(zoneForm.estimatedDaysMax) : null,
                isActive: zoneForm.isActive,
            };
            if (editingZone) {
                await updateVendorShippingZone(editingZone.id, payload);
                toast.success('Zone updated');
            } else {
                await createVendorShippingZone(payload);
                toast.success('Zone created');
            }
            setShowZoneModal(false);
            const zoneData = await getVendorShippingZones();
            setZones(Array.isArray(zoneData) ? zoneData : []);
        } catch (err) {
            logError('VENDOR_PAGE', 'Failed to save zone:', err.message);
            toast.error(err.message || 'Failed to save shipping zone');
        } finally {
            setZoneSaving(false);
        }
    };

    const handleDeleteZone = async (id) => {
        try {
            await deleteVendorShippingZone(id);
            setZones(prev => prev.filter(z => z.id !== id));
            toast.success('Zone deleted');
        } catch (err) {
            logError('VENDOR_PAGE', 'Failed to delete zone:', err.message);
            toast.error(err.message || 'Failed to delete shipping zone');
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            'PENDING': { label: 'Pending', className: 'badge-pending' },
            'GENERATED': { label: 'Label Generated', className: 'badge-generated' },
            'MANIFESTED': { label: 'Manifested', className: 'badge-success' },
            'PICKUP_SCHEDULED': { label: 'Pickup Scheduled', className: 'badge-info' },
            'PICKED_UP': { label: 'Picked Up', className: 'badge-info' },
            'IN_TRANSIT': { label: 'In Transit', className: 'badge-warning' },
            'DELIVERED': { label: 'Delivered', className: 'badge-success' },
            'FAILED': { label: 'Failed', className: 'badge-danger' }
        };
        const info = map[status] || { label: status, className: 'badge-pending' };
        return <span className={`ship-status-badge ${info.className}`}>{info.label}</span>;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING': return <Clock size={16} style={{ color: '#f59e0b' }} />;
            case 'GENERATED': return <Printer size={16} style={{ color: '#3b82f6' }} />;
            case 'PICKUP_SCHEDULED': return <Calendar size={16} style={{ color: '#8b5cf6' }} />;
            case 'IN_TRANSIT': return <Truck size={16} style={{ color: '#f59e0b' }} />;
            case 'DELIVERED': return <CheckCircle2 size={16} style={{ color: '#10b981' }} />;
            default: return <Package size={16} style={{ color: '#94a3b8' }} />;
        }
    };

    const shipmentsContent = (
        <div className="vs-card">
            {shipments.length === 0 ? (
                <div className="vs-empty">
                    <Package size={48} />
                    <h3>No Shipments Yet</h3>
                    <p>Create your first shipment to start generating labels.</p>
                    <button className="vs-btn vs-btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={16} /> Create Shipment
                    </button>
                </div>
            ) : (
                <div className="vs-table-wrap">
                    <table className="vs-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Location</th>
                                <th>Carrier</th>
                                <th>Status</th>
                                <th>Ship Date</th>
                                <th>Est. Delivery</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shipments.map((s, i) => (
                                <tr key={s.id || i}>
                                    <td className="vs-cell-id">#{s.orderId}</td>
                                    <td>{s.customerName}</td>
                                    <td><span className="vs-location"><MapPin size={12} /> {s.customerLocation}</span></td>
                                    <td>{s.carrierName || '\u2014'}</td>
                                    <td>{getStatusBadge(s.status)}</td>
                                    <td>{s.shipDate || '\u2014'}</td>
                                    <td>{s.estDelivery || '\u2014'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const labelsContent = (
        <div className="vs-card">
            {filteredLabels.length === 0 ? (
                <div className="vs-empty">
                    <Printer size={48} />
                    <h3>No Labels Generated</h3>
                    <p>Create a shipment and generate a label to see it here.</p>
                </div>
            ) : (
                <div className="vs-table-wrap">
                    <table className="vs-table">
                        <thead>
                            <tr>
                                <th>AWB Number</th>
                                <th>Order</th>
                                <th>Carrier</th>
                                <th>Status</th>
                                <th>Cost</th>
                                <th>Est. Delivery</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLabels.map((l, i) => (
                                <tr key={l.id || i}>
                                    <td className="vs-cell-awb">
                                        {getStatusIcon(l.status)}
                                        <span>{l.awbNumber || 'AWB Pending'}</span>
                                    </td>
                                    <td>#{l.orderId}</td>
                                    <td>{l.carrierName}</td>
                                    <td>{getStatusBadge(l.status)}</td>
                                    <td className="vs-cell-cost">
                                        {l.shipmentCost ? `\u20B9${l.shipmentCost.toFixed(2)}` : '\u2014'}
                                    </td>
                                    <td>{l.estimatedDelivery || '\u2014'}</td>
                                    <td>
                                        <div className="vs-actions">
                                            {l.status === 'PENDING' && (
                                                <button
                                                    className="vs-action-btn"
                                                    title="Generate Label"
                                                    onClick={() => handleGenerateLabel(l.id)}
                                                >
                                                    <Printer size={15} />
                                                </button>
                                            )}
                                            {l.status === 'GENERATED' && (
                                                <>
                                                    <button
                                                        className="vs-action-btn"
                                                        title="Schedule Pickup"
                                                        onClick={() => handleSchedulePickup(l.id)}
                                                    >
                                                        <Calendar size={15} />
                                                    </button>
                                                    {l.labelUrl && (
                                                        <a
                                                            href={l.labelUrl}
                                                            className="vs-action-btn"
                                                            title="Download Label"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Download size={15} />
                                                        </a>
                                                    )}
                                                </>
                                            )}
                                            {l.awbNumber && (
                                                <button
                                                    className="vs-action-btn"
                                                    title="Track"
                                                    onClick={() => handleTrack(l.awbNumber)}
                                                >
                                                    <Eye size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const carriersContent = (
        <div className="vs-carriers-grid">
            {carriers.map((c, i) => (
                <div key={i} className={`vs-carrier-card ${c.active ? 'active' : 'inactive'}`}>
                    <div className="vs-carrier-top">
                        <div className="vs-carrier-icon">
                            <Truck size={24} />
                        </div>
                        <div>
                            <h3>{c.name}</h3>
                            <p className="vs-carrier-code">{c.code}</p>
                        </div>
                        <span className={`vs-carrier-status ${c.active ? 'connected' : 'disconnected'}`}>
                            {c.active ? 'Connected' : 'Available'}
                        </span>
                    </div>
                    <p className="vs-carrier-desc">{c.description}</p>
                    <div className="vs-carrier-bottom">
                        <span className="vs-status-tag">API Ready</span>
                        <span className="vs-status-tag">Pan India</span>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <VendorLayout>
            <div className="vendor-shipping">
                <div className="vendor-shipping-header">
                    <div>
                        <h1>Shipping & Labels</h1>
                        <p>Create shipments, generate labels, and manage deliveries</p>
                    </div>
                    <button className="vs-btn vs-btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} /> New Shipment
                    </button>
                </div>

                {error && (
                    <div className="vs-error-banner">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                        <button onClick={fetchData}><RefreshCw size={16} /></button>
                    </div>
                )}

                <div className="vs-kpi-row">
                    <div className="vs-kpi-card">
                        <div className="vs-kpi-icon blue"><PackageCheck size={22} /></div>
                        <div className="vs-kpi-body">
                            <span className="vs-kpi-value">{metrics.totalShipments}</span>
                            <span className="vs-kpi-label">Total Shipments</span>
                        </div>
                    </div>
                    <div className="vs-kpi-card">
                        <div className="vs-kpi-icon orange"><ClipboardList size={22} /></div>
                        <div className="vs-kpi-body">
                            <span className="vs-kpi-value">{metrics.pendingPickup}</span>
                            <span className="vs-kpi-label">Pending Pickup</span>
                        </div>
                    </div>
                    <div className="vs-kpi-card">
                        <div className="vs-kpi-icon green"><Truck size={22} /></div>
                        <div className="vs-kpi-body">
                            <span className="vs-kpi-value">{metrics.inTransit}</span>
                            <span className="vs-kpi-label">In Transit</span>
                        </div>
                    </div>
                    <div className="vs-kpi-card">
                        <div className="vs-kpi-icon purple"><Printer size={22} /></div>
                        <div className="vs-kpi-body">
                            <span className="vs-kpi-value">{labels.length}</span>
                            <span className="vs-kpi-label">Labels Generated</span>
                        </div>
                    </div>
                </div>

                <div className="vs-tabs-row">
                    <div className="vs-tabs">
                        <button
                            className={`vs-tab ${activeTab === 'shipments' ? 'active' : ''}`}
                            onClick={() => setActiveTab('shipments')}
                        >
                            <Package size={16} /> Shipments
                        </button>
                        <button
                            className={`vs-tab ${activeTab === 'labels' ? 'active' : ''}`}
                            onClick={() => setActiveTab('labels')}
                        >
                            <Printer size={16} /> Labels
                        </button>
                        <button
                            className={`vs-tab ${activeTab === 'carriers' ? 'active' : ''}`}
                            onClick={() => setActiveTab('carriers')}
                        >
                            <Truck size={16} /> Carriers
                        </button>
                        <button
                            className={`vs-tab ${activeTab === 'zones' ? 'active' : ''}`}
                            onClick={() => setActiveTab('zones')}
                        >
                            <MapPin size={16} /> Zones
                        </button>
                    </div>
                    <div className="vs-filters">
                        <div className="vs-search-box">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search by AWB, carrier, or order..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {activeTab === 'labels' && (
                            <select
                                className="vs-filter-select"
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="PENDING">Pending</option>
                                <option value="GENERATED">Generated</option>
                                <option value="PICKUP_SCHEDULED">Pickup Scheduled</option>
                                <option value="IN_TRANSIT">In Transit</option>
                                <option value="DELIVERED">Delivered</option>
                            </select>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="vs-loading">
                        <RefreshCw className="spinning" size={32} />
                        <p>Loading shipping data...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'shipments' && shipmentsContent}
                        {activeTab === 'labels' && labelsContent}
                        {activeTab === 'carriers' && carriersContent}
                        {activeTab === 'zones' && (
                            <div className="vs-card" style={{padding:'20px'}}>
                                <div className="vsz-header">
                                    <h2>Shipping Zones</h2>
                                    <button className="vs-btn vs-btn-primary" onClick={() => openZoneModal(null)}>
                                        <Plus size={16} /> Add Zone
                                    </button>
                                </div>
                                {zones.length === 0 ? (
                                    <div className="vs-empty">
                                        <MapPin size={48} />
                                        <h3>No Zones Configured</h3>
                                        <p>Define shipping zones to match customer regions with carriers and delivery estimates.</p>
                                    </div>
                                ) : (
                                    <div className="vsz-grid">
                                        {zones.map(zone => (
                                            <div key={zone.id} className="vsz-card">
                                                <div className="vsz-card-header">
                                                    <h3 className="vsz-card-name">{zone.name}</h3>
                                                    <span className={`vsz-card-badge ${(zone.deliveryType || 'standard').toLowerCase()}`}>
                                                        {(zone.deliveryType || 'STANDARD').replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="vsz-card-body">
                                                    <div className="vsz-card-row">
                                                        <span>Base Rate</span>
                                                        <span>{zone.baseRate != null ? `\u20B9${zone.baseRate}` : '\u2014'}</span>
                                                    </div>
                                                    <div className="vsz-card-row">
                                                        <span>Per Kg</span>
                                                        <span>{zone.ratePerKg != null ? `\u20B9${zone.ratePerKg}` : '\u2014'}</span>
                                                    </div>
                                                    <div className="vsz-card-row">
                                                        <span>Free above</span>
                                                        <span>{zone.freeShippingAbove != null ? `\u20B9${zone.freeShippingAbove}` : '\u2014'}</span>
                                                    </div>
                                                    <div className="vsz-card-row">
                                                        <span>Delivery</span>
                                                        <span>{zone.estimatedDaysMin != null ? `${zone.estimatedDaysMin}\u2013${zone.estimatedDaysMax || '-'} days` : '\u2014'}</span>
                                                    </div>
                                                    <div className="vsz-card-row">
                                                        <span>Regions</span>
                                                        <span>{zone.regions ? `${zone.regions.split(',').length} region(s)` : 'All'}</span>
                                                    </div>
                                                    <div className="vsz-card-row">
                                                        <span>Pincodes</span>
                                                        <span>{zone.pincodes ? `${zone.pincodes.split(',').length} pincode(s)` : 'All'}</span>
                                                    </div>
                                                    <div className="vsz-card-row">
                                                        <span>Status</span>
                                                        <span>{zone.isActive ? 'Active' : 'Disabled'}</span>
                                                    </div>
                                                </div>
                                                <div className="vsz-card-footer">
                                                    <button className="vs-action-btn" onClick={() => openZoneModal(zone)} title="Edit">
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button className="vs-action-btn" onClick={() => handleDeleteZone(zone.id)} title="Delete" style={{color:'#dc2626'}}>
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {showCreateModal && (
                    <div className="vs-modal-overlay" onClick={() => setShowCreateModal(false)}>
                        <div className="vs-modal" onClick={e => e.stopPropagation()}>
                            <div className="vs-modal-header">
                                <h2>Create New Shipment</h2>
                                <button className="vs-modal-close" onClick={() => setShowCreateModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="vs-modal-body">
                                <div className="vs-form-group">
                                    <label>Select Order</label>
                                    <select
                                        className="vs-select"
                                        value={selectedOrder}
                                        onChange={e => setSelectedOrder(e.target.value)}
                                    >
                                        <option value="">Choose an order...</option>
                                        {orders.map(o => (
                                            <option key={o.id} value={o.id}>
                                                #{o.id} - {o.customerName || 'Customer'} - \u20B9{o.totalAmount?.toFixed(2)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="vs-form-group">
                                    <label>Shipping Carrier</label>
                                    <div className="vs-carrier-options">
                                        {carriers.map(c => (
                                            <label
                                                key={c.code}
                                                className={`vs-carrier-option ${selectedCarrier === c.code ? 'selected' : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="carrier"
                                                    value={c.code}
                                                    checked={selectedCarrier === c.code}
                                                    onChange={e => setSelectedCarrier(e.target.value)}
                                                />
                                                <Truck size={18} />
                                                <span>{c.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="vs-modal-footer">
                                <button className="vs-btn vs-btn-secondary" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </button>
                                <button
                                    className="vs-btn vs-btn-primary"
                                    onClick={handleCreateShipment}
                                    disabled={!selectedOrder || creating}
                                >
                                    {creating ? 'Creating...' : 'Create Shipment'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {trackingModal && (
                    <div className="vs-modal-overlay" onClick={() => { setTrackingModal(null); setTrackingData(null); }}>
                        <div className="vs-modal" onClick={e => e.stopPropagation()}>
                            <div className="vs-modal-header">
                                <h2>Track Shipment — {trackingModal}</h2>
                                <button className="vs-modal-close" onClick={() => { setTrackingModal(null); setTrackingData(null); }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="vs-modal-body">
                                {!trackingData ? (
                                    <div className="vs-loading-sm"><RefreshCw className="spinning" size={24} /> Loading tracking...</div>
                                ) : trackingData.error ? (
                                    <div className="vs-error-inline">{trackingData.error}</div>
                                ) : (
                                    <div className="vs-tracking-detail">
                                        <div className="vs-track-header">
                                            <span className="vs-track-status">{trackingData.status}</span>
                                            <span className="vs-track-est">Est: {trackingData.estimatedDelivery}</span>
                                        </div>
                                        <div className="vs-timeline">
                                            {(trackingData.updates || []).map((u, i) => (
                                                <div key={i} className={`vs-timeline-item ${i === 0 ? 'current' : ''}`}>
                                                    <div className="vs-timeline-dot" />
                                                    <div className="vs-timeline-content">
                                                        <span className="vs-timeline-status">{u.status}</span>
                                                        <span className="vs-timeline-location">{u.location}</span>
                                                        <span className="vs-timeline-date">
                                                            {u.timestamp ? new Date(u.timestamp).toLocaleDateString() : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="vs-modal-footer">
                                <button className="vs-btn vs-btn-secondary" onClick={() => { setTrackingModal(null); setTrackingData(null); }}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Zone Modal */}
                {showZoneModal && (
                    <div className="vs-modal-overlay" onClick={() => setShowZoneModal(false)}>
                        <div className="vs-modal" onClick={e => e.stopPropagation()}>
                            <div className="vs-modal-header">
                                <h2>{editingZone ? 'Edit Shipping Zone' : 'Create Shipping Zone'}</h2>
                                <button className="vs-modal-close" onClick={() => setShowZoneModal(false)}><X size={20} /></button>
                            </div>
                            <div className="vs-modal-body">
                                <div className="vsz-form-row">
                                    <label>Zone Name <span className="vsz-req">*</span></label>
                                    <input className="vsz-input" placeholder="e.g. North India"
                                        value={zoneForm.name}
                                        onChange={e => setZoneForm(p => ({ ...p, name: e.target.value }))} />
                                </div>
                                <div className="vsz-form-row">
                                    <label>Delivery Type</label>
                                    <select className="vsz-input"
                                        value={zoneForm.deliveryType}
                                        onChange={e => setZoneForm(p => ({ ...p, deliveryType: e.target.value }))}>
                                        <option value="STANDARD">Standard</option>
                                        <option value="EXPRESS">Express</option>
                                        <option value="SAME_DAY">Same Day</option>
                                    </select>
                                </div>
                                <div className="vsz-form-row">
                                    <label>Regions <span style={{fontSize:'0.75rem',color:'#94a3b8',fontWeight:400}}>(comma-separated states/cities, empty = all)</span></label>
                                    <input className="vsz-input" placeholder="e.g. Maharashtra, Gujarat, Delhi"
                                        value={zoneForm.regions}
                                        onChange={e => setZoneForm(p => ({ ...p, regions: e.target.value }))} />
                                </div>
                                <div className="vsz-form-row">
                                    <label>Pincodes</label>
                                    <textarea className="vsz-input" rows={3}
                                        placeholder="Comma-separated pincodes or paste CSV column (one per line / comma separated)&#10;e.g. 400001, 400002, 400003"
                                        value={zoneForm.pincodes}
                                        onChange={e => setZoneForm(p => ({ ...p, pincodes: e.target.value }))} />
                                    <div style={{display:'flex',gap:8,marginTop:8}}>
                                        <label className="vs-btn vs-btn-secondary" style={{cursor:'pointer',fontSize:'0.78rem'}}>
                                            Upload CSV
                                            <input type="file" accept=".csv" hidden
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => {
                                                        const text = ev.target?.result;
                                                        if (typeof text === 'string') {
                                                            const pincodes = text.split(/[,\n\r]+/).map(s => s.trim()).filter(Boolean).join(', ');
                                                            setZoneForm(p => ({ ...p, pincodes }));
                                                        }
                                                    };
                                                    reader.readAsText(file);
                                                    e.target.value = '';
                                                }} />
                                        </label>
                                        {zoneForm.pincodes && (
                                            <span style={{fontSize:'0.78rem',color:'#64748b',alignSelf:'center'}}>
                                                {zoneForm.pincodes.split(',').length} pincode(s)
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="vsz-row-half">
                                    <div className="vsz-form-row">
                                        <label>Base Rate (₹)</label>
                                        <input className="vsz-input" type="number" min="0" step="0.01"
                                            value={zoneForm.baseRate}
                                            onChange={e => setZoneForm(p => ({ ...p, baseRate: e.target.value }))} />
                                    </div>
                                    <div className="vsz-form-row">
                                        <label>Rate per Kg (₹)</label>
                                        <input className="vsz-input" type="number" min="0" step="0.01"
                                            value={zoneForm.ratePerKg}
                                            onChange={e => setZoneForm(p => ({ ...p, ratePerKg: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="vsz-row-half">
                                    <div className="vsz-form-row">
                                        <label>Free shipping above (₹)</label>
                                        <input className="vsz-input" type="number" min="0" step="0.01"
                                            value={zoneForm.freeShippingAbove}
                                            onChange={e => setZoneForm(p => ({ ...p, freeShippingAbove: e.target.value }))} />
                                    </div>
                                    <div className="vsz-form-row">
                                        <label>Est. Days (min)</label>
                                        <input className="vsz-input" type="number" min="1"
                                            value={zoneForm.estimatedDaysMin}
                                            onChange={e => setZoneForm(p => ({ ...p, estimatedDaysMin: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="vsz-row-half">
                                    <div className="vsz-form-row">
                                        <label>Est. Days (max)</label>
                                        <input className="vsz-input" type="number" min="1"
                                            value={zoneForm.estimatedDaysMax}
                                            onChange={e => setZoneForm(p => ({ ...p, estimatedDaysMax: e.target.value }))} />
                                    </div>
                                    <div className="vsz-form-row">
                                        <label>Active</label>
                                        <label style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                                            <input type="checkbox" checked={zoneForm.isActive}
                                                onChange={e => setZoneForm(p => ({ ...p, isActive: e.target.checked }))} />
                                            <span style={{fontSize:'0.85rem',color:'#475569'}}>{zoneForm.isActive ? 'Active' : 'Disabled'}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="vs-modal-footer">
                                <button className="vs-btn vs-btn-secondary" onClick={() => setShowZoneModal(false)}>Cancel</button>
                                <button className="vs-btn vs-btn-primary" onClick={handleSaveZone} disabled={zoneSaving || !zoneForm.name.trim()}>
                                    {zoneSaving ? 'Saving...' : (editingZone ? 'Update Zone' : 'Create Zone')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </VendorLayout>
    );
};

export default VendorShipping;
