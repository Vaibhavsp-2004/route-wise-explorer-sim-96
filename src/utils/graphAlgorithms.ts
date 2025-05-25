
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

// Calculate Euclidean distance between two nodes (for A* heuristic)
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

// Dijkstra's algorithm
const dijkstra = (graph: Graph, start: string, end: string): { path: string[]; distance: number; time: number } => {
  const distances: Record<string, number> = {};
  const previous: Record<string, string> = {};
  const visited: Set<string> = new Set();
  const unvisited: Set<string> = new Set();

  // Initialize distances
  Object.keys(graph.nodes).forEach(nodeId => {
    distances[nodeId] = nodeId === start ? 0 : Infinity;
    unvisited.add(nodeId);
  });

  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    let current = '';
    let minDistance = Infinity;
    
    unvisited.forEach(nodeId => {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        current = nodeId;
      }
    });

    if (!current || distances[current] === Infinity) break;

    unvisited.delete(current);
    visited.add(current);

    if (current === end) break;

    // Update distances to neighbors
    graph.edges
      .filter(edge => edge.from === current)
      .forEach(edge => {
        const neighbor = edge.to;
        if (!visited.has(neighbor)) {
          const newDistance = distances[current] + edge.weight;
          if (newDistance < distances[neighbor]) {
            distances[neighbor] = newDistance;
            previous[neighbor] = current;
          }
        }
      });
  }

  // Reconstruct path
  const path: string[] = [];
  let current = end;
  
  if (previous[current] || current === start) {
    while (current) {
      path.unshift(current);
      if (current === start) break;
      current = previous[current];
    }
  }

  const pathCost = calculatePathCost(path, graph);

  return {
    path,
    distance: pathCost,
    time: pathCost * 0.5, // More realistic time calculation based on actual path cost
  };
};

// A* algorithm
const astar = (graph: Graph, start: string, end: string): { path: string[]; distance: number; time: number } => {
  const openSet: Set<string> = new Set([start]);
  const closedSet: Set<string> = new Set();
  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};
  const cameFrom: Record<string, string> = {};

  // Initialize scores
  Object.keys(graph.nodes).forEach(nodeId => {
    gScore[nodeId] = nodeId === start ? 0 : Infinity;
    fScore[nodeId] = nodeId === start ? calculateDistance(graph.nodes[start], graph.nodes[end]) : Infinity;
  });

  while (openSet.size > 0) {
    // Find node with lowest fScore
    let current = '';
    let minFScore = Infinity;
    
    openSet.forEach(nodeId => {
      if (fScore[nodeId] < minFScore) {
        minFScore = fScore[nodeId];
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
      
      const pathCost = calculatePathCost(path, graph);
      
      return {
        path,
        distance: pathCost,
        time: pathCost * 0.5,
      };
    }

    openSet.delete(current);
    closedSet.add(current);

    // Check neighbors
    graph.edges
      .filter(edge => edge.from === current)
      .forEach(edge => {
        const neighbor = edge.to;
        
        if (closedSet.has(neighbor)) return;

        const tentativeGScore = gScore[current] + edge.weight;

        if (!openSet.has(neighbor)) {
          openSet.add(neighbor);
        } else if (tentativeGScore >= gScore[neighbor]) {
          return;
        }

        cameFrom[neighbor] = current;
        gScore[neighbor] = tentativeGScore;
        fScore[neighbor] = gScore[neighbor] + calculateDistance(graph.nodes[neighbor], graph.nodes[end]);
      });
  }

  return { path: [], distance: 0, time: 0 };
};

// Bellman-Ford algorithm
const bellmanFord = (graph: Graph, start: string, end: string): { path: string[]; distance: number; time: number } => {
  const distances: Record<string, number> = {};
  const previous: Record<string, string> = {};
  const nodeIds = Object.keys(graph.nodes);

  // Initialize distances
  nodeIds.forEach(nodeId => {
    distances[nodeId] = nodeId === start ? 0 : Infinity;
  });

  // Relax edges |V| - 1 times
  for (let i = 0; i < nodeIds.length - 1; i++) {
    graph.edges.forEach(edge => {
      if (distances[edge.from] !== Infinity && distances[edge.from] + edge.weight < distances[edge.to]) {
        distances[edge.to] = distances[edge.from] + edge.weight;
        previous[edge.to] = edge.from;
      }
    });
  }

  // Reconstruct path
  const path: string[] = [];
  let current = end;
  
  if (previous[current] || current === start) {
    while (current) {
      path.unshift(current);
      if (current === start) break;
      current = previous[current];
    }
  }

  const pathCost = calculatePathCost(path, graph);

  return {
    path,
    distance: pathCost,
    time: pathCost * 0.5,
  };
};

// Floyd-Warshall algorithm
const floydWarshall = (graph: Graph, start: string, end: string): { path: string[]; distance: number; time: number } => {
  const nodeIds = Object.keys(graph.nodes);
  const distances: Record<string, Record<string, number>> = {};
  const next: Record<string, Record<string, string>> = {};

  // Initialize distance matrix
  nodeIds.forEach(i => {
    distances[i] = {};
    next[i] = {};
    nodeIds.forEach(j => {
      distances[i][j] = i === j ? 0 : Infinity;
      next[i][j] = j;
    });
  });

  // Fill in direct edges
  graph.edges.forEach(edge => {
    distances[edge.from][edge.to] = edge.weight;
  });

  // Floyd-Warshall main loop
  nodeIds.forEach(k => {
    nodeIds.forEach(i => {
      nodeIds.forEach(j => {
        if (distances[i][k] + distances[k][j] < distances[i][j]) {
          distances[i][j] = distances[i][k] + distances[k][j];
          next[i][j] = next[i][k];
        }
      });
    });
  });

  // Reconstruct path
  const path: string[] = [];
  if (distances[start][end] === Infinity) {
    return { path: [], distance: 0, time: 0 };
  }

  let current = start;
  path.push(current);
  
  while (current !== end) {
    current = next[current][end];
    path.push(current);
  }

  const pathCost = distances[start][end];

  return {
    path,
    distance: pathCost,
    time: pathCost * 0.5,
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
    case 'dijkstra':
      result = dijkstra(graph, start, end);
      break;
    case 'astar':
      result = astar(graph, start, end);
      break;
    case 'bellman-ford':
      result = bellmanFord(graph, start, end);
      break;
    case 'floyd-warshall':
      result = floydWarshall(graph, start, end);
      break;
    default:
      result = dijkstra(graph, start, end);
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
