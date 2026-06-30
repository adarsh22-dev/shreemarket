import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { X, Search, MapPin, Navigation } from 'lucide-react';
import './MapModal.css';

const libraries = ['places'];
const mapContainerStyle = {
    width: '100%',
    height: '400px',
};

const defaultCenter = {
    lat: 12.9716,
    lng: 77.5946
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const MapModal = ({ isOpen, onClose, onSelect, initialLat, initialLon }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries
    });

    const [center, setCenter] = useState({
        lat: parseFloat(initialLat) || defaultCenter.lat,
        lng: parseFloat(initialLon) || defaultCenter.lng
    });
    const [markerPos, setMarkerPos] = useState({
        lat: parseFloat(initialLat) || defaultCenter.lat,
        lng: parseFloat(initialLon) || defaultCenter.lng
    });
    const [addressDetails, setAddressDetails] = useState(null);
    const autocompleteRef = useRef(null);

    const parseAddressComponents = (components) => {
        const details = {
            city: '',
            state: '',
            country: '',
            pincode: ''
        };
        if (!components) return details;
        for (const comp of components) {
            const types = comp.types;
            if (types.includes('locality')) details.city = comp.long_name;
            if (types.includes('administrative_area_level_1')) details.state = comp.long_name;
            if (types.includes('country')) details.country = comp.long_name;
            if (types.includes('postal_code')) details.pincode = comp.long_name;
        }
        return details;
    };

    const fetchAddressFromCoords = async (lat, lng) => {
        if (!window.google) return;
        const geocoder = new window.google.maps.Geocoder();
        try {
            const response = await geocoder.geocode({ location: { lat, lng } });
            if (response.results[0]) {
                const place = response.results[0];
                const details = parseAddressComponents(place.address_components);
                details.address = place.formatted_address;
                setAddressDetails(details);
            }
        } catch (error) {
            console.error("Geocoding failed:", error);
        }
    };

    const onMapLoad = useCallback(() => {}, []);

    const onMapClick = useCallback((e) => {
        const newPos = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        };
        setMarkerPos(newPos);
        fetchAddressFromCoords(newPos.lat, newPos.lng);
    }, []);

    const onPlaceSelected = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry) {
                const newPos = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };
                setCenter(newPos);
                setMarkerPos(newPos);

                const details = parseAddressComponents(place.address_components);
                details.address = place.formatted_address;
                setAddressDetails(details);
            }
        }
    };

    // ... rest of the component remains the same
    if (!isOpen) return null;

    return (
        <div className="map-modal-overlay" onClick={onClose}>
            <div className="map-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="map-modal-header">
                    <h3><MapPin size={18} /> Select Location</h3>
                    <button className="map-modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                {/* Search Bar */}
                {isLoaded && (
                    <div className="map-modal-search">
                        <Autocomplete
                            onLoad={ref => autocompleteRef.current = ref}
                            onPlaceChanged={onPlaceSelected}
                        >
                            <div className="map-search-input-wrapper">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Search for a place..."
                                    style={{ border: 'none', outline: 'none', flex: 1, fontSize: '0.9rem' }}
                                />
                            </div>
                        </Autocomplete>
                    </div>
                )}

                {/* Map */}
                <div className="map-modal-map">
                    {loadError ? (
                        <div className="map-error">
                            <p>Error loading Google Maps. Please check your API key.</p>
                        </div>
                    ) : !isLoaded ? (
                        <div className="map-loading">
                            <div className="map-spinner"></div>
                            <p>Loading map...</p>
                        </div>
                    ) : (
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={center}
                            zoom={15}
                            onLoad={onMapLoad}
                            onClick={onMapClick}
                        >
                            <Marker position={markerPos} draggable={true}
                                onDragEnd={(e) => {
                                    const newPos = {
                                        lat: e.latLng.lat(),
                                        lng: e.latLng.lng()
                                    };
                                    setMarkerPos(newPos);
                                    fetchAddressFromCoords(newPos.lat, newPos.lng);
                                }}
                            />
                        </GoogleMap>
                    )}
                </div>

                {/* Selected Location Info */}
                {addressDetails && (
                    <div className="map-modal-info">
                        <p><strong>Selected Location:</strong></p>
                        <p><MapPin size={14} /> {addressDetails.address}</p>
                        <div className="map-details-grid">
                            {addressDetails.city && <span>City: {addressDetails.city}</span>}
                            {addressDetails.state && <span>State: {addressDetails.state}</span>}
                            {addressDetails.pincode && <span>Pincode: {addressDetails.pincode}</span>}
                            {addressDetails.country && <span>Country: {addressDetails.country}</span>}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="map-modal-actions">
                    <button className="map-btn map-btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="map-btn map-btn-primary"
                        onClick={() => onSelect({
                            lat: markerPos.lat,
                            lng: markerPos.lng,
                            ...addressDetails
                        })}
                    >
                        <Navigation size={16} /> Confirm Location
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapModal;
