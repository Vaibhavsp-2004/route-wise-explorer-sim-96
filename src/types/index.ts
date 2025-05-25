
// Location and map types
export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export type MapType = 'karnataka' | 'bengaluru' | 'mysuru';

// Algorithm types - updated to match the image
export type Algorithm = 'brute-force' | 'dynamic-programming' | 'nearest-neighbor' | 'branch-and-bound';

export type Weather = 'sunny' | 'rainy' | 'foggy' | 'snowy' | 'windy';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type Vehicle = 'car' | 'bike' | 'truck' | 'ambulance' | 'bus' | 'ev';

// Graph and route types
export interface RouteEdge {
  from: string;
  to: string;
  distance: number;
  time: number;
  trafficFactor: number;
}

export interface RouteGraph {
  nodes: Record<string, { id: string; lat: number; lng: number }>;
  edges: RouteEdge[];
}

// Simulation types
export interface SimulationParams {
  algorithm: Algorithm;
  mapType: MapType;
  weather: Weather;
  timeOfDay: TimeOfDay;
  startLocation: string;
  endLocation: string;
  vehicle: Vehicle;
}

export interface SimulationMetrics {
  time: number; // in seconds
  distance: number; // in meters
  cost: number;
  fuel: number;
  trafficImpact: number; // 0-10 scale
  weatherImpact: number; // 0-10 scale
  totalScore: number;
}

export interface SimulationResult {
  algorithm: Algorithm;
  path: string[];
  metrics: SimulationMetrics;
}
