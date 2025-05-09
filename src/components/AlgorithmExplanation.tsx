
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Algorithm, SimulationResult } from '../types';
import { getAlgorithmDescription } from '../utils/algorithms';

interface AlgorithmExplanationProps {
  algorithm: Algorithm;
  result: SimulationResult | null;
}

const AlgorithmExplanation = ({ algorithm, result }: AlgorithmExplanationProps) => {
  const algorithmInfo = getAlgorithmDescription(algorithm);
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{algorithmInfo.name}</span>
        </CardTitle>
        <CardDescription>
          Learn about how this algorithm works and its characteristics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="complexity">Complexity</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4 pt-4">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground">{algorithmInfo.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Pros</h4>
                <ul className="list-disc pl-5">
                  {algorithmInfo.pros.map((pro, index) => (
                    <li key={index} className="text-muted-foreground">{pro}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Cons</h4>
                <ul className="list-disc pl-5">
                  {algorithmInfo.cons.map((con, index) => (
                    <li key={index} className="text-muted-foreground">{con}</li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="complexity" className="space-y-4 pt-4">
            <div>
              <h4 className="font-medium mb-2">Time Complexity</h4>
              <p className="text-muted-foreground">{algorithmInfo.timeComplexity}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {algorithm === 'dijkstra' && "Where |V| is the number of vertices and |E| is the number of edges in the graph."}
                {algorithm === 'astar' && "The actual performance depends heavily on the heuristic function used."}
                {algorithm === 'bellman-ford' && "Where |V| is the number of vertices and |E| is the number of edges in the graph."}
                {algorithm === 'floyd-warshall' && "Where |V| is the number of vertices in the graph."}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Space Complexity</h4>
              <p className="text-muted-foreground">{algorithmInfo.spaceComplexity}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {algorithm === 'dijkstra' && "Storage needed for the distance array, visited set, and priority queue."}
                {algorithm === 'astar' && "Requires storage for open and closed sets, plus the cost function values."}
                {algorithm === 'bellman-ford' && "Storage needed primarily for the distance and predecessor arrays."}
                {algorithm === 'floyd-warshall' && "Requires a |V|×|V| matrix to store shortest path distances between all pairs."}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Real-World Applicability</h4>
              <p className="text-muted-foreground">
                {algorithm === 'dijkstra' && "Widely used in network routing protocols and GPS navigation systems for finding shortest paths."}
                {algorithm === 'astar' && "Used in pathfinding for games, robotics, and navigation systems where a target location is known."}
                {algorithm === 'bellman-ford' && "Applied in routing protocols like RIP (Routing Information Protocol) that can handle negative edges."}
                {algorithm === 'floyd-warshall' && "Useful in applications requiring all-pairs shortest paths like network optimization and traffic analysis."}
              </p>
            </div>
          </TabsContent>
          <TabsContent value="analysis" className="space-y-4 pt-4">
            <div>
              <h4 className="font-medium mb-2">Performance in This Scenario</h4>
              {result ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    {algorithm === 'dijkstra' && 
                     "Dijkstra's algorithm efficiently found a shortest path based on the edge weights (distances). It guarantees the optimal solution when all edge weights are positive."}
                    {algorithm === 'astar' && 
                     "A* utilized a heuristic to guide the search toward the destination, potentially examining fewer nodes than Dijkstra's algorithm."}
                    {algorithm === 'bellman-ford' && 
                     "Bellman-Ford computed the shortest path while checking for negative-weight cycles (though none exist in this scenario)."}
                    {algorithm === 'floyd-warshall' && 
                     "Floyd-Warshall calculated shortest paths between all pairs of locations, which is more computation than needed for a single source-destination pair."}
                  </p>
                  
                  <p className="text-muted-foreground mt-2">
                    {result.path.length === 0 ? 
                      "No valid path was found between the selected locations." :
                      `Found a path with ${result.path.length} nodes, ${formatDistance(result.metrics.distance)} long, taking approximately ${formatTime(result.metrics.time)}.`
                    }
                  </p>
                  
                  <h4 className="font-medium mt-4 mb-2">Why This Algorithm {result.metrics.totalScore < 50 ? "Performed Well" : "May Not Be Optimal"}</h4>
                  <p className="text-muted-foreground">
                    {algorithm === 'dijkstra' && result.metrics.totalScore < 50 &&
                     "Dijkstra's algorithm works well in this scenario because the graph has positive weights and finding the shortest path from a single source is exactly what it's optimized for."}
                    {algorithm === 'dijkstra' && result.metrics.totalScore >= 50 &&
                     "While Dijkstra's algorithm guarantees the shortest path, it doesn't consider factors like traffic or weather conditions unless they're explicitly encoded in the edge weights."}
                    
                    {algorithm === 'astar' && result.metrics.totalScore < 50 &&
                     "A* performed well because it used a heuristic to focus the search toward the destination, making it efficient for this specific source-destination pair."}
                    {algorithm === 'astar' && result.metrics.totalScore >= 50 &&
                     "A*'s performance depends heavily on the quality of the heuristic function. In complex scenarios with many factors like traffic and weather, designing a perfect heuristic is challenging."}
                    
                    {algorithm === 'bellman-ford' && result.metrics.totalScore < 50 &&
                     "Bellman-Ford found an optimal solution, though it may have examined more edges than necessary since it checks for negative-weight cycles (which aren't present in this scenario)."}
                    {algorithm === 'bellman-ford' && result.metrics.totalScore >= 50 &&
                     "Bellman-Ford is generally slower than Dijkstra's algorithm for positive-weight graphs like this one, as it processes all edges repeatedly without a priority queue."}
                    
                    {algorithm === 'floyd-warshall' && result.metrics.totalScore < 50 &&
                     "Floyd-Warshall found the correct shortest path, though it calculated paths between all pairs of locations rather than just the requested source and destination."}
                    {algorithm === 'floyd-warshall' && result.metrics.totalScore >= 50 &&
                     "Floyd-Warshall is computationally expensive for large graphs as it calculates paths between all pairs of locations, which is unnecessary for a single route query."}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">Run the simulation to see analysis for this algorithm.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Helper functions for formatting
const formatTime = (seconds: number): string => {
  if (seconds === 0) return '-';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};

const formatDistance = (meters: number): string => {
  if (meters === 0) return '-';
  
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  } else {
    return `${Math.round(meters)} m`;
  }
};

export default AlgorithmExplanation;
