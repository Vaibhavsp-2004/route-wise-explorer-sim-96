import { Algorithm, RouteGraph, SimulationParams, SimulationResult, Vehicle, Weather, TimeOfDay, RouteEdge } from "../types";

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

// TSP Brute Force algorithm - tries all permutations
export const bruteForce = (
  graph: RouteGraph,
  start: string
): { path: string[]; distance: number; time: number } => {
  const { nodes } = graph;
  const nodeIds = Object.keys(nodes);
  
  if (!nodeIds.includes(start)) {
    return { path: [], distance: 0, time: 0 };
  }

  // Get all nodes except start
  const otherNodes = nodeIds.filter(node => node !== start);
  
  let bestPath: string[] = [];
  let bestDistance = Number.MAX_SAFE_INTEGER;
  let bestTime = Number.MAX_SAFE_INTEGER;

  // Generate all permutations of other nodes
  const permute = (arr: string[]): string[][] => {
    if (arr.length <= 1) return [arr];
    const result: string[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = arr.slice(0, i).concat(arr.slice(i + 1));
      const perms = permute(rest);
      for (const perm of perms) {
        result.push([arr[i]].concat(perm));
      }
    }
    return result;
  };
  
  const permutations = permute(otherNodes);
  
  // Try each permutation as TSP tour
  for (const perm of permutations) {
    const fullPath = [start, ...perm, start]; // Complete tour
    const pathCost = calculatePathCost(fullPath, graph);
    const pathTime = calculatePathTime(fullPath, graph);
    
    if (pathCost < bestDistance && pathCost > 0) {
      bestDistance = pathCost;
      bestTime = pathTime;
      bestPath = fullPath;
    }
  }

  return {
    path: bestPath,
    distance: bestDistance === Number.MAX_SAFE_INTEGER ? 0 : bestDistance,
    time: bestTime === Number.MAX_SAFE_INTEGER ? 0 : bestTime,
  };
};

// TSP Dynamic Programming (Held-Karp) algorithm
export const dynamicProgramming = (
  graph: RouteGraph,
  start: string
): { path: string[]; distance: number; time: number } => {
  const { nodes } = graph;
  const nodeIds = Object.keys(nodes);
  const n = nodeIds.length;
  
  if (n <= 1) return { path: [start], distance: 0, time: 0 };
  
  // Create index mapping
  const nodeToIndex: Record<string, number> = {};
  const indexToNode: Record<number, string> = {};
  nodeIds.forEach((nodeId, index) => {
    nodeToIndex[nodeId] = index;
    indexToNode[index] = nodeId;
  });
  
  const startIndex = nodeToIndex[start];
  
  // Create distance matrix
  const dist: number[][] = Array(n).fill(null).map(() => Array(n).fill(Number.MAX_SAFE_INTEGER));
  const time: number[][] = Array(n).fill(null).map(() => Array(n).fill(Number.MAX_SAFE_INTEGER));
  
  // Fill distance matrix from graph edges
  graph.edges.forEach(edge => {
    const fromIndex = nodeToIndex[edge.from];
    const toIndex = nodeToIndex[edge.to];
    if (fromIndex !== undefined && toIndex !== undefined) {
      dist[fromIndex][toIndex] = edge.distance;
      time[fromIndex][toIndex] = edge.time;
    }
  });
  
  // DP table: dp[mask][i] = minimum cost to visit all cities in mask ending at city i
  const dp: Record<string, Record<number, number>> = {};
  const parent: Record<string, Record<number, number>> = {};
  
  // Initialize: starting from start city
  const startMask = 1 << startIndex;
  dp[startMask] = {};
  dp[startMask][startIndex] = 0;
  
  // Fill DP table
  for (let mask = 1; mask < (1 << n); mask++) {
    if (!dp[mask]) dp[mask] = {};
    if (!parent[mask]) parent[mask] = {};
    
    for (let u = 0; u < n; u++) {
      if (!(mask & (1 << u)) || dp[mask][u] === undefined) continue;
      
      for (let v = 0; v < n; v++) {
        if (mask & (1 << v) || dist[u][v] === Number.MAX_SAFE_INTEGER) continue;
        
        const newMask = mask | (1 << v);
        if (!dp[newMask]) dp[newMask] = {};
        if (!parent[newMask]) parent[newMask] = {};
        
        const newCost = dp[mask][u] + dist[u][v];
        if (dp[newMask][v] === undefined || newCost < dp[newMask][v]) {
          dp[newMask][v] = newCost;
          parent[newMask][v] = u;
        }
      }
    }
  }
  
  // Find minimum cost to return to start
  const fullMask = (1 << n) - 1;
  let minCost = Number.MAX_SAFE_INTEGER;
  let lastCity = -1;
  
  for (let i = 0; i < n; i++) {
    if (i === startIndex || !dp[fullMask] || dp[fullMask][i] === undefined) continue;
    const totalCost = dp[fullMask][i] + dist[i][startIndex];
    if (totalCost < minCost) {
      minCost = totalCost;
      lastCity = i;
    }
  }
  
  if (lastCity === -1) {
    return { path: [], distance: 0, time: 0 };
  }
  
  // Reconstruct path
  const path: string[] = [];
  let currentMask = fullMask;
  let currentCity = lastCity;
  
  while (currentMask > 0) {
    path.unshift(indexToNode[currentCity]);
    if (currentMask === startMask) break;
    
    const prevCity = parent[currentMask][currentCity];
    currentMask ^= (1 << currentCity);
    currentCity = prevCity;
  }
  
  path.push(indexToNode[startIndex]); // Return to start
  
  const totalTime = calculatePathTime(path, graph);
  
  return {
    path,
    distance: minCost === Number.MAX_SAFE_INTEGER ? 0 : minCost,
    time: totalTime,
  };
};

