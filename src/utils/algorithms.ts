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

// Brute Force algorithm - exhaustive search
export const bruteForce = (
  graph: RouteGraph,
  start: string,
  end: string
): { path: string[]; distance: number; time: number } => {
  const { nodes } = graph;
  const nodeIds = Object.keys(nodes);
  
  if (!nodeIds.includes(start) || !nodeIds.includes(end)) {
    return { path: [], distance: 0, time: 0 };
  }

  let bestPath: string[] = [];
  let bestDistance = Number.MAX_SAFE_INTEGER;
  let bestTime = Number.MAX_SAFE_INTEGER;

  // Generate all possible paths (simplified for performance)
  const findAllPaths = (current: string, target: string, visited: Set<string>, path: string[]): void => {
    if (current === target) {
      const pathCost = calculatePathCost(path, graph);
      const pathTime = calculatePathTime(path, graph);
      
      if (pathCost < bestDistance) {
        bestDistance = pathCost;
        bestTime = pathTime;
        bestPath = [...path];
      }
      return;
    }

    if (path.length > 5) return; // Limit depth for performance

    graph.edges
      .filter(edge => edge.from === current && !visited.has(edge.to))
      .forEach(edge => {
        visited.add(edge.to);
        path.push(edge.to);
        findAllPaths(edge.to, target, visited, path);
        path.pop();
        visited.delete(edge.to);
      });
  };

  const visited = new Set<string>([start]);
  findAllPaths(start, end, visited, [start]);

  return {
    path: bestPath,
    distance: bestDistance === Number.MAX_SAFE_INTEGER ? 0 : bestDistance,
    time: bestTime === Number.MAX_SAFE_INTEGER ? 0 : bestTime,
  };
};

// Dynamic Programming (Held-Karp) algorithm
export const dynamicProgramming = (
  graph: RouteGraph,
  start: string,
  end: string
): { path: string[]; distance: number; time: number } => {
  const { nodes, edges } = graph;
  const nodeIds = Object.keys(nodes);
  
  // Create distance matrix
  const dist: Record<string, Record<string, number>> = {};
  const time: Record<string, Record<string, number>> = {};
  
  nodeIds.forEach(i => {
    dist[i] = {};
    time[i] = {};
    nodeIds.forEach(j => {
      dist[i][j] = i === j ? 0 : Number.MAX_SAFE_INTEGER;
      time[i][j] = i === j ? 0 : Number.MAX_SAFE_INTEGER;
    });
  });

  // Fill in direct edges
  edges.forEach(edge => {
    dist[edge.from][edge.to] = edge.distance;
    time[edge.from][edge.to] = edge.time;
  });

  // Floyd-Warshall for all-pairs shortest paths
  nodeIds.forEach(k => {
    nodeIds.forEach(i => {
      nodeIds.forEach(j => {
        if (dist[i][k] !== Number.MAX_SAFE_INTEGER && 
            dist[k][j] !== Number.MAX_SAFE_INTEGER &&
            dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
          time[i][j] = time[i][k] + time[k][j];
        }
      });
    });
  });

  // Reconstruct path using memoization
  const memo: Record<string, string[]> = {};
  
  const getPath = (from: string, to: string): string[] => {
    const key = `${from}-${to}`;
    if (memo[key]) return memo[key];
    
    if (from === to) return [from];
    if (dist[from][to] === Number.MAX_SAFE_INTEGER) return [];
    
    // Find intermediate node
    for (const k of nodeIds) {
      if (dist[from][k] + dist[k][to] === dist[from][to]) {
        const pathToK = getPath(from, k);
        const pathFromK = getPath(k, to);
        if (pathToK.length > 0 && pathFromK.length > 0) {
          const result = [...pathToK, ...pathFromK.slice(1)];
          memo[key] = result;
          return result;
        }
      }
    }
    
    return [from, to];
  };

  const path = getPath(start, end);

  return {
    path,
    distance: dist[start][end] === Number.MAX_SAFE_INTEGER ? 0 : dist[start][end],
    time: time[start][end] === Number.MAX_SAFE_INTEGER ? 0 : time[start][end],
  };
};

// Nearest Neighbor (Greedy) algorithm
export const nearestNeighbor = (
  graph: RouteGraph,
  start: string,
  end: string
): { path: string[]; distance: number; time: number } => {
  const { nodes, edges } = graph;
  const visited = new Set<string>();
  const path = [start];
  let current = start;
  let totalDistance = 0;
  let totalTime = 0;

  visited.add(start);

  while (current !== end && visited.size < Object.keys(nodes).length) {
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

    if (nearestNode === "") break;

    path.push(nearestNode);
    visited.add(nearestNode);
    current = nearestNode;
    totalDistance += nearestDistance;
    totalTime += nearestTime;

    // If we reached the end, break
    if (current === end) break;
  }

  // If we didn't reach the end, try direct connection
  if (current !== end) {
    const directEdge = edges.find(edge => edge.from === current && edge.to === end);
    if (directEdge) {
      path.push(end);
      totalDistance += directEdge.distance;
      totalTime += directEdge.time;
    }
  }

  return {
    path: path[path.length - 1] === end ? path : [],
    distance: path[path.length - 1] === end ? totalDistance : 0,
    time: path[path.length - 1] === end ? totalTime : 0,
  };
};

