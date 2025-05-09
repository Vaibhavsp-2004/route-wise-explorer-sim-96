
import { Algorithm, RouteGraph, SimulationParams, SimulationResult, Vehicle, Weather, TimeOfDay } from "../types";

// Helper function to find node with minimum distance
const minDistance = (dist: Record<string, number>, visited: Record<string, boolean>): string => {
  let min = Number.MAX_SAFE_INTEGER;
  let minIndex = "";

  Object.keys(dist).forEach((v) => {
    if (!visited[v] && dist[v] <= min) {
      min = dist[v];
      minIndex = v;
    }
  });

  return minIndex;
};

// Dijkstra's algorithm implementation
export const dijkstra = (
  graph: RouteGraph,
  start: string,
  end: string
): { path: string[]; distance: number; time: number } => {
  const { nodes, edges } = graph;
  const dist: Record<string, number> = {};
  const time: Record<string, number> = {};
  const prev: Record<string, string> = {};
  const visited: Record<string, boolean> = {};

  // Initialize distances
  Object.keys(nodes).forEach((nodeId) => {
    dist[nodeId] = Number.MAX_SAFE_INTEGER;
    time[nodeId] = Number.MAX_SAFE_INTEGER;
    visited[nodeId] = false;
  });

  dist[start] = 0;
  time[start] = 0;

  Object.keys(nodes).forEach(() => {
    const u = minDistance(dist, visited);
    if (!u) return;
    visited[u] = true;

    edges
      .filter((edge) => edge.from === u)
      .forEach((edge) => {
        const v = edge.to;
        if (!visited[v] && dist[u] + edge.distance < dist[v]) {
          dist[v] = dist[u] + edge.distance;
          time[v] = time[u] + edge.time;
          prev[v] = u;
        }
      });
  });

  // Reconstruct path
  const path: string[] = [];
  let current = end;
  
  if (prev[current] || current === start) {
    while (current) {
      path.unshift(current);
      if (current === start) break;
      current = prev[current];
    }
  }

  return {
    path,
    distance: dist[end],
    time: time[end],
  };
};

// A* algorithm implementation
export const astar = (
  graph: RouteGraph,
  start: string,
  end: string
): { path: string[]; distance: number; time: number } => {
  const { nodes, edges } = graph;
  
  // Heuristic function (straight-line distance)
  const heuristic = (nodeId: string): number => {
    const node = nodes[nodeId];
    const endNode = nodes[end];
    
    // Simple Euclidean distance as heuristic
    const dx = node.lng - endNode.lng;
    const dy = node.lat - endNode.lat;
    return Math.sqrt(dx * dx + dy * dy) * 111000; // rough conversion to meters
  };
  
  // Implementation details
  const openSet: string[] = [start];
  const cameFrom: Record<string, string> = {};
  
  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};
  
  Object.keys(nodes).forEach((nodeId) => {
    gScore[nodeId] = Number.MAX_SAFE_INTEGER;
    fScore[nodeId] = Number.MAX_SAFE_INTEGER;
  });
  
  gScore[start] = 0;
  fScore[start] = heuristic(start);
  
  const times: Record<string, number> = {};
  times[start] = 0;
  
  while (openSet.length > 0) {
    // Find node with lowest fScore
    let current = openSet[0];
    let lowestFScore = fScore[current];
    
    openSet.forEach((nodeId) => {
      if (fScore[nodeId] < lowestFScore) {
        lowestFScore = fScore[nodeId];
        current = nodeId;
      }
    });
    
    if (current === end) {
      // Reconstruct path
      const path: string[] = [];
      let temp = current;
      
      while (temp) {
        path.unshift(temp);
        if (temp === start) break;
        temp = cameFrom[temp];
      }
      
      return {
        path,
        distance: gScore[end],
        time: times[end],
      };
    }
    
    openSet.splice(openSet.indexOf(current), 1);
    
    edges
      .filter((edge) => edge.from === current)
      .forEach((edge) => {
        const neighbor = edge.to;
        const tentativeGScore = gScore[current] + edge.distance;
        
        if (tentativeGScore < gScore[neighbor]) {
          cameFrom[neighbor] = current;
          gScore[neighbor] = tentativeGScore;
          times[neighbor] = times[current] + edge.time;
          fScore[neighbor] = gScore[neighbor] + heuristic(neighbor);
          
          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
          }
        }
      });
  }
  
  // No path found
  return {
    path: [],
    distance: 0,
    time: 0,
  };
};

