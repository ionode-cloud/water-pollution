import React from 'react';
import MapComponent from './MapComponent';

function RiverDetails({ river }) {
    if (!river) {
        return (
            <div className="details" id="detailsPanel">
                <div className="section-title">Select a river</div>
                <p className="details-small">
                    Choose a river card on the left to view:
                </p>
                <ul style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "6px", marginLeft: "18px", lineHeight: "1.5" }}>
                    <li>pH, TDS, turbidity, dissolved oxygen levels</li>
                    <li>Water temperature, water level, environmental conditions</li>
                    <li>AI-powered pollution predictions</li>
                    <li>Real-time water quality assessment with issue tracking</li>
                </ul>
                <p className="info">
                    Thresholds are based on BIS IS 10500:2012 drinking water specifications and CPCB surface water quality criteria. AI predictions are provided directly from the backend analysis system.
                </p>
            </div>
        );
    }

    const p = river;
    const polluted = river.polluted !== undefined ? river.polluted : false;
    const statusClass = polluted ? "status-bad" : "status-good";
    const statusText = polluted ? "Polluted" : "Not Polluted";
    const icon = polluted ? "⚠️" : "✅";

    return (
        <div className="details" id="detailsPanel">
            <div className="details-header">
                <div>
                    <div className="section-title">Current Status</div>
                    <div className="details-river-name">{river.name || "Unknown River"}</div>
                    <div className="details-small">
                        {river.locationName || "Unknown Location"}<br />
                        Lat: {river.lat?.toFixed(4) || "N/A"}, Lon: {river.lon?.toFixed(4) || "N/A"}
                    </div>
                </div>
            </div>

            <div className={`status-badge ${statusClass}`}>
                <span>{icon}</span>
                <span>{statusText}</span>
            </div>

            <div className="main-content-grid">
                <div className="prediction-card-large">
                    <div>
                        <div className="prediction-title">Prediction</div>
                    </div>
                    <div className="prediction-value">{river.prediction || "No prediction available"}</div>
                </div>

                <div className="params-grid">
                    <div className="param-card">
                        <div className="param-icon">🧪</div>
                        <div>
                            <div className="param-label">pH Level</div>
                            <div className={`param-value ${(p.pH < 6.5 || p.pH > 8.5) ? "flag-bad" : ""}`}>{p.pH?.toFixed(2) || "N/A"}</div>
                            <div className="param-unit">Standard: 6.5-8.5</div>
                        </div>
                    </div>
                    <div className="param-card">
                        <div className="param-icon">💧</div>
                        <div>
                            <div className="param-label">TDS</div>
                            <div className={`param-value ${p.tds > 500 ? "flag-bad" : ""}`}>{p.tds?.toFixed(0) || "N/A"}</div>
                            <div className="param-unit">mg/L (Max: 500)</div>
                        </div>
                    </div>
                    <div className="param-card">
                        <div className="param-icon">🌫️</div>
                        <div>
                            <div className="param-label">Turbidity</div>
                            <div className={`param-value ${p.turbidity > 20 ? "flag-bad" : ""}`}>{p.turbidity?.toFixed(1) || "N/A"}</div>
                            <div className="param-unit">NTU (Max: 20)</div>
                        </div>
                    </div>
                    <div className="param-card">
                        <div className="param-icon">🐟</div>
                        <div>
                            <div className="param-label">Dissolved O₂</div>
                            <div className={`param-value ${p.dissolvedOxygen < 5 ? "flag-bad" : ""}`}>{p.dissolvedOxygen?.toFixed(1) || "N/A"}</div>
                            <div className="param-unit">mg/L (Min: 5)</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="additional-params">
                <div className="param-card">
                    <div className="param-icon">🌡️</div>
                    <div>
                        <div className="param-label">Water Temp</div>
                        <div className="param-value">{p.waterTemp?.toFixed(1) || "N/A"}</div>
                        <div className="param-unit">°C</div>
                    </div>
                </div>
                <div className="param-card">
                    <div className="param-icon">📏</div>
                    <div>
                        <div className="param-label">Water Level</div>
                        <div className="param-value">{p.waterLevel?.toFixed(2) || "N/A"}</div>
                        <div className="param-unit">meters</div>
                    </div>
                </div>
                <div className="param-card">
                    <div className="param-icon">☀️</div>
                    <div>
                        <div className="param-label">Env. Temp</div>
                        <div className="param-value">{p.envTemp?.toFixed(1) || "N/A"}</div>
                        <div className="param-unit">°C</div>
                    </div>
                </div>
                <div className="param-card">
                    <div className="param-icon">🧭</div>
                    <div>
                        <div className="param-label">Pressure</div>
                        <div className="param-value">{p.pressure?.toFixed(0) || "N/A"}</div>
                        <div className="param-unit">hPa</div>
                    </div>
                </div>
            </div>

            {river.issues && Array.isArray(river.issues) && river.issues.length > 0 ? (
                <div className="issues-box">
                    <div className="issues-title">⚠️ Issues Detected</div>
                    <ul className="issues-list">
                        {river.issues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                        ))}
                    </ul>
                </div>
            ) : !polluted ? (
                <div className="info" style={{ background: "#f0fdf4", padding: "10px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                    ✅ All main parameters are within safe target ranges.
                </div>
            ) : null}

            <MapComponent river={river} />

            <div className="info" style={{ marginTop: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                <strong>Last Updated:</strong> {river.updatedAt ? new Date(river.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : "Unknown"}
            </div>
        </div>
    );
}

export default RiverDetails;
