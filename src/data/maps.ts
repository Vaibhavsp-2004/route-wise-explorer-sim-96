
import { Location, MapType, RouteGraph } from "../types";

// Location coordinates for Karnataka, India
export const mapLocations: Record<MapType, Location[]> = {
  karnataka: [
    { id: "k1", name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
    { id: "k2", name: "Mysuru", lat: 12.2958, lng: 76.6394 },
    { id: "k3", name: "Mangaluru", lat: 12.9141, lng: 74.8560 },
    { id: "k4", name: "Hubli", lat: 15.3647, lng: 75.1240 },
    { id: "k5", name: "Belagavi", lat: 15.8497, lng: 74.4977 },
    { id: "k6", name: "Kalaburagi", lat: 17.3297, lng: 76.8343 },
    { id: "k7", name: "Davangere", lat: 14.4644, lng: 75.9932 },
    { id: "k8", name: "Ballari", lat: 15.1394, lng: 76.9214 },
  ],
  bengaluru: [
    { id: "b1", name: "Majestic", lat: 12.9762, lng: 77.5993 },
    { id: "b2", name: "Koramangala", lat: 12.9279, lng: 77.6271 },
    { id: "b3", name: "Indiranagar", lat: 12.9719, lng: 77.6412 },
    { id: "b4", name: "Whitefield", lat: 12.9698, lng: 77.7500 },
    { id: "b5", name: "Electronic City", lat: 12.8456, lng: 77.6603 },
    { id: "b6", name: "Hebbal", lat: 13.0358, lng: 77.5970 },
    { id: "b7", name: "Jayanagar", lat: 12.9254, lng: 77.5946 },
  ],
  mysuru: [
    { id: "m1", name: "Mysuru Palace", lat: 12.3051, lng: 76.6551 },
    { id: "m2", name: "Chamundi Hills", lat: 12.2724, lng: 76.6730 },
    { id: "m3", name: "KRS Dam", lat: 12.4244, lng: 76.5692 },
    { id: "m4", name: "Brindavan Gardens", lat: 12.4244, lng: 76.5692 },
    { id: "m5", name: "Mysuru Zoo", lat: 12.3009, lng: 76.6543 },
    { id: "m6", name: "Infosys Mysuru", lat: 12.3372, lng: 76.6107 },
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

  // Create edges between nodes
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
      
      if (mapType === 'bengaluru') {
        // Higher traffic in Bengaluru
        trafficFactor = 2.0 + Math.random() * 2.0; 
      } else if (mapType === 'karnataka') {
        // Variable traffic across Karnataka
        trafficFactor = 1.2 + Math.random() * 1.5;
      } else if (mapType === 'mysuru') {
        // Moderate traffic in Mysuru
        trafficFactor = 1.1 + Math.random() * 0.8;
      }

      // Create bidirectional edges
      const time = (distance / 1000) * 60 * trafficFactor; // minutes, considering avg speed and traffic
      
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
    case 'karnataka':
      return [14.5204, 75.7224]; // Karnataka center
    case 'bengaluru':
      return [12.9716, 77.5946]; // Bengaluru center
    case 'mysuru':
      return [12.2958, 76.6394]; // Mysuru center
    default:
      return [12.9716, 77.5946];
  }
};

// Get initial zoom level based on map type
export const getMapZoom = (mapType: MapType): number => {
  switch (mapType) {
    case 'karnataka':
      return 7;
    case 'bengaluru':
      return 11;
    case 'mysuru':
      return 12;
    default:
      return 11;
  }
};
