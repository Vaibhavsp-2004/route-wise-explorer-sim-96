
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { SimulationResult, MapType, Location } from '../types';
import { mapLocations, getMapCenter, getMapZoom } from '../data/maps';

interface MapViewProps {
  mapType: MapType;
  result: SimulationResult | null;
  compareResult: SimulationResult | null;
  startLocation: string;
  showCompare?: boolean;
}

// Define custom icons for markers
const startIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const visitedIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Function to get route coordinates from TSP path using location names
const getRouteCoordinates = (path: string[], locations: Location[]): [number, number][] => {
  if (!path || !locations) return [];
  
  return path.map(locationName => {
    // Find location by name instead of ID
    const location = locations.find(loc => loc.name === locationName || loc.id === locationName);
    if (!location) {
      console.warn(`Location not found for: ${locationName}`);
      return [0, 0] as [number, number];
    }
    return [location.lat, location.lng] as [number, number];
  }).filter(coord => coord[0] !== 0 || coord[1] !== 0); // Filter out invalid coordinates
};

// MapUpdater component for handling map view changes
const MapUpdater = ({ mapType, result }: { mapType: MapType, result: SimulationResult | null }) => {
  const map = useMap();
  
  useEffect(() => {
    const center = getMapCenter(mapType);
    const zoom = getMapZoom(mapType);
    map.setView(center, zoom);
  }, [map, mapType]);
  
  return null;
};

const MapView = ({ 
  mapType, 
  result, 
  compareResult,
  startLocation, 
  showCompare = false
}: MapViewProps) => {
  const [initialized, setInitialized] = useState(false);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [compareRoutePath, setCompareRoutePath] = useState<[number, number][]>([]);
  const mapRef = useRef(null);
  
  const center = getMapCenter(mapType);
  const zoom = getMapZoom(mapType);
  const locations = mapLocations[mapType] || [];
  
  // Update TSP route when result changes
  useEffect(() => {
    if (result && result.path.length > 0 && locations.length > 0) {
      const coordinates = getRouteCoordinates(result.path, locations);
      if (coordinates.length > 0) {
        setRoutePath(coordinates);
      }
    } else {
      setRoutePath([]);
    }

    if (showCompare && compareResult && compareResult.path.length > 0 && locations.length > 0) {
      const compareCoordinates = getRouteCoordinates(compareResult.path, locations);
      if (compareCoordinates.length > 0) {
        setCompareRoutePath(compareCoordinates);
      }
    } else {
      setCompareRoutePath([]);
    }
  }, [result, compareResult, mapType, locations, showCompare]);
  
  useEffect(() => {
    // Add a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!initialized) {
    return <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">Loading TSP map...</div>;
  }
  
  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border">
      {initialized && (
        <MapContainer 
          ref={mapRef}
          center={center} 
          zoom={zoom} 
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapUpdater mapType={mapType} result={result} />
          
          {/* Place markers for all locations in TSP tour */}
          {locations.map((location) => {
            // Determine which icon to use - start location gets special icon
            let icon = visitedIcon;
            if (location.id === startLocation || location.name === startLocation) {
              icon = startIcon;
            }
            
            return (
              <Marker
                key={location.id}
                position={[location.lat, location.lng]}
                icon={icon}
              >
                <Popup>
                  <strong>{location.name}</strong>
                  {(location.id === startLocation || location.name === startLocation) && (
                    <div className="text-sm text-green-600">TSP Start/End Point</div>
                  )}
                </Popup>
              </Marker>
            );
          })}
          
          {/* Draw primary TSP route if available */}
          {routePath.length > 1 && (
            <Polyline 
              key={`primary-tsp-${result?.algorithm}-${routePath.length}`}
              positions={routePath} 
              color={result?.algorithm === 'brute-force' ? '#3B82F6' : 
                    result?.algorithm === 'dynamic-programming' ? '#10B981' : 
                    result?.algorithm === 'nearest-neighbor' ? '#8B5CF6' : 
                    '#F59E0B'}
              weight={5}
              opacity={0.8}
              className="tsp-route"
            />
          )}

          {/* Draw comparison TSP route if available */}
          {showCompare && compareRoutePath.length > 1 && (
            <Polyline 
              key={`compare-tsp-${compareResult?.algorithm}-${compareRoutePath.length}`}
              positions={compareRoutePath} 
              color={compareResult?.algorithm === 'brute-force' ? '#3B82F6' : 
                    compareResult?.algorithm === 'dynamic-programming' ? '#10B981' : 
                    compareResult?.algorithm === 'nearest-neighbor' ? '#8B5CF6' : 
                    '#F59E0B'}
              weight={5}
              opacity={0.6}
              dashArray="5,10"
              className="tsp-compare-route"
            />
          )}
        </MapContainer>
      )}
    </div>
  );
};

export default MapView;
