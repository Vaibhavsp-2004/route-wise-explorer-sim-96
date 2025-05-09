
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { SimulationResult, MapType, Location } from '../types';
import { mapLocations, getMapCenter, getMapZoom } from '../data/maps';

interface MapViewProps {
  mapType: MapType;
  result: SimulationResult | null;
  startLocation: string;
  endLocation: string;
}

// Define custom icons for markers
const startIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const endIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const nodeIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Component to handle map view updates when props change
const MapUpdater = ({ mapType, result }: { mapType: MapType, result: SimulationResult | null }) => {
  const map = useMap();
  
  useEffect(() => {
    const center = getMapCenter(mapType);
    const zoom = getMapZoom(mapType);
    map.setView(center, zoom);
  }, [map, mapType]);
  
  return null;
};

// Function to get route coordinates from path
const getRouteCoordinates = (path: string[], locations: Record<string, Location>): [number, number][] => {
  return path.map(nodeId => {
    const location = locations[nodeId];
    return [location.lat, location.lng];
  });
};

// Get a map of all locations by ID
const getLocationsMap = (mapType: MapType): Record<string, Location> => {
  const locationsMap: Record<string, Location> = {};
  mapLocations[mapType].forEach(location => {
    locationsMap[location.id] = location;
  });
  return locationsMap;
};

const MapView = ({ mapType, result, startLocation, endLocation }: MapViewProps) => {
  const [initialized, setInitialized] = useState(false);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const center = getMapCenter(mapType);
  const zoom = getMapZoom(mapType);
  const locationsMap = getLocationsMap(mapType);
  const locations = mapLocations[mapType];
  
  // Update route when result changes
  useEffect(() => {
    if (result && result.path.length > 0) {
      setRoutePath(getRouteCoordinates(result.path, locationsMap));
    } else {
      setRoutePath([]);
    }
  }, [result, mapType, locationsMap]);
  
  useEffect(() => {
    // Add a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!initialized) {
    return <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">Loading map...</div>;
  }
  
  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater mapType={mapType} result={result} />
        
        {/* Place markers for all locations */}
        {locations.map((location) => {
          // Determine which icon to use
          let icon = nodeIcon;
          if (location.id === startLocation) icon = startIcon;
          if (location.id === endLocation) icon = endIcon;
          
          return (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
              icon={icon}
            >
              <Popup>
                <strong>{location.name}</strong>
              </Popup>
            </Marker>
          );
        })}
        
        {/* Draw route if available */}
        {routePath.length > 0 && (
          <Polyline 
            positions={routePath} 
            color={result?.algorithm === 'dijkstra' ? '#3B82F6' : 
                  result?.algorithm === 'astar' ? '#10B981' : 
                  result?.algorithm === 'bellman-ford' ? '#8B5CF6' : 
                  '#F59E0B'}
            weight={5}
            opacity={0.8}
            className="algorithm-route"
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