// Branch and Bound algorithm
export const branchAndBound = (
  graph: RouteGraph,
  start: string,
  end: string
): { path: string[]; distance: number; time: number } => {
  const { nodes, edges } = graph;
  
  interface Node {
    path: string[];
    cost: number;
    time: number;
    bound: number;
  }

  const calculateBound = (path: string[], target: string): number => {
    const current = path[path.length - 1];
    const visited = new Set(path);
    
    // Find minimum edge cost to unvisited nodes
    let minCost = Number.MAX_SAFE_INTEGER;
    edges
      .filter(edge => edge.from === current && !visited.has(edge.to))
      .forEach(edge => {
        minCost = Math.min(minCost, edge.distance);
      });
    
    return minCost === Number.MAX_SAFE_INTEGER ? 0 : minCost;
  };

  const queue: Node[] = [{
    path: [start],
    cost: 0,
    time: 0,
    bound: calculateBound([start], end)
  }];

  let bestSolution: Node | null = null;
  let bestCost = Number.MAX_SAFE_INTEGER;

  while (queue.length > 0) {
    // Sort by bound (best-first search)
    queue.sort((a, b) => (a.cost + a.bound) - (b.cost + b.bound));
    const current = queue.shift()!;

    // Prune if bound exceeds best known solution
    if (current.cost + current.bound >= bestCost) continue;

    const currentNode = current.path[current.path.length - 1];

    if (currentNode === end) {
      if (current.cost < bestCost) {
        bestCost = current.cost;
        bestSolution = current;
      }
      continue;
    }

    // Expand current node
    edges
      .filter(edge => edge.from === currentNode && !current.path.includes(edge.to))
      .forEach(edge => {
        const newPath = [...current.path, edge.to];
        const newCost = current.cost + edge.distance;
        const newTime = current.time + edge.time;
        const newBound = calculateBound(newPath, end);

        if (newCost + newBound < bestCost) {
          queue.push({
            path: newPath,
            cost: newCost,
            time: newTime,
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
  }
  return totalCost;
};

const calculatePathTime = (path: string[], graph: RouteGraph): number => {
  if (path.length < 2) return 0;
  
  let totalTime = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = graph.edges.find(e => e.from === path[i] && e.to === path[i + 1]);
    if (edge) totalTime += edge.time;
  }
  return totalTime;
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

// Main function to run simulation based on the selected parameters
export const runSimulation = (params: SimulationParams): SimulationResult => {
  const { algorithm, mapType, weather, timeOfDay, startLocation, endLocation, vehicle } = params;
  
  // Get the route graph for the selected map
  const graph = getRouteGraph(mapType);
  
  // Run the selected algorithm
  let result;
  switch (algorithm) {
    case 'brute-force':
      result = bruteForce(graph, startLocation, endLocation);
      break;
    case 'dynamic-programming':
      result = dynamicProgramming(graph, startLocation, endLocation);
      break;
    case 'nearest-neighbor':
      result = nearestNeighbor(graph, startLocation, endLocation);
      break;
    case 'branch-and-bound':
      result = branchAndBound(graph, startLocation, endLocation);
      break;
    default:
      result = nearestNeighbor(graph, startLocation, endLocation);
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
    case 'brute-force':
      return {
        name: "Brute Force",
        description: "Brute force examines all possible paths between the start and end nodes to find the optimal solution. It guarantees finding the best path but at the cost of computational efficiency.",
        timeComplexity: "O(n!) where n is the number of nodes",
        spaceComplexity: "O(n)",
        pros: [
          "Guarantees the optimal solution",
          "Simple to understand and implement",
          "Works for any graph structure"
        ],
        cons: [
          "Extremely slow for large graphs",
          "Exponential time complexity",
          "Not practical for real-world applications"
        ]
      };
    case 'dynamic-programming':
      return {
        name: "Dynamic Programming (Held-Karp)",
        description: "Dynamic programming solves the shortest path problem by breaking it down into subproblems and storing results to avoid redundant calculations. The Held-Karp algorithm is optimal for the traveling salesman problem.",
        timeComplexity: "O(n²·2ⁿ) for TSP, O(n³) for shortest path",
        spaceComplexity: "O(n·2ⁿ) for TSP, O(n²) for shortest path",
        pros: [
          "Optimal solution guaranteed",
          "Avoids redundant calculations through memoization",
          "More efficient than brute force"
        ],
        cons: [
          "Still exponential for TSP variants",
          "High memory usage",
          "Complex implementation"
        ]
      };
    case 'nearest-neighbor':
      return {
        name: "Nearest Neighbor (Greedy)",
        description: "The nearest neighbor algorithm is a greedy approach that always selects the closest unvisited node. While fast and simple, it doesn't guarantee the optimal solution.",
        timeComplexity: "O(n²)",
        spaceComplexity: "O(n)",
        pros: [
          "Very fast execution",
          "Simple to implement",
          "Good for real-time applications"
        ],
        cons: [
          "Does not guarantee optimal solution",
          "Can get stuck in local optima",
          "Quality depends on starting point"
        ]
      };
    case 'branch-and-bound':
      return {
        name: "Branch and Bound",
        description: "Branch and bound systematically explores the solution space while pruning branches that cannot lead to better solutions. It combines the completeness of brute force with intelligent pruning.",
        timeComplexity: "O(n!) worst case, much better in practice",
        spaceComplexity: "O(n)",
        pros: [
          "Guarantees optimal solution",
          "More efficient than brute force through pruning",
          "Can provide bounds on solution quality"
        ],
        cons: [
          "Still exponential in worst case",
          "Performance depends on bounding function quality",
          "Complex to implement effectively"
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
