
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAlgorithmDescription } from '../utils/algorithms';
import { Algorithm, SimulationResult } from '../types';
import { ChevronLeft } from 'lucide-react';

const Explanation = () => {
  const location = useLocation();
  const { algorithm, result } = location.state || { algorithm: 'dijkstra', result: null };
  
  const algorithmInfo = getAlgorithmDescription(algorithm as Algorithm);
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ChevronLeft size={16} />
              Back to Simulator
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{algorithmInfo.name}</h1>
        </div>
        
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="complexity">Complexity</TabsTrigger>
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Algorithm Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>{algorithmInfo.description}</p>
                
                <h3 className="text-lg font-medium mt-4">Key Characteristics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Advantages</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {algorithmInfo.pros.map((pro, index) => (
                        <li key={index}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Limitations</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {algorithmInfo.cons.map((con, index) => (
                        <li key={index}>{con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {algorithm === 'dijkstra' && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium">How Dijkstra's Algorithm Works</h3>
                    <p className="mt-2">
                      Dijkstra's algorithm maintains a set of visited nodes and distances from the source to each node. 
                      It repeatedly selects the unvisited node with the minimum distance, marks it as visited, 
                      and updates the distances to all its neighbors if a shorter path is found.
                    </p>
                    <ol className="list-decimal pl-5 mt-2 space-y-1">
                      <li>Initialize distances of all nodes to infinity except the source node (set to 0)</li>
                      <li>Create a set of unvisited nodes</li>
                      <li>While the unvisited set is not empty:
                        <ul className="list-disc pl-5 mt-1">
                          <li>Select the unvisited node with the minimum distance</li>
                          <li>Mark it as visited</li>
                          <li>Update distances to all adjacent unvisited nodes</li>
                        </ul>
                      </li>
                      <li>When destination is visited or all reachable nodes are visited, the algorithm terminates</li>
                    </ol>
                  </div>
                )}
                
                {algorithm === 'astar' && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium">How A* Algorithm Works</h3>
                    <p className="mt-2">
                      A* is an informed search algorithm that uses a heuristic function to guide its path exploration.
                      It evaluates nodes by combining the cost to reach the node (g-score) and the estimated cost to reach the goal (h-score).
                    </p>
                    <ol className="list-decimal pl-5 mt-2 space-y-1">
                      <li>Initialize open and closed sets</li>
                      <li>Add start node to the open set with f-score = g-score + h-score</li>
                      <li>While the open set is not empty:
                        <ul className="list-disc pl-5 mt-1">
                          <li>Select node with lowest f-score from open set</li>
                          <li>If it's the goal node, reconstruct and return the path</li>
                          <li>Move current node from open set to closed set</li>
                          <li>For each neighbor, update scores and add to open set if better path found</li>
                        </ul>
                      </li>
                    </ol>
                  </div>
                )}
                
                {algorithm === 'bellman-ford' && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium">How Bellman-Ford Algorithm Works</h3>
                    <p className="mt-2">
                      The Bellman-Ford algorithm finds shortest paths from a source vertex to all other vertices, even in graphs with negative weight edges.
                      It can also detect negative weight cycles.
                    </p>
                    <ol className="list-decimal pl-5 mt-2 space-y-1">
                      <li>Initialize distances of all vertices to infinity except source (set to 0)</li>
                      <li>Relax all edges |V|-1 times (where |V| is the number of vertices):
                        <ul className="list-disc pl-5 mt-1">
                          <li>For each edge (u,v) with weight w, if distance[u] + w &lt; distance[v], update distance[v]</li>
                        </ul>
                      </li>
                      <li>Check for negative weight cycles by attempting one more relaxation</li>
                      <li>If any distance changes, a negative cycle exists</li>
                    </ol>
                  </div>
                )}
                
                {algorithm === 'floyd-warshall' && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium">How Floyd-Warshall Algorithm Works</h3>
                    <p className="mt-2">
                      Floyd-Warshall is a dynamic programming algorithm that finds shortest paths between all pairs of vertices in a weighted graph.
                      It considers all possible intermediate vertices for each pair.
                    </p>
                    <ol className="list-decimal pl-5 mt-2 space-y-1">
                      <li>Initialize distance matrix from the adjacency matrix of the graph</li>
                      <li>Consider each vertex as an intermediate point for all possible pairs of vertices:
                        <ul className="list-disc pl-5 mt-1">
                          <li>For each pair (i,j), check if path through vertex k is shorter: dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])</li>
                        </ul>
                      </li>
                      <li>After all iterations, the matrix contains shortest distances between all pairs of vertices</li>
                    </ol>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="complexity" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Algorithm Complexity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium">Time Complexity</h3>
                    <div className="bg-muted p-3 rounded-md mt-2">
                      <code className="font-mono text-lg">{algorithmInfo.timeComplexity}</code>
                    </div>
                    <p className="mt-2">
                      {algorithm === 'dijkstra' && 
                       "Where |V| is the number of vertices and |E| is the number of edges. Using a binary heap priority queue implementation, Dijkstra's algorithm can achieve O((|E|+|V|)log|V|) time complexity."}
                      
                      {algorithm === 'astar' && 
                       "The actual runtime depends heavily on the heuristic function. With a perfect heuristic, A* can find the solution with minimal exploration. With a poor heuristic, it can degrade to Dijkstra's O((|E|+|V|)log|V|) or worse."}
                      
                      {algorithm === 'bellman-ford' && 
                       "The algorithm makes |V|-1 passes over all |E| edges, resulting in O(|V|·|E|) time complexity. For dense graphs, this can approach O(|V|³)."}
                      
                      {algorithm === 'floyd-warshall' && 
                       "The algorithm uses three nested loops over all vertices, resulting in O(|V|³) time complexity regardless of the graph's density."}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Space Complexity</h3>
                    <div className="bg-muted p-3 rounded-md mt-2">
                      <code className="font-mono text-lg">{algorithmInfo.spaceComplexity}</code>
                    </div>
                    <p className="mt-2">
                      {algorithm === 'dijkstra' && 
                       "Space is needed to store the distance values for each vertex, the predecessor/parent pointers for path reconstruction, and the priority queue."}
                      
                      {algorithm === 'astar' && 
                       "A* maintains open and closed sets, plus f, g, and h score values for vertices. In worst case, it might need to store all vertices in these collections."}
                      
                      {algorithm === 'bellman-ford' && 
                       "The algorithm needs space for the distance values and predecessor pointers for each vertex."}
                      
                      {algorithm === 'floyd-warshall' && 
                       "Floyd-Warshall requires O(|V|²) space for the distance matrix, and an additional O(|V|²) for the next/predecessor matrix if path reconstruction is needed."}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium">Comparison with Other Algorithms</h3>
                  <div className="overflow-x-auto mt-2">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 text-left font-medium">Aspect</th>
                          <th className="py-2 px-4 text-left font-medium">Dijkstra</th>
                          <th className="py-2 px-4 text-left font-medium">A*</th>
                          <th className="py-2 px-4 text-left font-medium">Bellman-Ford</th>
                          <th className="py-2 px-4 text-left font-medium">Floyd-Warshall</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        <tr>
                          <td className="py-2 px-4 font-medium">Time Complexity</td>
                          <td className="py-2 px-4">O((|E|+|V|)log|V|)</td>
                          <td className="py-2 px-4">O((|E|+|V|)log|V|)*</td>
                          <td className="py-2 px-4">O(|V|·|E|)</td>
                          <td className="py-2 px-4">O(|V|³)</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-medium">Negative Edges</td>
                          <td className="py-2 px-4">No</td>
                          <td className="py-2 px-4">No</td>
                          <td className="py-2 px-4">Yes</td>
                          <td className="py-2 px-4">Yes</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-medium">All-Pairs</td>
                          <td className="py-2 px-4">No</td>
                          <td className="py-2 px-4">No</td>
                          <td className="py-2 px-4">No</td>
                          <td className="py-2 px-4">Yes</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-medium">Heuristic</td>
                          <td className="py-2 px-4">No</td>
                          <td className="py-2 px-4">Yes</td>
                          <td className="py-2 px-4">No</td>
                          <td className="py-2 px-4">No</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-medium">Optimal Solution</td>
                          <td className="py-2 px-4">Yes</td>
                          <td className="py-2 px-4">If admissible</td>
                          <td className="py-2 px-4">Yes</td>
                          <td className="py-2 px-4">Yes</td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="text-xs mt-2">* A* complexity depends on the heuristic quality</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="visualization" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Algorithm Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-6">
                  {algorithm === 'dijkstra' && 
                   "Dijkstra's algorithm works by maintaining a priority queue of vertices, always processing the vertex with the current shortest distance from the source. Here's how it would execute on a simple graph:"}
                  {algorithm === 'astar' && 
                   "A* algorithm maintains open and closed sets of nodes, and uses a heuristic to guide the search toward the destination. This visualization shows how it would explore nodes in a graph:"}
                  {algorithm === 'bellman-ford' && 
                   "Bellman-Ford works by relaxing all edges in the graph repeatedly. This visualization shows how distances are updated in each iteration:"}
                  {algorithm === 'floyd-warshall' && 
                   "Floyd-Warshall algorithm considers each vertex as an intermediate in paths between all pairs of vertices. Here's how the distance matrix evolves:"}
                </p>
                
                <div className="bg-muted rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium mb-4">Pseudocode</h3>
                  <pre className="font-mono text-sm overflow-x-auto p-2">
                    {algorithm === 'dijkstra' && 
                     `function dijkstra(graph, source):
    dist[source] ← 0
    create vertex priority queue Q
    
    for each vertex v in graph:
        if v ≠ source
            dist[v] ← INFINITY
        prev[v] ← UNDEFINED
        add v to Q
    
    while Q is not empty:
        u ← vertex in Q with min dist[u]
        remove u from Q
        
        for each neighbor v of u:
            alt ← dist[u] + length(u, v)
            if alt < dist[v]:
                dist[v] ← alt
                prev[v] ← u
                decrease-key v in Q
    
    return dist[], prev[]`}
                    
                    {algorithm === 'astar' && 
                     `function A*(start, goal):
    openSet ← {start}
    cameFrom ← an empty map
    
    gScore ← map with default value of INFINITY
    gScore[start] ← 0
    
    fScore ← map with default value of INFINITY
    fScore[start] ← h(start)
    
    while openSet is not empty:
        current ← node in openSet with lowest fScore
        if current = goal:
            return reconstruct_path(cameFrom, current)
        
        remove current from openSet
        
        for each neighbor of current:
            tentative_gScore ← gScore[current] + d(current, neighbor)
            if tentative_gScore < gScore[neighbor]:
                cameFrom[neighbor] ← current
                gScore[neighbor] ← tentative_gScore
                fScore[neighbor] ← gScore[neighbor] + h(neighbor)
                if neighbor not in openSet:
                    add neighbor to openSet
    
    return failure`}
                    
                    {algorithm === 'bellman-ford' && 
                     `function BellmanFord(graph, source):
    dist[source] ← 0
    
    for each vertex v in graph:
        if v ≠ source
            dist[v] ← INFINITY
        prev[v] ← UNDEFINED
    
    // Relax edges |V| - 1 times
    for i from 1 to |V| - 1:
        for each edge (u, v) with weight w in graph:
            if dist[u] + w < dist[v]:
                dist[v] ← dist[u] + w
                prev[v] ← u
    
    // Check for negative-weight cycles
    for each edge (u, v) with weight w in graph:
        if dist[u] + w < dist[v]:
            error "Graph contains a negative-weight cycle"
    
    return dist[], prev[]`}
                    
                    {algorithm === 'floyd-warshall' && 
                     `function FloydWarshall(graph):
    dist ← |V| × |V| matrix initialized from adjacency matrix
    next ← |V| × |V| matrix for path reconstruction
    
    for k from 1 to |V|:
        for i from 1 to |V|:
            for j from 1 to |V|:
                if dist[i][j] > dist[i][k] + dist[k][j]:
                    dist[i][j] ← dist[i][k] + dist[k][j]
                    next[i][j] ← next[i][k]
    
    return dist, next`}
                  </pre>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Execution Steps</h3>
                  {result ? (
                    <div className="space-y-4">
                      <p>
                        {algorithm === 'dijkstra' && 
                         "In the simulation, Dijkstra's algorithm initialized distances, set the source to 0, and then repeatedly selected the node with the minimum distance. It processed nodes in increasing order of distance from the source, updating neighbor distances when shorter paths were found."}
                        {algorithm === 'astar' && 
                         "The A* algorithm in this simulation used a heuristic based on straight-line distance to guide its search toward the destination. It maintained open and closed sets, always expanding the node with the lowest f-score (g-score + heuristic)."}
                        {algorithm === 'bellman-ford' && 
                         "The Bellman-Ford algorithm in this simulation initialized distances and then performed repeated edge relaxations. It processed all edges in each pass, updating distances when shorter paths were found."}
                        {algorithm === 'floyd-warshall' && 
                         "The Floyd-Warshall algorithm calculated shortest paths between all pairs of nodes in the graph. It considered each node as an intermediate point for all possible pairs, updating the distance matrix when shorter paths were found."}
                      </p>
                      
                      <div className="border border-border rounded-md p-4">
                        <h4 className="font-medium mb-2">Path Found</h4>
                        <p>
                          {result.path.length > 0 ? 
                           `The algorithm found a path through ${result.path.length} nodes with a total distance of ${(result.metrics.distance / 1000).toFixed(2)} km.` : 
                           "No path was found between the selected locations."}
                        </p>
                        {result.path.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {result.path.map((nodeId, index) => (
                              <React.Fragment key={nodeId}>
                                <span className="px-2 py-1 bg-primary/10 rounded">{nodeId}</span>
                                {index < result.path.length - 1 && <span>→</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p>Run the simulation to see a step-by-step visualization of the algorithm execution.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="applications" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Real-World Applications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Common Use Cases</h3>
                  {algorithm === 'dijkstra' && (
                    <div className="mt-2 space-y-4">
                      <p>
                        Dijkstra's algorithm is one of the most widely used pathfinding algorithms in real-world applications, particularly where finding the shortest or least-cost path is critical.
                      </p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>
                          <strong>GPS Navigation Systems:</strong> Used in GPS and navigation apps to find the shortest route between locations.
                        </li>
                        <li>
                          <strong>Network Routing Protocols:</strong> Used in network routing to find the most efficient path for data packets.
                        </li>
                        <li>
                          <strong>Traffic Management Systems:</strong> Used to calculate optimal routes based on current traffic conditions.
                        </li>
                        <li>
                          <strong>Logistics and Supply Chain:</strong> Used for optimizing delivery routes and supply chain logistics.
                        </li>
                        <li>
                          <strong>Robotics:</strong> Used for path planning in robotics navigation systems.
                        </li>
                      </ul>
                    </div>
                  )}
                  
                  {algorithm === 'astar' && (
                    <div className="mt-2 space-y-4">
                      <p>
                        A* algorithm is particularly useful in applications where a target location is known and a heuristic can guide the search more efficiently.
                      </p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>
                          <strong>Video Games:</strong> Widely used for pathfinding in games to guide NPCs through complex environments.
                        </li>
                        <li>
                          <strong>Robotics:</strong> Used for robot navigation, especially in known environments with obstacles.
                        </li>
                        <li>
                          <strong>Artificial Intelligence:</strong> Used in AI systems for problem-solving and path planning.
                        </li>
                        <li>
                          <strong>Virtual Reality:</strong> Used for character movement and navigation in VR environments.
                        </li>
                        <li>
                          <strong>Geographic Information Systems:</strong> Used for route planning with geographic constraints.
                        </li>
                      </ul>
                    </div>
                  )}
                  
                  {algorithm === 'bellman-ford' && (
                    <div className="mt-2 space-y-4">
                      <p>
                        The Bellman-Ford algorithm is valuable in scenarios where negative edge weights exist or where detecting negative cycles is important.
                      </p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>
                          <strong>Network Routing Protocols:</strong> Used in distance-vector routing protocols like RIP (Routing Information Protocol).
                        </li>
                        <li>
                          <strong>Currency Exchange:</strong> Used to detect arbitrage opportunities in currency exchange markets.
                        </li>
                        <li>
                          <strong>Resource Allocation:</strong> Used in systems where resources can have negative costs or gains.
                        </li>
                        <li>
                          <strong>Traffic Systems:</strong> Used in traffic systems where certain routes might have incentives (negative weights).
                        </li>
                        <li>
                          <strong>Financial Modeling:</strong> Used in financial models where cash flows can be positive or negative.
                        </li>
                      </ul>
                    </div>
                  )}
                  
                  {algorithm === 'floyd-warshall' && (
                    <div className="mt-2 space-y-4">
                      <p>
                        Floyd-Warshall algorithm is especially useful when all-pairs shortest paths are needed, despite its higher computational complexity.
                      </p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>
                          <strong>Network Analysis:</strong> Used to analyze connectivity and distances in entire networks.
                        </li>
                        <li>
                          <strong>Transit Systems:</strong> Used for calculating complete distance tables for transit systems.
                        </li>
                        <li>
                          <strong>Computer Networks:</strong> Used in routing table initialization for networks.
                        </li>
                        <li>
                          <strong>Geometric Computations:</strong> Used in computational geometry for problems requiring distances between all pairs of points.
                        </li>
                        <li>
                          <strong>Traffic Engineering:</strong> Used for analyzing traffic patterns and planning in entire road networks.
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium">Performance in Different Scenarios</h3>
                  <div className="overflow-x-auto mt-2">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 text-left font-medium">Scenario</th>
                          <th className="py-2 px-4 text-left font-medium">Performance</th>
                          <th className="py-2 px-4 text-left font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {algorithm === 'dijkstra' && (
                          <>
                            <tr>
                              <td className="py-2 px-4 font-medium">Dense city networks</td>
                              <td className="py-2 px-4">Good</td>
                              <td className="py-2 px-4">Efficient for finding shortest paths in dense road networks</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 font-medium">Large-scale networks</td>
                              <td className="py-2 px-4">Moderate</td>
                              <td className="py-2 px-4">Can become slow for very large networks without optimizations</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 font-medium">Dynamic conditions</td>
                              <td className="py-2 px-4">Good</td>
                              <td className="py-2 px-4">Can be rerun efficiently when edge weights change</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 font-medium">Negative weights</td>
                              <td className="py-2 px-4">Poor</td>
                              <td className="py-2 px-4">Cannot handle negative edge weights</td>
                            </tr>
                          </>
                        )}
                        
                        {algorithm === 'astar' && (
                          <>
                            <tr>
                              <td className="py-2 px-4 font-medium">Target-directed search</td>
                              <td className="py-2 px-4">Excellent</td>
                              <td className="py-2 px-4">Very efficient when a good heuristic is available</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 font-medium">Grid-based maps</td>
                              <td className="py-2 px-4">Excellent</td>
                              <td className="py-2 px-4">Works particularly well in grid environments</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 font-medium">Complex terrain</td>
                              <td className="py-2 px-4">Good</td>
                              <td className="py-2 px-4">Handles obstacles and terrain well with appropriate heuristics</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 font-medium">Poor heuristic</td>
                              <td className="py-2 px-4">Moderate</td>
                              <td className="py-2 px-4">Degrades to Dijkstra's performance with a poor heuristic</td>
                            </tr>
                          </>
                        )}
                        
                        {algorithm === 'bellman-ford' && (
                          <>
                            <tr>
                              <td className="py-2 px-4 font-medium">Networks with negative weights</td>
                              <td className="py-2 px-4">Good</td>
                              <td className="py-2 px-4">One of few algorithms that can handle negative edge weights</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 font-medium">Detecting negative cycles</td>
                              <td className="py-2 px-4">Excellent</td>
                              <td className="py-2 px-4">Can detect and report negative weight cycles</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 font-medium">Large networks</td>
                              <td className="py-2 px-4">Poor</td>
                              <td className="py-2 px-4">Slower than Dijkstra's for large networks</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 font-medium">Distributed systems</td>
                              <td className="py-2 px-4">Good</td>
                              <td className="py-2 px-4">Can be implemented in distributed fashion</td>
                            </tr>
                          </>
                        )}
                        
                        {algorithm === 'floyd-warshall' && (
                          <>
                            <tr>
                              <td className="py-2 px-4 font-medium">All-pairs shortest paths</td>
                              <td className="py-2 px-4">Excellent</td>
                              <td className="py-2 px-4">Optimal for finding all shortest paths at once</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 font-medium">Small to medium networks</td>
                              <td className="py-2 px-4">Good</td>
                              <td className="py-2 px-4">Works well for networks with up to a few thousand nodes</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 font-medium">Large networks</td>
                              <td className="py-2 px-4">Poor</td>
                              <td className="py-2 px-4">O(n³) complexity makes it impractical for very large networks</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 font-medium">Transitive closure</td>
                              <td className="py-2 px-4">Excellent</td>
                              <td className="py-2 px-4">Well-suited for transitive closure computation</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium">Relevance to Current Technology</h3>
                  <p className="mt-2">
                    {algorithm === 'dijkstra' && 
                     "Despite being developed in 1956, Dijkstra's algorithm remains fundamental to modern navigation systems and network routing. It forms the basis for many specialized routing algorithms and continues to be enhanced with various optimizations like bidirectional search and hierarchical techniques."}
                    
                    {algorithm === 'astar' && 
                     "A* remains the algorithm of choice for pathfinding in modern video games and robotics. Recent advancements have focused on developing better heuristics, implementing hierarchical versions for large environments, and parallelizing the algorithm for better performance."}
                    
                    {algorithm === 'bellman-ford' && 
                     "Bellman-Ford is still used in networking protocols and financial applications where negative weights are meaningful. Modern implementations often incorporate optimizations like early termination and are sometimes combined with other algorithms in hybrid approaches."}
                    
                    {algorithm === 'floyd-warshall' && 
                     "While Floyd-Warshall's O(n³) complexity limits its use in very large networks, it remains valuable for smaller networks where all-pairs shortest paths are needed. It's also used as a subroutine in many graph algorithms and in preprocessing phases of more complex routing systems."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Explanation;