// TSP Nearest Neighbor algorithm
export const nearestNeighbor = (
  graph: RouteGraph,
  start: string
): { path: string[]; distance: number; time: number } => {
  const { nodes, edges } = graph;
  const nodeIds = Object.keys(nodes);
  const visited: Set<string> = new Set();
  const path: string[] = [start];
  let current = start;
  let totalDistance = 0;
  let totalTime = 0;

  visited.add(start);

  // Visit all other nodes
  while (visited.size < nodeIds.length) {
    let nearestNode = "";
    let nearestDistance = Number.MAX_SAFE_INTEGER;
    let nearestTime = 0;

    // Find nearest unvisited neighbor
    edges
      .filter(edge => edge.from === current && !visited.has(edge.to))
      .forEach(edge => {
        if (edge.distance < nearestDistance) {
          nearestDistance = edge.distance;
          nearestTime = edge.time;
          nearestNode = edge.to;
        }
      });

    if (nearestNode === "") break; // No more reachable nodes

    path.push(nearestNode);
    visited.add(nearestNode);
    current = nearestNode;
    totalDistance += nearestDistance;
    totalTime += nearestTime;
  }

  // Return to start to complete the tour
  const returnEdge = edges.find(edge => edge.from === current && edge.to === start);
  if (returnEdge && visited.size === nodeIds.length) {
    path.push(start);
    totalDistance += returnEdge.distance;
    totalTime += returnEdge.time;
  } else {
    // If we can't complete the tour, return empty
    return { path: [], distance: 0, time: 0 };
  }

  return {
    path,
    distance: totalDistance,
    time: totalTime,
  };
};

