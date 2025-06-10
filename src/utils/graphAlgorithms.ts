
import { Node, Edge } from 'reactflow';
import { Algorithm, SimulationResult } from '../types';

// Convert ReactFlow nodes and edges to our graph structure
interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

interface Graph {
  nodes: Record<string, GraphNode>;
  edges: GraphEdge[];
}

// Convert ReactFlow data to graph structure
const convertToGraph = (nodes: Node[], edges: Edge[]): Graph => {
  const graphNodes: Record<string, GraphNode> = {};
  const graphEdges: GraphEdge[] = [];

  nodes.forEach(node => {
    graphNodes[node.id] = {
      id: node.id,
      label: node.data.label as string,
      x: node.position.x,
      y: node.position.y,
    };
  });

  edges.forEach(edge => {
    const weight = parseInt(edge.label as string) || 1;
    graphEdges.push({
      from: edge.source,
      to: edge.target,
      weight,
    });
  });

  return { nodes: graphNodes, edges: graphEdges };
};

// Calculate total path cost (sum of edge weights)
const calculatePathCost = (path: string[], graph: Graph): number => {
  if (path.length < 2) return 0;
  
  let totalCost = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const currentNode = path[i];
    const nextNode = path[i + 1];
    
    // Find the edge between current and next node
    const edge = graph.edges.find(e => e.from === currentNode && e.to === nextNode);
    if (edge) {
      totalCost += edge.weight;
    } else {
      return Number.MAX_SAFE_INTEGER; // Invalid path
    }
  }
  
  return totalCost;
};

// Convert path from node IDs to node labels
const convertPathToLabels = (path: string[], graph: Graph): string[] => {
  return path.map(nodeId => graph.nodes[nodeId]?.label || nodeId);
};

// TSP Brute Force algorithm - tries all permutations
const bruteForce = (graph: Graph, start: string): { path: string[]; distance: number; time: number } => {
  const allNodes = Object.keys(graph.nodes);
  const otherNodes = allNodes.filter(node => node !== start);
  
  let bestPath: string[] = [];
  let bestDistance = Number.MAX_SAFE_INTEGER;
  
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
    const fullPath = [start, ...perm, start]; // Complete TSP tour
    const pathCost = calculatePathCost(fullPath, graph);
    
    if (pathCost < bestDistance && pathCost !== Number.MAX_SAFE_INTEGER) {
      bestDistance = pathCost;
      bestPath = fullPath;
    }
  }
  
  return {
    path: bestPath,
    distance: bestDistance === Number.MAX_SAFE_INTEGER ? 0 : bestDistance,
    time: (bestDistance === Number.MAX_SAFE_INTEGER ? 0 : bestDistance) * 0.5,
  };
};

