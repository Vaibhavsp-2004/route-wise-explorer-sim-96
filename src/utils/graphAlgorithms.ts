
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

// Calculate Euclidean distance between two nodes (for heuristic)
const calculateDistance = (node1: GraphNode, node2: GraphNode): number => {
  const dx = node1.x - node2.x;
  const dy = node1.y - node2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Convert path from node IDs to node labels
const convertPathToLabels = (path: string[], graph: Graph): string[] => {
  return path.map(nodeId => graph.nodes[nodeId]?.label || nodeId);
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
    }
  }
  
  return totalCost;
};

// Brute Force algorithm - tries all possible paths
const bruteForce = (graph: Graph, start: string, end: string): { path: string[]; distance: number; time: number } => {
  const allNodes = Object.keys(graph.nodes);
  const intermediateNodes = allNodes.filter(node => node !== start && node !== end);
  
  let bestPath: string[] = [];
  let bestDistance = Infinity;
  
  // Generate all permutations of intermediate nodes
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
  
  const permutations = permute(intermediateNodes);
  
  // Try each permutation
  for (const perm of permutations) {
    const fullPath = [start, ...perm, end];
    const pathCost = calculatePathCost(fullPath, graph);
    
    if (pathCost < bestDistance) {
      bestDistance = pathCost;
      bestPath = fullPath;
    }
  }
  
  // If no valid path found, try direct connection
  if (bestPath.length === 0) {
    const directPath = [start, end];
    const directCost = calculatePathCost(directPath, graph);
    if (directCost > 0) {
      bestPath = directPath;
      bestDistance = directCost;
    }
  }
  
  return {
    path: bestPath,
    distance: bestDistance === Infinity ? 0 : bestDistance,
    time: (bestDistance === Infinity ? 0 : bestDistance) * 0.5,
  };
};

// Dynamic Programming algorithm (simplified version using memoization)
const dynamicProgramming = (graph: Graph, start: string, end: string): { path: string[]; distance: number; time: number } => {
  const memo: Record<string, { distance: number; path: string[] }> = {};
  
  const dp = (current: string, visited: Set<string>): { distance: number; path: string[] } => {
    if (current === end) {
      return { distance: 0, path: [end] };
    }
    
    const key = `${current}-${Array.from(visited).sort().join(',')}`;
    if (memo[key]) {
      return memo[key];
    }
    
    let minDistance = Infinity;
    let bestPath: string[] = [];
    
    // Try all unvisited neighbors
    const neighbors = graph.edges
      .filter(edge => edge.from === current && !visited.has(edge.to))
      .map(edge => ({ node: edge.to, weight: edge.weight }));
    
    for (const neighbor of neighbors) {
      const newVisited = new Set(visited);
      newVisited.add(current);
      
      const result = dp(neighbor.node, newVisited);
      const totalDistance = neighbor.weight + result.distance;
      
      if (totalDistance < minDistance) {
        minDistance = totalDistance;
        bestPath = [current, ...result.path];
      }
    }
    
    const result = { distance: minDistance, path: bestPath };
    memo[key] = result;
    return result;
  };
  
  const result = dp(start, new Set());
  
  return {
    path: result.path,
    distance: result.distance === Infinity ? 0 : result.distance,
    time: (result.distance === Infinity ? 0 : result.distance) * 0.5,
  };
};

// Nearest Neighbor algorithm
const nearestNeighbor = (graph: Graph, start: string, end: string): { path: string[]; distance: number; time: number } => {
  const visited: Set<string> = new Set();
  const path: string[] = [start];
  let current = start;
  let totalDistance = 0;
  
  visited.add(start);
  
  while (current !== end) {
    // Find nearest unvisited neighbor
    const neighbors = graph.edges
      .filter(edge => edge.from === current && !visited.has(edge.to))
      .map(edge => ({ node: edge.to, weight: edge.weight }))
      .sort((a, b) => a.weight - b.weight);
    
    if (neighbors.length === 0) {
      // No unvisited neighbors, try to reach end directly if possible
      const directEdge = graph.edges.find(edge => edge.from === current && edge.to === end);
      if (directEdge) {
        path.push(end);
        totalDistance += directEdge.weight;
        break;
      } else {
        // No path found
        break;
      }
    }
    
    const nearest = neighbors[0];
    path.push(nearest.node);
    totalDistance += nearest.weight;
    visited.add(nearest.node);
    current = nearest.node;
  }
  
  return {
    path,
    distance: totalDistance,
    time: totalDistance * 0.5,
  };
};

// Branch and Bound algorithm
const branchAndBound = (graph: Graph, start: string, end: string): { path: string[]; distance: number; time: number } => {
  interface State {
    current: string;
    path: string[];
    cost: number;
    visited: Set<string>;
  }
  
  const queue: State[] = [{
    current: start,
    path: [start],
    cost: 0,
    visited: new Set([start])
  }];
  
  let bestSolution: { path: string[]; distance: number } | null = null;
  let upperBound = Infinity;
  
  while (queue.length > 0) {
    // Sort by cost + heuristic (distance to end)
    queue.sort((a, b) => {
      const heuristicA = calculateDistance(graph.nodes[a.current], graph.nodes[end]);
      const heuristicB = calculateDistance(graph.nodes[b.current], graph.nodes[end]);
      return (a.cost + heuristicA) - (b.cost + heuristicB);
    });
    
    const state = queue.shift()!;
    
    // Prune if cost exceeds upper bound
    if (state.cost >= upperBound) {
      continue;
    }
    
    if (state.current === end) {
      if (state.cost < upperBound) {
        upperBound = state.cost;
        bestSolution = { path: state.path, distance: state.cost };
      }
      continue;
    }
    
    // Expand neighbors
    const neighbors = graph.edges.filter(edge => 
      edge.from === state.current && !state.visited.has(edge.to)
    );
    
    for (const edge of neighbors) {
      const newVisited = new Set(state.visited);
      newVisited.add(edge.to);
      
      queue.push({
        current: edge.to,
        path: [...state.path, edge.to],
        cost: state.cost + edge.weight,
        visited: newVisited
      });
    }
  }
  
  return {
    path: bestSolution?.path || [],
    distance: bestSolution?.distance || 0,
    time: (bestSolution?.distance || 0) * 0.5,
  };
};

// Main function to run graph simulation
export const runGraphSimulation = (
  algorithm: Algorithm,
  nodes: Node[],
  edges: Edge[],
  start: string,
  end: string
): SimulationResult => {
  const graph = convertToGraph(nodes, edges);
  
  let result;
  switch (algorithm) {
    case 'brute-force':
      result = bruteForce(graph, start, end);
      break;
    case 'dynamic-programming':
      result = dynamicProgramming(graph, start, end);
      break;
    case 'nearest-neighbor':
      result = nearestNeighbor(graph, start, end);
      break;
    case 'branch-and-bound':
      result = branchAndBound(graph, start, end);
      break;
    default:
      result = nearestNeighbor(graph, start, end);
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
      cost: distance * 1.5, // Proper cost calculation based on actual distance
      fuel: distance * 0.12, // More realistic fuel consumption
      trafficImpact: Math.random() * 3 + 1, // 1-4 scale
      weatherImpact: Math.random() * 2 + 1, // 1-3 scale
      totalScore: distance + time * 0.5, // Weighted scoring
    },
  };
};