// Bellman-Ford algorithm implementation
export const bellmanFord = (
  graph: RouteGraph,
  start: string,
  end: string
): { path: string[]; distance: number; time: number } => {
  const { nodes, edges } = graph;
  const dist: Record<string, number> = {};
  const time: Record<string, number> = {};
  const prev: Record<string, string> = {};

  // Initialize distances
  Object.keys(nodes).forEach((nodeId) => {
    dist[nodeId] = Number.MAX_SAFE_INTEGER;
    time[nodeId] = Number.MAX_SAFE_INTEGER;
  });

  dist[start] = 0;
  time[start] = 0;

  // Relax all edges |V| - 1 times
  for (let i = 0; i < Object.keys(nodes).length - 1; i++) {
    edges.forEach((edge) => {
      const u = edge.from;
      const v = edge.to;
      
      if (dist[u] !== Number.MAX_SAFE_INTEGER && dist[u] + edge.distance < dist[v]) {
        dist[v] = dist[u] + edge.distance;
        time[v] = time[u] + edge.time;
        prev[v] = u;
      }
    });
  }

  // Reconstruct path
  const path: string[] = [];
  let current = end;
  
  if (prev[current] || current === start) {
    while (current) {
      path.unshift(current);
      if (current === start) break;
      current = prev[current];
    }
  }

  return {
    path,
    distance: dist[end],
    time: time[end],
  };
};

// Floyd-Warshall algorithm implementation
export const floydWarshall = (
  graph: RouteGraph,
  start: string,
  end: string
): { path: string[]; distance: number; time: number } => {
  const { nodes, edges } = graph;
  const nodeIds = Object.keys(nodes);
  
  // Initialize distance and next matrices
  const dist: Record<string, Record<string, number>> = {};
  const next: Record<string, Record<string, string>> = {};
  const times: Record<string, Record<string, number>> = {};
  
  // Initialize matrices
  nodeIds.forEach((i) => {
    dist[i] = {};
    next[i] = {};
    times[i] = {};
    
    nodeIds.forEach((j) => {
      dist[i][j] = i === j ? 0 : Number.MAX_SAFE_INTEGER;
      times[i][j] = i === j ? 0 : Number.MAX_SAFE_INTEGER;
      next[i][j] = j; // Direct path initially
    });
  });
  
  // Fill in direct edge weights
  edges.forEach((edge) => {
    const u = edge.from;
    const v = edge.to;
    dist[u][v] = edge.distance;
    times[u][v] = edge.time;
  });
  
  // Floyd-Warshall algorithm
  nodeIds.forEach((k) => {
    nodeIds.forEach((i) => {
      nodeIds.forEach((j) => {
        if (dist[i][k] !== Number.MAX_SAFE_INTEGER && 
            dist[k][j] !== Number.MAX_SAFE_INTEGER && 
            dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
          times[i][j] = times[i][k] + times[k][j];
          next[i][j] = next[i][k];
        }
      });
    });
  });
  
  // Reconstruct path
  const path: string[] = [];
  
  if (dist[start][end] === Number.MAX_SAFE_INTEGER) {
    return { path: [], distance: 0, time: 0 };
  }
  
  let current = start;
  path.push(current);
  
  while (current !== end) {
    current = next[current][end];
    path.push(current);
  }
  
  return {
    path,
    distance: dist[start][end],
    time: times[start][end],
  };
};

// Calculate fuel or battery consumption based on vehicle and distance
const calculateFuelConsumption = (
  vehicle: Vehicle,
  distance: number,
  weather: Weather,
  timeOfDay: TimeOfDay
): number => {
  // Base consumption rates per km
  const baseConsumption: Record<Vehicle, number> = {
    car: 0.08, // liters per km
    bike: 0, // human powered
    truck: 0.25,
    ambulance: 0.15,
    bus: 0.28,
    ev: 0.2, // kWh per km
  };

  // Weather impact factors (multiplicative)
  const weatherFactor: Record<Weather, number> = {
    sunny: 1.0,
    rainy: 1.12,
    foggy: 1.05,
    snowy: 1.25,
    windy: 1.08,
  };

  // Time of day impact (multiplicative)
  const timeFactor: Record<TimeOfDay, number> = {
    morning: 1.1, // Rush hour
    afternoon: 1.0,
    evening: 1.15, // Rush hour
    night: 0.9, // Less traffic
  };

  // Calculate total consumption
  const consumptionPerKm = baseConsumption[vehicle] * weatherFactor[weather] * timeFactor[timeOfDay];
  return consumptionPerKm * (distance / 1000); // Convert to km
};

