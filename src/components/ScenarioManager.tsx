
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Save, X, Play } from 'lucide-react';
import { SimulationParams } from '../types';
import { toast } from '@/components/ui/sonner';

interface Scenario {
  id: string;
  name: string;
  params: SimulationParams;
  createdAt: string;
}

interface ScenarioManagerProps {
  currentParams: SimulationParams;
  onLoadScenario: (params: SimulationParams) => void;
  onRunSimulation: () => void;
}

const ScenarioManager: React.FC<ScenarioManagerProps> = ({ 
  currentParams, 
  onLoadScenario,
  onRunSimulation
}) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioName, setScenarioName] = useState('');

  // Load scenarios from localStorage on component mount
  useEffect(() => {
    const savedScenarios = localStorage.getItem('daa-scenarios');
    if (savedScenarios) {
      try {
        setScenarios(JSON.parse(savedScenarios));
      } catch (error) {
        console.error('Error loading scenarios:', error);
        toast.error('Failed to load saved scenarios');
      }
    }
  }, []);

  // Save scenarios to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('daa-scenarios', JSON.stringify(scenarios));
  }, [scenarios]);

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) {
      toast.error('Please enter a scenario name');
      return;
    }

    // Check if a scenario with this name already exists
    const existingIndex = scenarios.findIndex(s => s.name === scenarioName);
    
    if (existingIndex >= 0) {
      // Update existing scenario
      const updatedScenarios = [...scenarios];
      updatedScenarios[existingIndex] = {
        ...updatedScenarios[existingIndex],
        params: currentParams,
        createdAt: new Date().toISOString()
      };
      
      setScenarios(updatedScenarios);
      toast.success(`Updated scenario "${scenarioName}"`);
    } else {
      // Create new scenario
      const newScenario: Scenario = {
        id: `scenario-${Date.now()}`,
        name: scenarioName,
        params: currentParams,
        createdAt: new Date().toISOString()
      };
      
      setScenarios([...scenarios, newScenario]);
      toast.success(`Saved scenario "${scenarioName}"`);
    }
    
    setScenarioName('');
  };

  const handleLoadScenario = (scenario: Scenario) => {
    onLoadScenario(scenario.params);
    toast.success(`Loaded scenario "${scenario.name}"`);
  };

  const handleDeleteScenario = (id: string, name: string) => {
    setScenarios(scenarios.filter(s => s.id !== id));
    toast.info(`Deleted scenario "${name}"`);
  };

  const handleRunScenario = (scenario: Scenario) => {
    onLoadScenario(scenario.params);
    setTimeout(onRunSimulation, 100); // Small delay to ensure params are updated
    toast.success(`Running scenario "${scenario.name}"`);
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="bg-sidebar-accent border-sidebar-border mb-4">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="scenario-name">Scenario Name</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="scenario-name"
                  placeholder="My Scenario"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border"
                />
                <Button 
                  onClick={handleSaveScenario}
                  className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground"
                >
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 overflow-y-auto">
        <h3 className="text-sidebar-foreground font-medium mb-2">Saved Scenarios</h3>
        
        {scenarios.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            No scenarios saved yet. Configure a simulation and save it to start.
          </p>
        ) : (
          <div className="space-y-2">
            {scenarios.map((scenario) => (
              <Card 
                key={scenario.id} 
                className="bg-sidebar-accent border-sidebar-border"
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-medium text-sidebar-foreground">{scenario.name}</h4>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteScenario(scenario.id, scenario.name)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2">
                    {new Date(scenario.createdAt).toLocaleString()}
                  </div>
                  
                  <div className="text-xs text-sidebar-foreground mb-2">
                    <div>Algorithm: {scenario.params.algorithm}</div>
                    <div>Map: {scenario.params.mapType}</div>
                    <div>Conditions: {scenario.params.weather}, {scenario.params.timeOfDay}</div>
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => handleLoadScenario(scenario)}
                    >
                      Load
                    </Button>
                    <Button 
                      size="sm"
                      className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-xs flex items-center gap-1"
                      onClick={() => handleRunScenario(scenario)}
                    >
                      <Play className="h-3 w-3" /> Run
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScenarioManager;
