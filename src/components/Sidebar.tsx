
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Route, CloudSun, Clock, Car, ChevronRight } from "lucide-react";
import { Algorithm, MapType, SimulationParams, Weather, TimeOfDay, Vehicle, Location } from "../types";
import { mapLocations } from "../data/maps";

interface SidebarProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  onRunSimulation: () => void;
  tabbed?: boolean;
}

const Sidebar = ({ params, setParams, onRunSimulation, tabbed = false }: SidebarProps) => {
  const availableLocations: Location[] = mapLocations[params.mapType as MapType];

  const handleChange = (key: keyof SimulationParams, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }));

    // Reset start location when map changes
    if (key === 'mapType') {
      const newLocations = mapLocations[value as MapType];
      if (newLocations.length >= 1) {
        setParams((prev) => ({ 
          ...prev, 
          mapType: value as MapType,
          startLocation: newLocations[0].id
        }));
      }
    }
  };

  const content = (
    <>
      <Card className="bg-sidebar-accent border-sidebar-border">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Algorithm Selection */}
            <div className="space-y-2">
              <Label htmlFor="algorithm" className="text-sidebar-foreground flex items-center gap-2">
                <Route size={16} />
                TSP Algorithm
              </Label>
              <Select
                value={params.algorithm}
                onValueChange={(value) => handleChange('algorithm', value)}
              >
                <SelectTrigger className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border">
                  <SelectValue placeholder="Select Algorithm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brute-force">Brute Force TSP</SelectItem>
                  <SelectItem value="dynamic-programming">Dynamic Programming (Held-Karp)</SelectItem>
                  <SelectItem value="nearest-neighbor">Nearest Neighbor TSP</SelectItem>
                  <SelectItem value="branch-and-bound">Branch and Bound TSP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Map Selection */}
            <div className="space-y-2">
              <Label htmlFor="map" className="text-sidebar-foreground flex items-center gap-2">
                <MapPin size={16} />
                Map Type
              </Label>
              <Select
                value={params.mapType}
                onValueChange={(value) => handleChange('mapType', value)}
              >
                <SelectTrigger className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border">
                  <SelectValue placeholder="Select Map" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="karnataka">Karnataka State</SelectItem>
                  <SelectItem value="bengaluru">Bengaluru City</SelectItem>
                  <SelectItem value="mysuru">Mysuru Region</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Weather Selection */}
            <div className="space-y-2">
              <Label htmlFor="weather" className="text-sidebar-foreground flex items-center gap-2">
                <CloudSun size={16} />
                Weather Condition
              </Label>
              <Select
                value={params.weather}
                onValueChange={(value) => handleChange('weather', value)}
              >
                <SelectTrigger className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border">
                  <SelectValue placeholder="Select Weather" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunny">Sunny</SelectItem>
                  <SelectItem value="rainy">Rainy</SelectItem>
                  <SelectItem value="foggy">Foggy</SelectItem>
                  <SelectItem value="snowy">Snowy</SelectItem>
                  <SelectItem value="windy">Windy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time of Day */}
            <div className="space-y-2">
              <Label htmlFor="timeOfDay" className="text-sidebar-foreground flex items-center gap-2">
                <Clock size={16} />
                Time of Day
              </Label>
              <Select
                value={params.timeOfDay}
                onValueChange={(value) => handleChange('timeOfDay', value)}
              >
                <SelectTrigger className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border">
                  <SelectValue placeholder="Select Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Starting Location for TSP */}
            <div className="space-y-2">
              <Label htmlFor="startLocation" className="text-sidebar-foreground">Starting City (TSP)</Label>
              <Select
                value={params.startLocation}
                onValueChange={(value) => handleChange('startLocation', value)}
              >
                <SelectTrigger className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border">
                  <SelectValue placeholder="Select Starting City" />
                </SelectTrigger>
                <SelectContent>
                  {availableLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle Type */}
            <div className="space-y-2">
              <Label htmlFor="vehicle" className="text-sidebar-foreground flex items-center gap-2">
                <Car size={16} />
                Vehicle Type
              </Label>
              <Select
                value={params.vehicle}
                onValueChange={(value) => handleChange('vehicle', value)}
              >
                <SelectTrigger className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border">
                  <SelectValue placeholder="Select Vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="ambulance">Ambulance</SelectItem>
                  <SelectItem value="bus">Bus</SelectItem>
                  <SelectItem value="ev">Electric Vehicle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* TSP Info */}
            <div className="p-3 bg-muted border border-sidebar-border rounded-md">
              <p className="text-xs text-sidebar-foreground">
                <strong>TSP (Traveling Salesman Problem):</strong> Find the shortest tour that visits all cities exactly once and returns to the starting city.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={onRunSimulation}
        className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground flex items-center justify-center gap-2 py-6 mt-4"
      >
        Solve TSP
        <ChevronRight size={18} />
      </Button>
    </>
  );

  if (tabbed) {
    return content;
  }

  return (
    <aside className="bg-sidebar p-4 rounded-lg w-80 flex flex-col gap-5 h-full max-h-screen overflow-y-auto">
      <div className="flex items-center justify-center mb-2">
        <h2 className="text-sidebar-foreground text-2xl font-bold">Karnataka TSP Solver</h2>
      </div>
      {content}
    </aside>
  );
};

export default Sidebar;