// Calculate route cost based on vehicle, distance, and time
const calculateCost = (
  vehicle: Vehicle,
  distance: number,
  time: number,
  weather: Weather
): number => {
  // Base cost per km
  const baseCostPerKm: Record<Vehicle, number> = {
    car: 0.15,
    bike: 0.02,
    truck: 0.4,
    ambulance: 0.5,
    bus: 0.3,
    ev: 0.1,
  };

  // Weather surcharge (additional fixed amount)
  const weatherSurcharge: Record<Weather, number> = {
    sunny: 0,
    rainy: 1.5,
    foggy: 1,
    snowy: 3,
    windy: 0.8,
  };

  // Distance cost + time cost + weather surcharge
  const distanceCost = (distance / 1000) * baseCostPerKm[vehicle];
  const timeCost = (time / 60) * 0.5; // $0.5 per minute of travel
  
  return distanceCost + timeCost + weatherSurcharge[weather];
};

// Calculate traffic impact factor (0-10 scale)
const calculateTrafficImpact = (
  routeEdges: RouteEdge[],
  timeOfDay: TimeOfDay
): number => {
  if (routeEdges.length === 0) return 0;
  
  // Base traffic factor based on route edges
  const avgTrafficFactor = routeEdges.reduce((sum, edge) => sum + edge.trafficFactor, 0) / routeEdges.length;
  
  // Time of day multiplier
  const timeMultiplier: Record<TimeOfDay, number> = {
    morning: 1.5, // Rush hour
    afternoon: 1.0,
    evening: 1.4, // Rush hour
    night: 0.6, // Less traffic
  };
  
  // Calculate score on 0-10 scale
  const impact = (avgTrafficFactor * timeMultiplier[timeOfDay]) * 2;
  return Math.min(10, Math.max(0, impact)); // Clamp between 0-10
};

// Calculate weather impact factor (0-10 scale)
const calculateWeatherImpact = (weather: Weather, mapType: string): number => {
  // Base impact by weather type
  const baseImpact: Record<Weather, number> = {
    sunny: 1,
    rainy: 5,
    foggy: 6,
    snowy: 8,
    windy: 4,
  };
  
  // Map type modifier (multiplier)
  const mapModifier: Record<string, number> = {
    city: 0.9, // Better infrastructure to handle weather
    rural: 1.2, // Less infrastructure
    mountain: 1.5, // Most affected by weather
  };
  
  const impact = baseImpact[weather] * mapModifier[mapType];
  return Math.min(10, Math.max(0, impact)); // Clamp between 0-10
};

// Calculate a weighted score based on all metrics
const calculateTotalScore = (
  time: number,
  distance: number,
  cost: number,
  fuel: number,
  trafficImpact: number,
  weatherImpact: number
): number => {
  // Normalize values to 0-100 scale
  const normalizedTime = Math.min(100, (time / 3600) * 100); // Normalize over a 1-hour basis
  const normalizedDistance = Math.min(100, (distance / 10000) * 100); // Normalize over a 10km basis
  const normalizedCost = Math.min(100, cost * 10); // Assuming cost is already reasonable
  const normalizedFuel = Math.min(100, fuel * 20); // Normalize fuel consumption
  
  // Weights for different factors (sum to 1)
  const weights = {
    time: 0.3,
    distance: 0.25,
    cost: 0.15,
    fuel: 0.1,
    traffic: 0.1,
    weather: 0.1,
  };
  
  // Lower score is better (like a cost function)
  return (
    normalizedTime * weights.time +
    normalizedDistance * weights.distance +
    normalizedCost * weights.cost +
    normalizedFuel * weights.fuel +
    trafficImpact * 10 * weights.traffic +
    weatherImpact * 10 * weights.weather
  );
};

// Find relevant edges for a path
const findPathEdges = (graph: RouteGraph, path: string[]): RouteEdge[] => {
  if (path.length <= 1) return [];
  
  const pathEdges: RouteEdge[] = [];
  
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    
    const edge = graph.edges.find(e => e.from === from && e.to === to);
    if (edge) {
      pathEdges.push(edge);
    }
  }
  
  return pathEdges;
};

