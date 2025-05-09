
export type Algorithm = 'dijkstra' | 'astar' | 'bellman-ford' | 'floyd-warshall';
export type MapType = 'city' | 'rural' | 'mountain';
export type Weather = 'sunny' | 'rainy' | 'foggy' | 'snowy' | 'windy';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type Vehicle = 'car' | 'bike' | 'truck' | 'ambulance' | 'bus' | 'ev';

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface SimulationParams {
  algorithm: Algorithm;
  mapType: MapType;
  weather: Weather;
  timeOfDay: TimeOfDay;
  startLocation: string;
  endLocation: string;
  vehicle: Vehicle;
}

export interface RouteNode {
  id: string;
  lat: number;
  lng: number;
}

export interface RouteEdge {
  from: string;
  to: string;
  distance: number;
  time: number;
  trafficFactor: number;
}

export interface RouteGraph {
  nodes: Record<string, RouteNode>;
  edges: RouteEdge[];
}

export interface SimulationResult {
  algorithm: Algorithm;
  path: string[]; // Node IDs in order
  metrics: {
    time: number; // seconds
    distance: number; // meters
    cost: number; // arbitrary units
    fuel: number; // liters or kWh
    trafficImpact: number; // 0-10 scale
    weatherImpact: number; // 0-10 scale
    totalScore: number; // weighted score
  };
}
