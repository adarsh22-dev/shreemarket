import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { X, Search, MapPin, Navigation } from 'lucide-react';
import './MapModal.css';

const libraries = ['places'];
const mapContainerStyle = {
    width: '100%',
    height: '400px',
};

// Default center (Bangalore)
const defaultCenter = {
    lat: 12.9716,
    lng: 77.5946
};

// IMPORTANT: Replace with your actual Google Maps API Key
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const MapModal = ({ isOpen, onClose, onSelect, initialLat, initialLon }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries
    });

    const [map, setMap] = useState(null);
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

    const onMapLoad = useCallback((map) => {
        setMap(map);
    }, []);

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

                // Parse address components
                const details = parseAddressComponents(place.address_components);
                details.address = place.formatted_address;
                setAddressDetails(details);
            }
        }
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

    const parseAddressComponents = (components) => {
        const details = {
            city: '',
            state: '',
            country: '',
            pincode: ''
        };

        components.forEach(component => {
            const types = component.types;
            if (types.includes('locality')) {
                details.city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
                details.state = component.long_name;
            } else if (types.includes('country')) {
                details.country = component.long_name;
            } else if (types.includes('postal_code')) {
                details.pincode = component.long_name;
            }
        });

        return details;
    };

    const handleConfirm = () => {
        onSelect({
            latitude: markerPos.lat.toFixed(6),
            longitude: markerPos.lng.toFixed(6),
            ...addressDetails
        });
        onClose();
    };

    if (!isOpen) return null;

    if (loadError) {
        return (
            <div className="map-modal-overlay">
                <div className="map-modal-container p-8 text-center bg-white rounded-xl shadow-xl">
                    <h3 className="text-red-600 mb-4">Error loading Google Maps</h3>
                    <p className="text-gray-600 mb-6 font-medium">Please check your API key in the .env file.</p>
                    <button onClick={onClose} className="px-6 py-2 bg-gray-200 rounded-lg font-bold">Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="map-modal-overlay" onClick={onClose}>
            <div className="map-modal-container" onClick={e => e.stopPropagation()}>
                <div className="map-modal-header">
                    <div className="flex items-center gap-2">
                        <MapPin className="text-orange-500" size={24} />
                        <h3>Fetch Store Location</h3>
                    </div>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>

                <div className="map-search-container">
                    {isLoaded && (
                        <Autocomplete
                            onLoad={(ref) => (autocompleteRef.current = ref)}
                            onPlaceChanged={onPlaceSelected}
                        >
                            <div className="search-input-wrapper">
                                <Search className="search-icon" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search for your store location..."
                                    className="map-search-input"
                                />
                            </div>
                        </Autocomplete>
                    )}
                </div>

                <div className="map-content-body">
                    <div className="map-container-wrapper">
                        {isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={mapContainerStyle}
                                center={center}
                                zoom={15}
                                onLoad={onMapLoad}
                                onClick={onMapClick}
                                options={{
                                    streetViewControl: false,
                                    mapTypeControl: false,
                                    fullscreenControl: false
                                }}
                            >
                                <Marker position={markerPos} draggable={true} onDragEnd={onMapClick} />
                            </GoogleMap>
                        ) : (
                            <div className="map-loading">
                                <div className="spinner"></div>
                                <span>Loading Interactive Map...</span>
                            </div>
                        )}
                    </div>

                    <div className="location-info-panel">
                        <div className="info-header">
                            <Navigation size={14} className="text-orange-500" />
                            <span>SELECTED COORDINATES</span>
                        </div>
                        <div className="coords-row">
                            <div className="coord-box">
                                <label>LATITUDE</label>
                                <span>{markerPos.lat.toFixed(6)}</span>
                            </div>
                            <div className="coord-box border-l">
                                <label>LONGITUDE</label>
                                <span>{markerPos.lng.toFixed(6)}</span>
                            </div>
                        </div>

                        {addressDetails && (
                            <div className="address-preview">
                                <label>DETECTED ADDRESS</label>
                                <p>{addressDetails.address}</p>
                                <div className="detect-grid">
                                    <div><label>CITY</label><span>{addressDetails.city || 'N/A'}</span></div>
                                    <div><label>PINCODE</label><span>{addressDetails.pincode || 'N/A'}</span></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="map-modal-footer">
                    <p className="footer-tip">Tip: You can search or click directly on the map</p>
                    <button
                        className="select-location-btn"
                        onClick={handleConfirm}
                        disabled={!isLoaded}
                    >
                        Confirm & Auto-fill Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapModal;