// TSP Branch and Bound algorithm
export const branchAndBound = (
  graph: RouteGraph,
  start: string
): { path: string[]; distance: number; time: number } => {
  const { nodes, edges } = graph;
  const nodeIds = Object.keys(nodes);
  
  interface Node {
    path: string[];
    cost: number;
    time: number;
    visited: Set<string>;
    bound: number;
  }

  const calculateTSPBound = (path: string[], visited: Set<string>): number => {
    if (visited.size === nodeIds.length) {
      // All nodes visited, need to return to start
      const lastNode = path[path.length - 1];
      const returnEdge = edges.find(edge => edge.from === lastNode && edge.to === start);
      return returnEdge ? returnEdge.distance : Number.MAX_SAFE_INTEGER;
    }
    
    // Calculate minimum outgoing edge cost for remaining nodes
    let minBound = 0;
    for (const nodeId of nodeIds) {
      if (!visited.has(nodeId)) {
        let minEdge = Number.MAX_SAFE_INTEGER;
        edges
          .filter(edge => edge.from === nodeId && !visited.has(edge.to))
          .forEach(edge => {
            minEdge = Math.min(minEdge, edge.distance);
          });
        if (minEdge !== Number.MAX_SAFE_INTEGER) {
          minBound += minEdge;
        }
      }
    }
    return minBound;
  };

  const queue: Node[] = [{
    path: [start],
    cost: 0,
    time: 0,
    visited: new Set([start]),
    bound: calculateTSPBound([start], new Set([start]))
  }];

  let bestSolution: Node | null = null;
  let bestCost = Number.MAX_SAFE_INTEGER;

  while (queue.length > 0) {
    queue.sort((a, b) => (a.cost + a.bound) - (b.cost + b.bound));
    const current = queue.shift()!;

    if (current.cost + current.bound >= bestCost) continue;

    if (current.visited.size === nodeIds.length) {
      // All nodes visited, try to return to start
      const lastNode = current.path[current.path.length - 1];
      const returnEdge = edges.find(edge => edge.from === lastNode && edge.to === start);
      
      if (returnEdge) {
        const totalCost = current.cost + returnEdge.distance;
        const totalTime = current.time + returnEdge.time;
        
        if (totalCost < bestCost) {
          bestCost = totalCost;
          bestSolution = {
            path: [...current.path, start],
            cost: totalCost,
            time: totalTime,
            visited: current.visited,
            bound: 0
          };
        }
      }
      continue;
    }

    const currentNode = current.path[current.path.length - 1];

    // Expand to unvisited neighbors
    edges
      .filter(edge => edge.from === currentNode && !current.visited.has(edge.to))
      .forEach(edge => {
        const newVisited = new Set(current.visited);
        newVisited.add(edge.to);
        const newPath = [...current.path, edge.to];
        const newCost = current.cost + edge.distance;
        const newTime = current.time + edge.time;
        const newBound = calculateTSPBound(newPath, newVisited);

        if (newCost + newBound < bestCost) {
          queue.push({
            path: newPath,
            cost: newCost,
            time: newTime,
            visited: newVisited,
            bound: newBound
          });
        }
      });
  }

  return bestSolution ? {
    path: bestSolution.path,
    distance: bestSolution.cost,
    time: bestSolution.time,
  } : { path: [], distance: 0, time: 0 };
};

// Helper functions
const calculatePathCost = (path: string[], graph: RouteGraph): number => {
  if (path.length < 2) return 0;
  
  let totalCost = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = graph.edges.find(e => e.from === path[i] && e.to === path[i + 1]);
    if (edge) totalCost += edge.distance;
    else return Number.MAX_SAFE_INTEGER; // Invalid path
  }
  return totalCost;
};

const calculatePathTime = (path: string[], graph: RouteGraph): number => {
  if (path.length < 2) return 0;
  
  let totalTime = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = graph.edges.find(e => e.from === path[i] && e.to === path[i + 1]);
    if (edge) totalTime += edge.time;
    else return Number.MAX_SAFE_INTEGER; // Invalid path
  }
  return totalTime;
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
    bengaluru: 0.9, // Better infrastructure to handle weather
    karnataka: 1.2, // Mixed infrastructure
    mysuru: 1.0, // Moderate infrastructure
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

