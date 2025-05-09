
import { Location, MapType, RouteGraph } from "../types";

// Location coordinates for different maps
export const mapLocations: Record<MapType, Location[]> = {
  city: [
    { id: "c1", name: "Downtown", lat: 40.7128, lng: -74.006 },
    { id: "c2", name: "Central Park", lat: 40.7831, lng: -73.9712 },
    { id: "c3", name: "Times Square", lat: 40.7580, lng: -73.9855 },
    { id: "c4", name: "Brooklyn Bridge", lat: 40.7061, lng: -73.9969 },
    { id: "c5", name: "Financial District", lat: 40.7075, lng: -74.0113 },
    { id: "c6", name: "Chinatown", lat: 40.7157, lng: -73.9976 },
  ],
  rural: [
    { id: "r1", name: "Farmland North", lat: 41.2033, lng: -73.8503 },
    { id: "r2", name: "River Crossing", lat: 41.1631, lng: -73.7647 },
    { id: "r3", name: "Small Town", lat: 41.2565, lng: -73.6843 },
    { id: "r4", name: "County Road 12", lat: 41.1952, lng: -73.5982 },
    { id: "r5", name: "Old Mill", lat: 41.2879, lng: -73.6321 },
  ],
  mountain: [
    { id: "m1", name: "Base Camp", lat: 42.0428, lng: -74.4018 },
    { id: "m2", name: "Mid Mountain", lat: 42.1101, lng: -74.3672 },
    { id: "m3", name: "North Peak", lat: 42.1573, lng: -74.3345 },
    { id: "m4", name: "East Ridge", lat: 42.1302, lng: -74.2891 },
    { id: "m5", name: "Valley View", lat: 42.0851, lng: -74.3211 },
    { id: "m6", name: "South Pass", lat: 42.0394, lng: -74.3587 },
  ],
};

// Generate route graphs based on map type
export const getRouteGraph = (mapType: MapType): RouteGraph => {
  const locations = mapLocations[mapType];
  const nodes: Record<string, { id: string; lat: number; lng: number }> = {};
  const edges: { from: string; to: string; distance: number; time: number; trafficFactor: number }[] = [];

  // Add all locations as nodes
  locations.forEach((loc) => {
    nodes[loc.id] = {
      id: loc.id,
      lat: loc.lat,
      lng: loc.lng,
    };
  });

  // Create edges between nodes (simplified for this demo)
  // In a real implementation, you'd have more realistic edge connections and weights
  for (let i = 0; i < locations.length; i++) {
    for (let j = i + 1; j < locations.length; j++) {
      // Calculate distance between two points using Haversine formula
      const lat1 = locations[i].lat;
      const lng1 = locations[i].lng;
      const lat2 = locations[j].lat;
      const lng2 = locations[j].lng;
      
      const R = 6371e3; // Earth radius in meters
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lng2 - lng1) * Math.PI) / 180;

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
               Math.cos(φ1) * Math.cos(φ2) *
               Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // in meters

      // Assign traffic factors based on map type
      let trafficFactor = 1.0; // Default
      
      if (mapType === 'city') {
        // Higher traffic in cities
        trafficFactor = 1.5 + Math.random() * 2.5; 
      } else if (mapType === 'rural') {
        // Lower traffic in rural areas
        trafficFactor = 1.0 + Math.random() * 0.5;
      } else if (mapType === 'mountain') {
        // Variable traffic in mountains, higher on main routes
        trafficFactor = 1.2 + Math.random() * 0.8;
      }

      // Create bidirectional edges
      const time = (distance / 1000) * 60 * trafficFactor; // minutes, considering 60 km/h avg speed and traffic
      
      edges.push({
        from: locations[i].id,
        to: locations[j].id,
        distance,
        time,
        trafficFactor,
      });
      
      // Add reverse edge (for bidirectional graph)
      edges.push({
        from: locations[j].id,
        to: locations[i].id,
        distance,
        time,
        trafficFactor,
      });
    }
  }

  return { nodes, edges };
};

// Get map center coordinates based on map type
export const getMapCenter = (mapType: MapType): [number, number] => {
  switch (mapType) {
    case 'city':
      return [40.7128, -74.006]; // New York City
    case 'rural':
      return [41.2033, -73.7647]; // Somewhere rural
    case 'mountain':
      return [42.0851, -74.3345]; // Mountain area
    default:
      return [40.7128, -74.006];
  }
};

// Get initial zoom level based on map type
export const getMapZoom = (mapType: MapType): number => {
  switch (mapType) {
    case 'city':
      return 14;
    case 'rural':
      return 12;
    case 'mountain':
      return 13;
    default:
      return 13;
  }
};
