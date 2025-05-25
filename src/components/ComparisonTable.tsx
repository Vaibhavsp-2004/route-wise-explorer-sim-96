import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimulationResult } from '../types';

interface ComparisonTableProps {
  result: SimulationResult | null;
  compareResult?: SimulationResult | null;
}

const ComparisonTable = ({ result, compareResult }: ComparisonTableProps) => {
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
  
  const formatFuel = (amount: number, algorithm: string): string => {
    if (amount === 0) return '-';
    
    if (algorithm === 'ev') {
      return `${amount.toFixed(2)} kWh`;
    } else if (algorithm === 'bike') {
      return 'Human powered';
    } else {
      return `${amount.toFixed(2)} L`;
    }
  };
  
  const formatCost = (cost: number): string => {
    if (cost === 0) return '-';
    return `₹${cost.toFixed(2)}`;
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

  const calculateDifference = (value1: number, value2: number): string => {
    const diff = ((value1 - value2) / value2) * 100;
    if (Math.abs(diff) < 0.1) return "No difference";
    return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };
  
  const getDifferenceColor = (value1: number, value2: number, lowerIsBetter = true): string => {
    if (Math.abs(value1 - value2) < 0.001) return "text-gray-500";
    const better = lowerIsBetter ? value1 < value2 : value1 > value2;
    return better ? "text-green-600" : "text-red-500";
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
  const showCompare = !!compareResult;
  
  return (
    <Card className="shadow-md">
      <CardHeader className={showCompare ? "pb-2" : ""}>
        <CardTitle>{showCompare ? 'Route Comparison' : 'Route Analysis'}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Metric</TableHead>
              <TableHead>{result.algorithm.toUpperCase()}</TableHead>
              {showCompare && <TableHead className="w-[180px]">{compareResult.algorithm.toUpperCase()}</TableHead>}
              {showCompare && <TableHead className="w-[100px]">Difference</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Time</TableCell>
              <TableCell>{formatTime(metrics.time)}</TableCell>
              {showCompare && <TableCell>{formatTime(compareResult.metrics.time)}</TableCell>}
              {showCompare && (
                <TableCell className={getDifferenceColor(metrics.time, compareResult.metrics.time)}>
                  {calculateDifference(metrics.time, compareResult.metrics.time)}
                </TableCell>
              )}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Distance</TableCell>
              <TableCell>{formatDistance(metrics.distance)}</TableCell>
              {showCompare && <TableCell>{formatDistance(compareResult.metrics.distance)}</TableCell>}
              {showCompare && (
                <TableCell className={getDifferenceColor(metrics.distance, compareResult.metrics.distance)}>
                  {calculateDifference(metrics.distance, compareResult.metrics.distance)}
                </TableCell>
              )}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Cost</TableCell>
              <TableCell>{formatCost(metrics.cost)}</TableCell>
              {showCompare && <TableCell>{formatCost(compareResult.metrics.cost)}</TableCell>}
              {showCompare && (
                <TableCell className={getDifferenceColor(metrics.cost, compareResult.metrics.cost)}>
                  {calculateDifference(metrics.cost, compareResult.metrics.cost)}
                </TableCell>
              )}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Fuel/Energy</TableCell>
              <TableCell>{formatFuel(metrics.fuel, result.algorithm)}</TableCell>
              {showCompare && <TableCell>{formatFuel(compareResult.metrics.fuel, compareResult.algorithm)}</TableCell>}
              {showCompare && (
                <TableCell className={getDifferenceColor(metrics.fuel, compareResult.metrics.fuel)}>
                  {calculateDifference(metrics.fuel, compareResult.metrics.fuel)}
                </TableCell>
              )}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Traffic Impact</TableCell>
              <TableCell className={getImpactColor(metrics.trafficImpact)}>
                {metrics.trafficImpact.toFixed(1)}/10
              </TableCell>
              {showCompare && (
                <TableCell className={getImpactColor(compareResult.metrics.trafficImpact)}>
                  {compareResult.metrics.trafficImpact.toFixed(1)}/10
                </TableCell>
              )}
              {showCompare && (
                <TableCell className={getDifferenceColor(metrics.trafficImpact, compareResult.metrics.trafficImpact)}>
                  {calculateDifference(metrics.trafficImpact, compareResult.metrics.trafficImpact)}
                </TableCell>
              )}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Weather Impact</TableCell>
              <TableCell className={getImpactColor(metrics.weatherImpact)}>
                {metrics.weatherImpact.toFixed(1)}/10
              </TableCell>
              {showCompare && (
                <TableCell className={getImpactColor(compareResult.metrics.weatherImpact)}>
                  {compareResult.metrics.weatherImpact.toFixed(1)}/10
                </TableCell>
              )}
              {showCompare && (
                <TableCell className={getDifferenceColor(metrics.weatherImpact, compareResult.metrics.weatherImpact)}>
                  {calculateDifference(metrics.weatherImpact, compareResult.metrics.weatherImpact)}
                </TableCell>
              )}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Overall Score</TableCell>
              <TableCell className={getScoreColor(metrics.totalScore)}>
                {metrics.totalScore.toFixed(2)}
              </TableCell>
              {showCompare && (
                <TableCell className={getScoreColor(compareResult.metrics.totalScore)}>
                  {compareResult.metrics.totalScore.toFixed(2)}
                </TableCell>
              )}
              {showCompare && (
                <TableCell className={getDifferenceColor(metrics.totalScore, compareResult.metrics.totalScore)}>
                  {calculateDifference(metrics.totalScore, compareResult.metrics.totalScore)}
                </TableCell>
              )}
            </TableRow>
          </TableBody>
        </Table>

        {showCompare && (
          <div className="mt-2 text-xs text-muted-foreground text-center">
            * Lower scores are better for all metrics except where noted
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComparisonTable;