// TSP Dynamic Programming (Held-Karp) algorithm
const dynamicProgramming = (graph: Graph, start: string): { path: string[]; distance: number; time: number } => {
  const allNodes = Object.keys(graph.nodes);
  const n = allNodes.length;
  
  if (n <= 1) return { path: [start], distance: 0, time: 0 };
  
  // Create index mapping
  const nodeToIndex: Record<string, number> = {};
  const indexToNode: Record<number, string> = {};
  allNodes.forEach((nodeId, index) => {
    nodeToIndex[nodeId] = index;
    indexToNode[index] = nodeId;
  });
  
  const startIndex = nodeToIndex[start];
  
  // Create distance matrix
  const dist: number[][] = Array(n).fill(null).map(() => Array(n).fill(Number.MAX_SAFE_INTEGER));
  
  // Fill distance matrix from graph edges
  graph.edges.forEach(edge => {
    const fromIndex = nodeToIndex[edge.from];
    const toIndex = nodeToIndex[edge.to];
    if (fromIndex !== undefined && toIndex !== undefined) {
      dist[fromIndex][toIndex] = edge.weight;
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
  
  return {
    path,
    distance: minCost === Number.MAX_SAFE_INTEGER ? 0 : minCost,
    time: (minCost === Number.MAX_SAFE_INTEGER ? 0 : minCost) * 0.5,
  };
};

// TSP Nearest Neighbor algorithm
const nearestNeighbor = (graph: Graph, start: string): { path: string[]; distance: number; time: number } => {
  const allNodes = Object.keys(graph.nodes);
  const visited: Set<string> = new Set();
  const path: string[] = [start];
  let current = start;
  let totalDistance = 0;
  
  visited.add(start);
  
  // Visit all other nodes
  while (visited.size < allNodes.length) {
    let nearestNode = "";
    let nearestDistance = Number.MAX_SAFE_INTEGER;
    
    // Find nearest unvisited neighbor
    graph.edges
      .filter(edge => edge.from === current && !visited.has(edge.to))
      .forEach(edge => {
        if (edge.weight < nearestDistance) {
          nearestDistance = edge.weight;
          nearestNode = edge.to;
        }
      });
    
    if (nearestNode === "") break; // No more reachable nodes
    
    path.push(nearestNode);
    visited.add(nearestNode);
    current = nearestNode;
    totalDistance += nearestDistance;
  }
  
  // Return to start to complete the TSP tour
  const returnEdge = graph.edges.find(edge => edge.from === current && edge.to === start);
  if (returnEdge && visited.size === allNodes.length) {
    path.push(start);
    totalDistance += returnEdge.weight;
  } else {
    // If we can't complete the tour, return empty
    return { path: [], distance: 0, time: 0 };
  }
  
  return {
    path,
    distance: totalDistance,
    time: totalDistance * 0.5,
  };
};

// TSP Branch and Bound algorithm
const branchAndBound = (graph: Graph, start: string): { path: string[]; distance: number; time: number } => {
  const allNodes = Object.keys(graph.nodes);
  
  interface Node {
    path: string[];
    cost: number;
    visited: Set<string>;
    bound: number;
  }
  
  const calculateTSPBound = (path: string[], visited: Set<string>): number => {
    if (visited.size === allNodes.length) {
      // All nodes visited, need to return to start
      const lastNode = path[path.length - 1];
      const returnEdge = graph.edges.find(edge => edge.from === lastNode && edge.to === start);
      return returnEdge ? returnEdge.weight : Number.MAX_SAFE_INTEGER;
    }
    
    // Calculate minimum outgoing edge cost for remaining nodes
    let minBound = 0;
    for (const nodeId of allNodes) {
      if (!visited.has(nodeId)) {
        let minEdge = Number.MAX_SAFE_INTEGER;
        graph.edges
          .filter(edge => edge.from === nodeId && !visited.has(edge.to))
          .forEach(edge => {
            minEdge = Math.min(minEdge, edge.weight);
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
    visited: new Set([start]),
    bound: calculateTSPBound([start], new Set([start]))
  }];
  
  let bestSolution: Node | null = null;
  let bestCost = Number.MAX_SAFE_INTEGER;
  
  while (queue.length > 0) {
    queue.sort((a, b) => (a.cost + a.bound) - (b.cost + b.bound));
    const current = queue.shift()!;
    
    if (current.cost + current.bound >= bestCost) continue;
    
    if (current.visited.size === allNodes.length) {
      // All nodes visited, try to return to start
      const lastNode = current.path[current.path.length - 1];
      const returnEdge = graph.edges.find(edge => edge.from === lastNode && edge.to === start);
      
      if (returnEdge) {
        const totalCost = current.cost + returnEdge.weight;
        
        if (totalCost < bestCost) {
          bestCost = totalCost;
          bestSolution = {
            path: [...current.path, start],
            cost: totalCost,
            visited: current.visited,
            bound: 0
          };
        }
      }
      continue;
    }
    
    const currentNode = current.path[current.path.length - 1];
    
    // Expand to unvisited neighbors
    graph.edges
      .filter(edge => edge.from === currentNode && !current.visited.has(edge.to))
      .forEach(edge => {
        const newVisited = new Set(current.visited);
        newVisited.add(edge.to);
        const newPath = [...current.path, edge.to];
        const newCost = current.cost + edge.weight;
        const newBound = calculateTSPBound(newPath, newVisited);
        
        if (newCost + newBound < bestCost) {
          queue.push({
            path: newPath,
            cost: newCost,
            visited: newVisited,
            bound: newBound
          });
        }
      });
  }
  
  return bestSolution ? {
    path: bestSolution.path,
    distance: bestSolution.cost,
    time: bestSolution.cost * 0.5,
  } : { path: [], distance: 0, time: 0 };
};

// Main function to run TSP simulation on graph
export const runGraphSimulation = (
  algorithm: Algorithm,
  nodes: Node[],
  edges: Edge[],
  start: string,
  end: string // Not used in TSP, but kept for interface compatibility
): SimulationResult => {
  const graph = convertToGraph(nodes, edges);
  
  let result;
  switch (algorithm) {
    case 'brute-force':
      result = bruteForce(graph, start);
      break;
    case 'dynamic-programming':
      result = dynamicProgramming(graph, start);
      break;
    case 'nearest-neighbor':
      result = nearestNeighbor(graph, start);
      break;
    case 'branch-and-bound':
      result = branchAndBound(graph, start);
      break;
    default:
      result = nearestNeighbor(graph, start);
  }

  const { path, distance, time } = result;
  
  // Convert path to use node labels instead of IDs
  const labelPath = convertPathToLabels(path, graph);

  return {
    algorithm,
    path: labelPath,
    metrics: {
      time,
      distance,
      cost: distance * 1.5,
      fuel: distance * 0.12,
      trafficImpact: Math.random() * 3 + 1,
      weatherImpact: Math.random() * 2 + 1,
      totalScore: distance + time * 0.5,
    },
  };
};
