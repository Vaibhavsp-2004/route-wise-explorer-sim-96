
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TabbedSidebar from '../components/TabbedSidebar';
import MapView from '../components/MapView';
import GraphBuilder from '../components/GraphBuilder';
import ComparisonTable from '../components/ComparisonTable';
import AlgorithmExplanation from '../components/AlgorithmExplanation';
import { Algorithm, MapType, SimulationParams, SimulationResult } from '../types';
import { runSimulation } from '../utils/algorithms';
import { mapLocations } from '../data/maps';
import { toast } from '@/components/ui/sonner';
import { DownloadIcon, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { exportToPDF } from '../utils/pdfExport';

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
  const [compareAlgorithm, setCompareAlgorithm] = useState<Algorithm | null>(null);
  const [compareResult, setCompareResult] = useState<SimulationResult | null>(null);
  const [activeTab, setActiveTab] = useState<MapType>('city');
  const [sidebarTab, setSidebarTab] = useState('simulation');
  
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
      
      // Also run comparison algorithm if selected
      if (compareAlgorithm) {
        const comparisonParams = {...params, algorithm: compareAlgorithm};
        const comparisonResult = runSimulation(comparisonParams);
        setCompareResult(comparisonResult);
      } else {
        setCompareResult(null);
      }
      
    } catch (error) {
      console.error("Simulation error:", error);
      toast.error("Error running simulation");
    }
  };
  
  // Handle comparison algorithm change
  const handleCompareAlgorithmChange = (algorithm: Algorithm | null) => {
    if (algorithm === params.algorithm) {
      toast.warning("Comparison algorithm must be different from primary algorithm");
      return;
    }
    setCompareAlgorithm(algorithm);
    setCompareResult(null);
  };
  
  // Reset result when parameters change
  useEffect(() => {
    setResult(null);
    setCompareResult(null);
  }, [params.mapType, params.startLocation, params.endLocation]);
  
  // Reset comparison results when primary algorithm changes
  useEffect(() => {
    if (compareAlgorithm === params.algorithm) {
      setCompareAlgorithm(null);
      setCompareResult(null);
    }
  }, [params.algorithm, compareAlgorithm]);
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as MapType);
    
    // Update map type and reset locations
    setParams(prev => ({
      ...prev,
      mapType: tab as MapType,
      startLocation: mapLocations[tab as MapType][0].id,
      endLocation: mapLocations[tab as MapType][1].id
    }));
  };

  // Generate and download PDF using our utility
  const handleDownloadPDF = () => {
    exportToPDF(params, result, compareAlgorithm, compareResult);
  };

  // Listen for sidebar tab changes
  useEffect(() => {
    const handleSidebarTabChange = (event: CustomEvent) => {
      setSidebarTab(event.detail);
    };

    window.addEventListener('sidebar-tab-change', handleSidebarTabChange as EventListener);
    
    return () => {
      window.removeEventListener('sidebar-tab-change', handleSidebarTabChange as EventListener);
    };
  }, []);

  return (
    <div className="flex h-screen">
      <TabbedSidebar 
        params={params} 
        setParams={setParams} 
        onRunSimulation={handleRunSimulation} 
      />
      
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold text-foreground">DAA Algorithm Comparison Simulator</h1>
            
            <div className="flex flex-wrap items-center gap-2">
              <Link 
                to="/explanation" 
                state={{ algorithm: params.algorithm, result }}
                className="text-primary hover:text-primary/80 underline"
              >
                View Full Explanation
              </Link>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleDownloadPDF}
                disabled={!result}
              >
                <DownloadIcon className="h-4 w-4" /> 
                Export PDF
              </Button>
            </div>
          </div>

          {sidebarTab !== 'graphBuilder' && (
            <>
              {/* Map type tabs */}
              <Tabs defaultValue="city" value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="city">City Map</TabsTrigger>
                  <TabsTrigger value="rural">Rural Map</TabsTrigger>
                  <TabsTrigger value="mountain">Mountain Map</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* Algorithm comparison selector */}
              <div className="bg-muted/40 p-4 rounded-md border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5" />
                    <h2 className="text-lg font-medium">Algorithm Comparison</h2>
                  </div>
                  
                  <RadioGroup 
                    className="flex space-x-2" 
                    value={compareAlgorithm || "none"}
                    onValueChange={(value) => handleCompareAlgorithmChange(value === "none" ? null : value as Algorithm)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="none" />
                      <Label htmlFor="none">None</Label>
                    </div>
                    
                    {["dijkstra", "astar", "bellman-ford", "floyd-warshall"].filter(algo => algo !== params.algorithm).map((algo) => (
                      <div key={algo} className="flex items-center space-x-2">
                        <RadioGroupItem value={algo} id={algo} />
                        <Label htmlFor={algo}>{algo === "dijkstra" ? "Dijkstra" : 
                                             algo === "astar" ? "A*" : 
                                             algo === "bellman-ford" ? "Bellman-Ford" : 
                                             "Floyd-Warshall"}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                
                {compareAlgorithm && compareResult && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    Comparing {params.algorithm} (solid line) with {compareAlgorithm} (dashed line)
                  </div>
                )}
              </div>
            </>
          )}
          
          <div id="pdf-content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-[400px]">
                {sidebarTab === 'graphBuilder' ? (
                  <GraphBuilder isEmbedded={true} />
                ) : (
                  <MapView 
                    mapType={params.mapType as MapType} 
                    result={result} 
                    compareResult={compareResult}
                    startLocation={params.startLocation}
                    endLocation={params.endLocation}
                    showCompare={!!compareAlgorithm && !!compareResult}
                  />
                )}
              </div>
              <div>
                {sidebarTab !== 'graphBuilder' && (
                  <ComparisonTable result={result} compareResult={compareResult} />
                )}
              </div>
            </div>
            
            {sidebarTab !== 'graphBuilder' && (
              <div className="mt-8">
                <AlgorithmExplanation 
                  algorithm={params.algorithm as Algorithm} 
                  result={result}
                  compareAlgorithm={compareAlgorithm as Algorithm | undefined}
                  compareResult={compareResult}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
