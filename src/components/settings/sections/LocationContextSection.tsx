'use client';

import { useState, useEffect } from 'react';
import { getContextService } from '@/modules/module-system';

export function LocationContextSection() {
  const [contextService, setContextService] = useState<ReturnType<typeof getContextService> | null>(null);
  const [currentLocation, setCurrentLocation] = useState('Unknown');
  const [locationDebug, setLocationDebug] = useState('Click "Refresh Location" to detect your current position');
  const [locationPermission, setLocationPermission] = useState<PermissionState>('prompt');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const context = getContextService();
      setContextService(context);
      
      // Check location permission
      navigator.permissions?.query({ name: 'geolocation' as PermissionName }).then((result) => {
        setLocationPermission(result.state);
        result.addEventListener('change', () => {
          setLocationPermission(result.state);
        });
      });
      
      // Get current location context
      const locationData = context.getCurrentContext('location');
      if (locationData) {
        updateLocationDisplay(locationData);
      }
    }
  }, []);

  const updateLocationDisplay = (locationData: any) => {
    if (locationData.latitude && locationData.longitude) {
      setCurrentLocation(`${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`);
      setLocationDebug(`Accuracy: ${locationData.accuracy?.toFixed(0)}m`);
    }
  };

  // EXACT COPY FROM HTML VERSION - Location detection
  const requestLocationPermission = async () => {
    if (!('geolocation' in navigator)) {
      setLocationDebug('Geolocation not supported');
      return;
    }

    setLocationDebug('Requesting location permission...');
    
    try {
      // Same exact options as HTML version
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes cache like HTML
        });
      });
      
      const { latitude, longitude, accuracy } = position.coords;
      
      // Store in localStorage exactly like HTML version
      const locationData = {
        latitude,
        longitude,
        accuracy,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      
      setCurrentLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      setLocationDebug(`Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`);
      
      // Update context service
      contextService?.updateContext('location', locationData, 'user');
      
    } catch (error: any) {
      const errorMessage = error.code === 1 ? 'Location access denied' :
                          error.code === 2 ? 'Location unavailable' :
                          error.code === 3 ? 'Location timeout' :
                          `Location error: ${error.message}`;
      setLocationDebug(errorMessage);
    }
  };

  const forceLocationRefresh = async () => {
    setLocationDebug('Refreshing location...');
    await requestLocationPermission();
  };

  const showLocationManager = () => {
    // This would open a modal to manage saved locations
    console.log('Opening location manager...');
    alert('Location Manager - Coming Soon!\n\nThis will allow you to:\n• Save favorite locations\n• Set location-based boards\n• Configure location triggers');
  };

  const manualSetLocation = () => {
    const lat = prompt('Enter latitude:');
    const lng = prompt('Enter longitude:');
    
    if (lat && lng) {
      const locationData = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        accuracy: 0,
        manual: true
      };
      
      contextService?.updateContext('location', locationData, 'manual');
      updateLocationDisplay(locationData);
      setLocationDebug('Location set manually');
    }
  };

  return (
    <div className="settings-section">
      <h3>📍 Location & Context</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label>
          Current Location: <span id="currentLocationDisplay" style={{ color: '#4A90E2' }}>
            {currentLocation}
          </span>
        </label>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }} id="locationDebugInfo">
          {locationDebug}
        </div>
      </div>
      
      <div className="action-buttons">
        <button 
          className="action-btn" 
          onClick={requestLocationPermission}
          disabled={locationPermission === 'denied'}
        >
          📍 Enable Location
        </button>
        <button className="action-btn" onClick={forceLocationRefresh}>
          🔄 Refresh Location
        </button>
        <button className="action-btn secondary" onClick={showLocationManager}>
          🗺️ Manage Locations
        </button>
        <button className="action-btn secondary" onClick={manualSetLocation}>
          📌 Set Location
        </button>
      </div>
      
      {locationPermission === 'denied' && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#ff6b6b' }}>
          Location permission denied. Please enable in browser settings.
        </div>
      )}
    </div>
  );
}