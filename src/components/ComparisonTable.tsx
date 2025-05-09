
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { SimulationResult } from '../types';

interface ComparisonTableProps {
  result: SimulationResult | null;
}

const ComparisonTable = ({ result }: ComparisonTableProps) => {
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
  
  const formatFuel = (amount: number, vehicle: string): string => {
    if (amount === 0) return '-';
    
    if (vehicle === 'ev') {
      return `${amount.toFixed(2)} kWh`;
    } else if (vehicle === 'bike') {
      return 'Human powered';
    } else {
      return `${amount.toFixed(2)} L`;
    }
  };
  
  const formatCost = (cost: number): string => {
    if (cost === 0) return '-';
    return `$${cost.toFixed(2)}`;
  };
  
  const getScoreColor = (score: number): string => {
    if (score <= 25) return 'text-green-600';
    if (score <= 50) return 'text-emerald-500';
    if (score <= 75) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getImpactText = (score: number): string => {
    if (score <= 2) return 'Low impact';
    if (score <= 5) return 'Medium impact';
    if (score <= 8) return 'High impact';
    return 'Severe impact';
  };
  
  const getImpactColor = (score: number): string => {
    if (score <= 2) return 'text-green-600';
    if (score <= 5) return 'text-emerald-500';
    if (score <= 8) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  if (!result) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="text-center p-8 text-muted-foreground">
            Run simulation to see results
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const { metrics } = result;
  
  return (
    <Card className="shadow-md">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4">Route Analysis</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Metric</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Time</TableCell>
              <TableCell>{formatTime(metrics.time)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Distance</TableCell>
              <TableCell>{formatDistance(metrics.distance)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Cost</TableCell>
              <TableCell>{formatCost(metrics.cost)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Fuel/Energy</TableCell>
              <TableCell>{formatFuel(metrics.fuel, result.algorithm)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Traffic Impact</TableCell>
              <TableCell className={getImpactColor(metrics.trafficImpact)}>
                {metrics.trafficImpact.toFixed(1)}/10 ({getImpactText(metrics.trafficImpact)})
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Weather Impact</TableCell>
              <TableCell className={getImpactColor(metrics.weatherImpact)}>
                {metrics.weatherImpact.toFixed(1)}/10 ({getImpactText(metrics.weatherImpact)})
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Overall Score</TableCell>
              <TableCell className={getScoreColor(metrics.totalScore)}>
                {metrics.totalScore.toFixed(2)} (lower is better)
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ComparisonTable;