// Main function to run simulation based on the selected parameters
export const runSimulation = (params: SimulationParams): SimulationResult => {
  const { algorithm, mapType, weather, timeOfDay, startLocation, endLocation, vehicle } = params;
  
  // Get the route graph for the selected map
  const graph = getRouteGraph(mapType);
  
  // Run the selected algorithm
  let result;
  switch (algorithm) {
    case 'dijkstra':
      result = dijkstra(graph, startLocation, endLocation);
      break;
    case 'astar':
      result = astar(graph, startLocation, endLocation);
      break;
    case 'bellman-ford':
      result = bellmanFord(graph, startLocation, endLocation);
      break;
    case 'floyd-warshall':
      result = floydWarshall(graph, startLocation, endLocation);
      break;
    default:
      result = dijkstra(graph, startLocation, endLocation);
  }
  
  const { path, distance, time } = result;
  
  // Find all edges that make up the path
  const pathEdges = findPathEdges(graph, path);
  
  // Calculate additional metrics
  const fuel = calculateFuelConsumption(vehicle, distance, weather, timeOfDay);
  const cost = calculateCost(vehicle, distance, time, weather);
  const trafficImpact = calculateTrafficImpact(pathEdges, timeOfDay);
  const weatherImpact = calculateWeatherImpact(weather, mapType);
  const totalScore = calculateTotalScore(time, distance, cost, fuel, trafficImpact, weatherImpact);
  
  return {
    algorithm,
    path,
    metrics: {
      time, // in seconds
      distance, // in meters
      cost,
      fuel,
      trafficImpact,
      weatherImpact,
      totalScore,
    },
  };
};

// Function to get algorithm description
export const getAlgorithmDescription = (algorithm: Algorithm): {
  name: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  pros: string[];
  cons: string[];
} => {
  switch (algorithm) {
    case 'dijkstra':
      return {
        name: "Dijkstra's Algorithm",
        description: "Dijkstra's algorithm finds the shortest path between nodes in a graph. It uses a greedy approach, always selecting the unvisited node with the lowest distance value. It works well for graphs with positive edge weights.",
        timeComplexity: "O(|E| + |V|log|V|) with priority queue",
        spaceComplexity: "O(|V|)",
        pros: [
          "Guarantees the shortest path",
          "Works well in dense graphs",
          "Efficient for single-source problems"
        ],
        cons: [
          "Doesn't work with negative edges",
          "Can be slower than A* for targeted searches",
          "Examines more nodes than necessary when target is known"
        ]
      };
    case 'astar':
      return {
        name: "A* Algorithm",
        description: "A* is an informed search algorithm that uses a heuristic function to guide its search. It evaluates nodes by combining the cost to reach the node and the estimated cost to the goal. A* is optimal if the heuristic is admissible.",
        timeComplexity: "O(|E|) but depends on heuristic quality",
        spaceComplexity: "O(|V|)",
        pros: [
          "Typically faster than Dijkstra when a good heuristic exists",
          "Guarantees shortest path if heuristic is admissible",
          "Examines fewer nodes by using goal-directed search"
        ],
        cons: [
          "Requires a good heuristic function",
          "Performance depends heavily on heuristic quality",
          "May use more memory than simpler algorithms"
        ]
      };
    case 'bellman-ford':
      return {
        name: "Bellman-Ford Algorithm",
        description: "The Bellman-Ford algorithm computes shortest paths from a single source vertex to all other vertices in a weighted graph. Unlike Dijkstra's, it can handle graphs with negative weight edges.",
        timeComplexity: "O(|V|·|E|)",
        spaceComplexity: "O(|V|)",
        pros: [
          "Works with negative edge weights",
          "Can detect negative cycles",
          "Simple implementation"
        ],
        cons: [
          "Slower than Dijkstra's for most practical cases",
          "Inefficient for sparse graphs",
          "Not practical for large-scale real-time routing"
        ]
      };
    case 'floyd-warshall':
      return {
        name: "Floyd-Warshall Algorithm",
        description: "Floyd-Warshall is a dynamic programming approach that finds the shortest paths between all pairs of vertices in a weighted graph. It works with positive or negative edge weights, but no negative cycles.",
        timeComplexity: "O(|V|³)",
        spaceComplexity: "O(|V|²)",
        pros: [
          "Finds all shortest paths between all pairs of vertices",
          "Works with negative edges (but no negative cycles)",
          "Simple implementation with dynamic programming"
        ],
        cons: [
          "High time and space complexity makes it impractical for large graphs",
          "Not suitable for real-time routing in large networks",
          "Overkill when only specific paths are needed"
        ]
      };
    default:
      return {
        name: "Unknown Algorithm",
        description: "No description available",
        timeComplexity: "Unknown",
        spaceComplexity: "Unknown",
        pros: [],
        cons: []
      };
  }
};