// Main function to run TSP simulation
export const runSimulation = (params: SimulationParams): SimulationResult => {
  const { algorithm, mapType, weather, timeOfDay, startLocation, vehicle } = params;
  
  // Get the route graph for the selected map
  const graph = getRouteGraph(mapType);
  
  // Run the selected TSP algorithm
  let result;
  switch (algorithm) {
    case 'brute-force':
      result = bruteForce(graph, startLocation);
      break;
    case 'dynamic-programming':
      result = dynamicProgramming(graph, startLocation);
      break;
    case 'nearest-neighbor':
      result = nearestNeighbor(graph, startLocation);
      break;
    case 'branch-and-bound':
      result = branchAndBound(graph, startLocation);
      break;
    default:
      result = nearestNeighbor(graph, startLocation);
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

// Import getRouteGraph from maps.ts
import { getRouteGraph } from '../data/maps';

// Function to get TSP algorithm description
export const getAlgorithmDescription = (algorithm: Algorithm): {
  name: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  pros: string[];
  cons: string[];
} => {
  switch (algorithm) {
    case 'brute-force':
      return {
        name: "Brute Force TSP",
        description: "Brute force TSP examines all possible tours (permutations of cities) to find the optimal solution. It guarantees finding the shortest tour that visits all cities exactly once and returns to the starting city.",
        timeComplexity: "O(n!) where n is the number of cities",
        spaceComplexity: "O(n)",
        pros: [
          "Guarantees the optimal TSP solution",
          "Simple to understand and implement",
          "Works for any complete graph"
        ],
        cons: [
          "Extremely slow for large numbers of cities",
          "Factorial time complexity makes it impractical",
          "Only feasible for very small instances (< 10 cities)"
        ]
      };
    case 'dynamic-programming':
      return {
        name: "Dynamic Programming TSP (Held-Karp)",
        description: "The Held-Karp algorithm uses dynamic programming with bitmasks to solve TSP optimally. It builds up solutions by considering all possible subsets of cities and finding the minimum cost to visit each subset ending at each city.",
        timeComplexity: "O(n²·2ⁿ) where n is the number of cities",
        spaceComplexity: "O(n·2ⁿ)",
        pros: [
          "Guarantees optimal TSP solution",
          "More efficient than brute force",
          "Uses memoization to avoid redundant calculations"
        ],
        cons: [
          "Still exponential in time and space",
          "High memory usage due to bitmask table",
          "Only practical for small to medium instances (< 20 cities)"
        ]
      };
    case 'nearest-neighbor':
      return {
        name: "Nearest Neighbor TSP",
        description: "The nearest neighbor heuristic starts at a city and repeatedly visits the nearest unvisited city until all cities are visited, then returns to the start. While fast, it often produces suboptimal tours.",
        timeComplexity: "O(n²)",
        spaceComplexity: "O(n)",
        pros: [
          "Very fast execution",
          "Simple to implement",
          "Good for large instances and real-time applications",
          "Always produces a valid tour"
        ],
        cons: [
          "Does not guarantee optimal solution",
          "Tour quality heavily depends on starting city",
          "Can produce tours significantly longer than optimal"
        ]
      };
    case 'branch-and-bound':
      return {
        name: "Branch and Bound TSP",
        description: "Branch and bound systematically explores the solution space of TSP tours while using lower bounds to prune branches that cannot lead to better solutions. It combines completeness with intelligent pruning.",
        timeComplexity: "O(n!) worst case, much better in practice",
        spaceComplexity: "O(n)",
        pros: [
          "Guarantees optimal TSP solution",
          "More efficient than brute force through pruning",
          "Can provide bounds on solution quality during execution"
        ],
        cons: [
          "Still exponential in worst case",
          "Performance depends on quality of bounding function",
          "Complex to implement effectively for TSP"
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
