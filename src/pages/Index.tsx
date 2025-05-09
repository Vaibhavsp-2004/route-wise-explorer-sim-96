
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MapView from '../components/MapView';
import ComparisonTable from '../components/ComparisonTable';
import AlgorithmExplanation from '../components/AlgorithmExplanation';
import { Algorithm, MapType, SimulationParams, SimulationResult } from '../types';
import { runSimulation } from '../utils/algorithms';
import { mapLocations } from '../data/maps';
import { toast } from '@/components/ui/sonner';

const Index = () => {
  // Initialize simulation parameters
  const [params, setParams] = useState<SimulationParams>({
    algorithm: 'dijkstra',
    mapType: 'city',
    weather: 'sunny',
    timeOfDay: 'afternoon',
    startLocation: mapLocations.city[0].id,
    endLocation: mapLocations.city[1].id,
    vehicle: 'car',
  });
  
  const [result, setResult] = useState<SimulationResult | null>(null);
  
  // Handle running the simulation
  const handleRunSimulation = () => {
    try {
      // Ensure start and end locations are different
      if (params.startLocation === params.endLocation) {
        toast.error("Start and end locations must be different");
        return;
      }
      
      // Run the simulation
      const simulationResult = runSimulation(params);
      
      // Check if path was found
      if (simulationResult.path.length === 0) {
        toast.warning("No valid path found between selected locations");
      } else {
        toast.success("Route calculated successfully!");
      }
      
      setResult(simulationResult);
    } catch (error) {
      console.error("Simulation error:", error);
      toast.error("Error running simulation");
    }
  };
  
  // Reset result when parameters change
  useEffect(() => {
    setResult(null);
  }, [params.mapType, params.startLocation, params.endLocation]);
  
  return (
    <div className="flex h-screen">
      <Sidebar params={params} setParams={setParams} onRunSimulation={handleRunSimulation} />
      
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-foreground">DAA Algorithm Comparison Simulator</h1>
            <Link 
              to="/explanation" 
              state={{ algorithm: params.algorithm, result }}
              className="text-primary hover:text-primary/80 underline"
            >
              View Full Explanation
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[400px]">
              <MapView 
                mapType={params.mapType as MapType} 
                result={result} 
                startLocation={params.startLocation}
                endLocation={params.endLocation}
              />
            </div>
            <div>
              <ComparisonTable result={result} />
            </div>
          </div>
          
          <div className="mt-8">
            <AlgorithmExplanation 
              algorithm={params.algorithm as Algorithm} 
              result={result} 
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
