import React, { useState, useEffect } from 'react';
import Hero from './components/Hero';
import RiverList from './components/RiverList';
import RiverDetails from './components/RiverDetails';

const API_BASE = import.meta.env.VITE_API_BASE || "https://waterpollution.api.ionode.cloud";

function App() {
    const [riversData, setRiversData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const fetchRivers = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE}/rivers`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (isMounted) {
                    setRiversData(data);
                    if (data && data.length > 0) {
                        setSelectedIndex(0);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchRivers();
        
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="app">
            <Hero />
            <div className="content">
                <RiverList 
                    rivers={riversData} 
                    selectedIndex={selectedIndex} 
                    onSelectRiver={setSelectedIndex} 
                    loading={loading}
                    error={error}
                />
                <RiverDetails 
                    river={selectedIndex !== null ? riversData[selectedIndex] : null} 
                />
            </div>
        </div>
    );
}

export default App;
