class ContextService {
      constructor() {
        this.locations = new Map();
        this.currentLocation = null;
        this.watchId = null;
        this.locationBoards = {
          home: ['home', 'family_routine', 'feelings'],
          school: ['classroom_schedule', 'social_communication', 'bathroom_request'],
          therapy: ['therapy_session', 'behavior_support', 'communication_goals'],
          restaurant: ['restaurant', 'food_choices', 'manners'],
          hospital: ['doctor_visit', 'calm_down', 'medical_needs'],
          park: ['playground', 'outdoor_activities', 'social_play']
        };
        this.wifiNetworks = new Map();
        this.lastKnownLocation = localStorage.getItem('lastKnownLocation');
      }
      
      initialize() {
        console.log('Context Service with WiFi Geolocation ready');
        this.loadGoogleMapsAPI();
        this.loadLocationMappings();
        this.startLocationTracking();
      }
      
      // Load Google Maps API for precise location detection
      loadGoogleMapsAPI() {
        if (window.google && window.google.maps) {
          console.log('Google Maps API already loaded');
          this.initializeGoogleMaps();
          return;
        }
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBSSl1eYpjPr2jvS1zFAaN0ZsUj_NezZs4&libraries=places&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;
        
        // Set up global callback
        window.initGoogleMaps = () => {
          this.initializeGoogleMaps();
        };
        
        document.head.appendChild(script);
      }
      
      // Initialize Google Maps services
      initializeGoogleMaps() {
        console.log('Google Maps API loaded successfully');
        
        // Initialize Places service for location identification
        this.placesService = new google.maps.places.PlacesService(document.createElement('div'));
        
        // Initialize Geocoder for reverse geocoding
        this.geocoder = new google.maps.Geocoder();
        
        // Start location tracking now that Maps API is ready
        this.startEnhancedLocationTracking();
      }
      
      // Load saved location-to-board mappings
      loadLocationMappings() {
        const saved = localStorage.getItem('locationMappings');
        if (saved) {
          try {
            const mappings = JSON.parse(saved);
            this.locationBoards = { ...this.locationBoards, ...mappings };
          } catch (error) {
            console.error('Failed to parse location mappings:', error);
          }
        }
      }
      
      // Save location mappings
      saveLocationMappings() {
        localStorage.setItem('locationMappings', JSON.stringify(this.locationBoards));
      }
      
      // Enhanced location tracking with Google Maps API
      startEnhancedLocationTracking() {
        if (!navigator.geolocation) {
          console.log('Geolocation not supported');
          this.fallbackToWiFi();
          return;
        }
        
        // Get initial position with enhanced accuracy
        navigator.geolocation.getCurrentPosition(
          (position) => this.handleEnhancedLocationUpdate(position),
          (error) => this.handleLocationError(error),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
        
        // Watch for location changes
        this.watchId = navigator.geolocation.watchPosition(
          (position) => this.handleEnhancedLocationUpdate(position),
          (error) => this.handleLocationError(error),
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 300000 }
        );
      }
      
