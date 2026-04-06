import React from 'react';

function RiverList({ rivers, selectedIndex, onSelectRiver, loading, error }) {
    return (
        <div className="river-panel">
            <div className="panel-title">Rivers</div>
            <div className="river-list">
                {loading && (
                    <div className="loading">
                        <div className="spinner"></div>
                        Loading rivers...
                    </div>
                )}
                {error && (
                    <div className="error">
                        <strong>⚠️ Error loading rivers</strong><br />
                        {error}<br />
                    </div>
                )}
                {!loading && !error && rivers.length === 0 && (
                    <div className="info" style={{ textAlign: "center", padding: "20px" }}>
                        No rivers found. Add some data to get started.
                    </div>
                )}
                {!loading && !error && rivers.map((r, index) => {
                    const riverClass = (r.name || "").toLowerCase().replace(/\s+/g, '');
                    return (
                        <div 
                            key={index} 
                            className={`river-card ${index === selectedIndex ? 'active' : ''}`}
                            onClick={() => onSelectRiver(index)}
                        >
                            <div className={`river-chip ${riverClass}`}>
                                {r.name ? r.name[0].toUpperCase() : "R"}
                            </div>
                            <div className="river-info">
                                <div className="river-name">{r.name || "Unknown River"}</div>
                                <div className="river-location">{r.locationName || "Unknown Location"}</div>
                                <div className="coords">
                                    Lat: {r.lat?.toFixed(4) || "N/A"}, Lon: {r.lon?.toFixed(4) || "N/A"}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default RiverList;
