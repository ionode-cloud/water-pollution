import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapUpdater({ lat, lon }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lon) {
            map.setView([lat, lon], 12);
        }
    }, [lat, lon, map]);
    return null;
}

function MapComponent({ river }) {
    if (!river || !river.lat || !river.lon) {
        return (
            <div id="river-map" style={{ height: "250px", borderRadius: "8px", marginTop: "12px", border: "1px solid #e2e8f0", display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', background: '#f8fafc' }}>
                Location mapping not available (No Coordinates)
            </div>
        );
    }

    return (
        <div style={{ height: "250px", borderRadius: "8px", marginTop: "12px", border: "1px solid #e2e8f0", position: "relative", zIndex: 5, overflow: 'hidden' }}>
            <MapContainer center={[river.lat, river.lon]} zoom={12} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[river.lat, river.lon]}>
                    <Popup>
                        <b>{river.name || "River"}</b><br />{river.locationName || ""}
                    </Popup>
                </Marker>
                <MapUpdater lat={river.lat} lon={river.lon} />
            </MapContainer>
        </div>
    );
}

export default MapComponent;