      // Fallback to basic location tracking if Google Maps fails
      startLocationTracking() {
        if (!navigator.geolocation) {
          console.log('Geolocation not supported');
          this.fallbackToWiFi();
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          (position) => this.handleLocationUpdate(position),
          (error) => this.handleLocationError(error),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
        
        this.watchId = navigator.geolocation.watchPosition(
          (position) => this.handleLocationUpdate(position),
          (error) => this.handleLocationError(error),
          { enableHighAccuracy: false, timeout: 30000, maximumAge: 600000 }
        );
      }
      
      // Handle enhanced location updates with Google Maps API
      handleEnhancedLocationUpdate(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        
        console.log(`Enhanced Location: ${lat}, ${lng} (accuracy: ${accuracy}m)`);
        
        // Use Google Maps API for precise location identification
        this.identifyLocationWithGoogleMaps(lat, lng);
      }
      
      // Handle basic location updates (fallback)
      handleLocationUpdate(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        
        console.log(`Basic Location: ${lat}, ${lng} (accuracy: ${accuracy}m)`);
        
        const location = this.identifyLocation(lat, lng);
        if (location !== this.currentLocation) {
          this.currentLocation = location;
          localStorage.setItem('lastKnownLocation', location);
          this.showLocationBoard(location);
        }
      }
      
      // Use Google Maps API to identify precise location
      identifyLocationWithGoogleMaps(lat, lng) {
        if (!this.geocoder) {
          console.log('Google Maps Geocoder not available, using fallback');
          const location = this.identifyLocation(lat, lng);
          if (location !== this.currentLocation) {
            this.currentLocation = location;
            localStorage.setItem('lastKnownLocation', location);
            this.showLocationBoard(location);
          }
          return;
        }
        
        const latLng = new google.maps.LatLng(lat, lng);
        
        // First, try reverse geocoding to get the address
        this.geocoder.geocode({ location: latLng }, (results, status) => {
          if (status === 'OK' && results[0]) {
            console.log('Geocoding result:', results[0]);
            
            // Extract location type from address components
            const addressComponents = results[0].address_components;
            const formattedAddress = results[0].formatted_address;
            
            this.analyzeLocationFromAddress(addressComponents, formattedAddress, lat, lng);
          } else {
            console.log('Geocoder failed, using fallback location detection');
            this.identifyLocationFallback(lat, lng);
          }
        });
        
        // Also search for nearby places of interest
        this.searchNearbyPlaces(lat, lng);
      }
      
      // Analyze location from Google Maps address components
      analyzeLocationFromAddress(addressComponents, formattedAddress, lat, lng) {
        let detectedLocation = 'unknown';
        
        // Check for specific place types
        for (const component of addressComponents) {
          const types = component.types;
          
          if (types.includes('school')) {
            detectedLocation = 'school';
            break;
          } else if (types.includes('hospital') || types.includes('health')) {
            detectedLocation = 'hospital';
            break;
          } else if (types.includes('restaurant') || types.includes('food') || types.includes('meal_takeaway')) {
            detectedLocation = 'restaurant';
            break;
          } else if (types.includes('park')) {
            detectedLocation = 'park';
            break;
          } else if (types.includes('premise') && formattedAddress.toLowerCase().includes('home')) {
            detectedLocation = 'home';
            break;
          }
        }
        
        // Check saved custom locations first
        const customLocation = this.checkSavedLocations(lat, lng);
        if (customLocation) {
          detectedLocation = customLocation;
        }
        
        // Store the precise coordinates for this location
        this.saveLocationCoordinates(detectedLocation, lat, lng, formattedAddress);
        
        if (detectedLocation !== this.currentLocation) {
          console.log(`Location changed from ${this.currentLocation} to ${detectedLocation}`);
          this.currentLocation = detectedLocation;
          localStorage.setItem('lastKnownLocation', detectedLocation);
          
          // Update debug info
          const debugInfo = document.getElementById('locationDebugInfo');
          if (debugInfo) {
            debugInfo.textContent = `Detected via Google Maps: ${formattedAddress}`;
          }
          
          this.showLocationBoard(detectedLocation);
        }
      }
      
      // Search for nearby places using Google Places API
      searchNearbyPlaces(lat, lng) {
        if (!this.placesService) return;
        
        const location = new google.maps.LatLng(lat, lng);
        
        const request = {
          location: location,
          radius: 100, // 100 meter radius
          type: ['school', 'hospital', 'restaurant', 'park', 'doctor', 'pharmacy']
        };
        
        this.placesService.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
            console.log('Nearby places found:', results);
            
            // Use the closest high-confidence place
            const closestPlace = results[0];
            let placeType = 'unknown';
            
            if (closestPlace.types.includes('school')) {
              placeType = 'school';
            } else if (closestPlace.types.includes('hospital')) {
              placeType = 'hospital';
            } else if (closestPlace.types.includes('restaurant')) {
              placeType = 'restaurant';
            } else if (closestPlace.types.includes('park')) {
              placeType = 'park';
            } else if (closestPlace.types.includes('doctor')) {
              placeType = 'therapy';
            }
            
            if (placeType !== 'unknown' && placeType !== this.currentLocation) {
              console.log(`Nearby place detected: ${closestPlace.name} (${placeType})`);
              this.currentLocation = placeType;
              localStorage.setItem('lastKnownLocation', placeType);
              this.saveLocationCoordinates(placeType, lat, lng, closestPlace.name);
              this.showLocationBoard(placeType);
            }
          }
        });
      }
      
      // Save location coordinates for future reference
      saveLocationCoordinates(locationType, lat, lng, description) {
        let savedLocations = {};
        try {
          savedLocations = JSON.parse(localStorage.getItem('savedLocationCoordinates') || '{}');
        } catch (error) {
          console.error('Failed to parse saved locations:', error);
        }
        
        if (!savedLocations[locationType]) {
          savedLocations[locationType] = [];
        }
        
        // Add this location if it's not already saved
        const exists = savedLocations[locationType].some(loc => {
          const distance = this.calculateDistance(lat, lng, loc.lat, loc.lng);
          return distance < 50; // Within 50 meters
        });
        
        if (!exists) {
          savedLocations[locationType].push({
            lat,
            lng,
            description,
            timestamp: Date.now()
          });
          
          localStorage.setItem('savedLocationCoordinates', JSON.stringify(savedLocations));
          console.log(`Saved location: ${locationType} at ${description}`);
        }
      }
      
      // Check if current coordinates match any saved locations
      checkSavedLocations(lat, lng) {
        let savedLocations = {};
        try {
          savedLocations = JSON.parse(localStorage.getItem('savedLocationCoordinates') || '{}');
        } catch (error) {
          console.error('Failed to parse saved locations:', error);
        }
        
        for (const [locationType, locations] of Object.entries(savedLocations)) {
          for (const savedLoc of locations) {
            const distance = this.calculateDistance(lat, lng, savedLoc.lat, savedLoc.lng);
            if (distance < 100) { // Within 100 meters
              console.log(`Matched saved location: ${locationType} (${distance}m away)`);
              return locationType;
            }
          }
        }
        
        return null;
      }
      
      // Fallback location identification
      identifyLocationFallback(lat, lng) {
        const location = this.identifyLocation(lat, lng);
        if (location !== this.currentLocation) {
          this.currentLocation = location;
          localStorage.setItem('lastKnownLocation', location);
          this.showLocationBoard(location);
        }
      }
      
      // Handle location errors - fallback to WiFi
      handleLocationError(error) {
        console.log('Geolocation error:', error.message);
        this.fallbackToWiFi();
      }
      
      // Fallback to WiFi network detection
      fallbackToWiFi() {
        console.log('Using WiFi networks for location detection');
        this.detectWiFiNetworks();
        
        // Try to use last known location
        if (this.lastKnownLocation) {
          this.currentLocation = this.lastKnownLocation;
          this.showLocationBoard(this.lastKnownLocation);
        }
      }
      
      // Detect WiFi networks (browser limitations apply)
      detectWiFiNetworks() {
        // Modern browsers don't expose WiFi SSIDs for privacy
        // We'll use network timing and other signals as proxies
        this.detectNetworkCharacteristics();
      }
      
      // Detect network characteristics as location proxy
      detectNetworkCharacteristics() {
        if (!navigator.connection) return;
        
        const connection = navigator.connection;
        const networkInfo = {
          type: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          timestamp: Date.now()
        };
        
        // Try to match network characteristics to known locations
        this.matchNetworkToLocation(networkInfo);
      }
      
      // Match network characteristics to known locations
      matchNetworkToLocation(networkInfo) {
        const saved = localStorage.getItem('networkLocations');
        if (!saved) return;
        
        let networkLocations = {};
        try {
          networkLocations = JSON.parse(saved);
        } catch (error) {
          console.error('Failed to parse network locations:', error);
          return;
        }
        
        for (const [location, networks] of Object.entries(networkLocations)) {
          for (const network of networks) {
            if (this.isNetworkMatch(networkInfo, network)) {
              if (location !== this.currentLocation) {
                this.currentLocation = location;
                localStorage.setItem('lastKnownLocation', location);
                this.showLocationBoard(location);
              }
              return;
            }
          }
        }
      }
      
      // Check if network characteristics match
      isNetworkMatch(current, saved) {
        const rttDiff = Math.abs(current.rtt - saved.rtt);
        const downlinkDiff = Math.abs(current.downlink - saved.downlink);
        
        return rttDiff < 50 && downlinkDiff < 2 && current.type === saved.type;
      }
      
      // Identify location based on coordinates
      identifyLocation(lat, lng) {
        // Simple distance-based location detection
        // In production, you'd use reverse geocoding or geofencing
        
        const locations = {
          home: { lat: 0, lng: 0, radius: 100 }, // Set actual coordinates
          school: { lat: 0, lng: 0, radius: 200 },
          therapy: { lat: 0, lng: 0, radius: 100 },
          // Add more locations with actual coordinates
        };
        
        for (const [name, location] of Object.entries(locations)) {
          const distance = this.calculateDistance(lat, lng, location.lat, location.lng);
          if (distance <= location.radius) {
            return name;
          }
        }
        
        return 'unknown';
      }
      
      // Calculate distance between two points in meters
      calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lng2-lng1) * Math.PI/180;
        
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c;
      }
      
      // Show appropriate board for current location
      showLocationBoard(location) {
        console.log(`Detected location: ${location}`);
        
        const boardIds = this.locationBoards[location];
        if (!boardIds || boardIds.length === 0) {
          console.log(`No boards configured for location: ${location}`);
          return;
        }
        
        // Find the first available board
        for (const boardId of boardIds) {
          if (boards[boardId]) {
            console.log(`Switching to location board: ${boardId}`);
            navigateToBoard(boardId);
            this.showLocationNotification(location, boardId);
            return;
          }
        }
        
        // If no boards exist, suggest creating one
        this.suggestLocationBoard(location);
      }
      
      // Show notification about location-based board switch
      showLocationNotification(location, boardId) {
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 80px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 20px;
          border-radius: 12px;
          font-size: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          z-index: 9999;
          animation: slideInRight 0.5s ease;
          max-width: 300px;
        `;
        
        notification.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">📍</span>
            <div>
              <div style="font-weight: bold;">Location Detected</div>
              <div style="font-size: 14px; opacity: 0.9;">Switched to ${location} board</div>
            </div>
          </div>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.style.animation = 'slideOutRight 0.5s ease';
          setTimeout(() => notification.remove(), 500);
        }, 4000);
      }
      
      // Suggest creating a board for this location
      suggestLocationBoard(location) {
        const suggestion = document.createElement('div');
        suggestion.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          z-index: 10000;
          text-align: center;
          max-width: 400px;
        `;
        
        suggestion.innerHTML = `
          <div style="font-size: 48px; margin-bottom: 15px;">📍</div>
          <h3>New Location Detected</h3>
          <p>You're at "${location}". Would you like to create a communication board for this location?</p>
          <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
            <button class="action-btn" onclick="this.closest('div').remove(); moduleSystem.get('ContextService').createLocationBoard('${location}')">
              Create Board
            </button>
            <button class="action-btn secondary" onclick="this.closest('div').remove()">
              Not Now
            </button>
          </div>
        `;
        
        document.body.appendChild(suggestion);
      }
      
      // Create a board for a specific location
      createLocationBoard(location) {
        const boardCreationService = moduleSystem.get('BoardCreationService');
        if (boardCreationService) {
          // Set up wizard data for location-specific board
          boardCreationService.wizard.data = {
            purpose: 'custom',
            location: location,
            isLocationBoard: true
          };
          boardCreationService.openWizard();
        }
      }
      
      // Manual location setting with learning
      setLocation(location) {
        this.currentLocation = location;
        localStorage.setItem('lastKnownLocation', location);
        this.showLocationBoard(location);
        
        // Get current coordinates and save them for this location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              
              // Save these coordinates as a known location
              this.saveLocationCoordinates(location, lat, lng, `Manually set ${location}`);
              
              // Show confirmation
              this.showLocationNotification(location, 'location_learned');
              console.log(`Learned location: ${location} at ${lat}, ${lng}`);
            },
            (error) => {
              console.log('Could not get coordinates for manual location:', error);
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        }
        
        // Save current network characteristics for this location
        if (navigator.connection) {
          const networkInfo = {
            type: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
            timestamp: Date.now()
          };
          
          const saved = localStorage.getItem('networkLocations') || '{}';
          let networkLocations = {};
        try {
          networkLocations = JSON.parse(saved);
        } catch (error) {
          console.error('Failed to parse network locations:', error);
          return;
        }
          
          if (!networkLocations[location]) {
            networkLocations[location] = [];
          }
          
          networkLocations[location].push(networkInfo);
          localStorage.setItem('networkLocations', JSON.stringify(networkLocations));
        }
      }
      
      // Force location refresh
      forceLocationRefresh() {
        console.log('Forcing location refresh...');
        
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (this.geocoder) {
                this.handleEnhancedLocationUpdate(position);
              } else {
                this.handleLocationUpdate(position);
              }
            },
            (error) => {
              console.log('Location refresh failed:', error);
              this.fallbackToWiFi();
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        }
      }
      
      // Get current location
      getCurrentLocation() {
        return this.currentLocation || this.lastKnownLocation || 'unknown';
      }
      
      // Add location-board mapping
      addLocationBoard(location, boardId) {
        if (!this.locationBoards[location]) {
          this.locationBoards[location] = [];
        }
        
        if (!this.locationBoards[location].includes(boardId)) {
          this.locationBoards[location].push(boardId);
          this.saveLocationMappings();
        }
      }
      
      // Remove location-board mapping
      removeLocationBoard(location, boardId) {
        if (this.locationBoards[location]) {
          this.locationBoards[location] = this.locationBoards[location].filter(id => id !== boardId);
          this.saveLocationMappings();
        }
      }
      
      // Clean up
      destroy() {
        if (this.watchId) {
          navigator.geolocation.clearWatch(this.watchId);
        }
      }
    }