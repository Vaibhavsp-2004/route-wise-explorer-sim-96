
import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Download, Upload, Plus, Trash, Hash, Play, Save, FolderOpen } from 'lucide-react';
import { MapType, Algorithm, SimulationParams, SimulationResult } from '../types';
import { runGraphSimulation } from '../utils/graphAlgorithms';

// Initial empty state
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

interface GraphBuilderProps {
  onSaveGraph?: (nodes: Node[], edges: Edge[]) => void;
  mapType?: MapType;
  showControls?: boolean;
  isEmbedded?: boolean;
  params?: SimulationParams;
  setParams?: React.Dispatch<React.SetStateAction<SimulationParams>>;
  onRunSimulation?: () => void;
}

const GraphBuilder: React.FC<GraphBuilderProps> = ({ 
  onSaveGraph, 
  mapType = 'city', 
  showControls = false,
  isEmbedded = false,
  params,
  setParams,
  onRunSimulation
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeName, setNodeName] = useState('');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [edgeWeight, setEdgeWeight] = useState<string>('1');
  const [startNode, setStartNode] = useState<string>('');
  const [endNode, setEndNode] = useState<string>('');
  const [algorithm, setAlgorithm] = useState<Algorithm>('dijkstra');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [compareAlgorithm, setCompareAlgorithm] = useState<Algorithm | null>(null);
  const [compareResult, setCompareResult] = useState<SimulationResult | null>(null);

  // Handle connecting two nodes with an edge
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        id: `e${connection.source}-${connection.target}`,
        label: '1',
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: '#FFFFFF', color: '#000000', fillOpacity: 0.7 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges],
  );

  // Add a new node to the graph
  const handleAddNode = () => {
    if (!nodeName.trim()) {
      toast.error('Please provide a node name');
      return;
    }
    
    const newNode: Node = {
      id: `node-${Date.now()}`,
      data: { label: nodeName },
      position: {
        x: Math.random() * 300 + 100,
        y: Math.random() * 300 + 100,
      },
      style: {
        background: '#ffffff',
        border: '2px solid #1a192b',
        borderRadius: '10px',
        fontSize: '12px',
        fontWeight: 'bold',
        width: 80,
        height: 40,
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
    setNodeName('');
    toast.success(`Node "${nodeName}" added`);
  };

  // Add a new edge with weight
  const handleAddEdge = () => {
    if (!selectedSource || !selectedTarget) {
      toast.error('Please select both source and target nodes');
      return;
    }

    if (selectedSource === selectedTarget) {
      toast.error('Source and target nodes must be different');
      return;
    }

    const weight = parseInt(edgeWeight) || 1;
    
    const edgeExists = edges.some(
      edge => edge.source === selectedSource && edge.target === selectedTarget
    );

    if (edgeExists) {
      setEdges(eds => 
        eds.map(edge => {
          if (edge.source === selectedSource && edge.target === selectedTarget) {
            return {
              ...edge,
              label: weight.toString(),
            };
          }
          return edge;
        })
      );
      toast.success(`Updated edge weight: ${weight}`);
    } else {
      const newEdge: Edge = {
        id: `e${selectedSource}-${selectedTarget}`,
        source: selectedSource,
        target: selectedTarget,
        label: weight.toString(),
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: '#FFFFFF', color: '#000000', fillOpacity: 0.7 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      
      setEdges(eds => [...eds, newEdge]);
      toast.success(`Edge added with weight: ${weight}`);
    }
  };

  // Delete selected nodes and edges
  const handleDeleteSelected = () => {
    setNodes(nds => nds.filter(node => !node.selected));
    setEdges(eds => eds.filter(edge => !edge.selected));
    toast.info('Selected elements deleted');
  };

  // Reset the graph
  const handleResetGraph = () => {
    if (nodes.length === 0 && edges.length === 0) return;
    
    setNodes([]);
    setEdges([]);
    setSelectedSource(null);
    setSelectedTarget(null);
    setEdgeWeight('1');
    setResult(null);
    setCompareResult(null);
    toast.info('Graph has been reset');
  };

  // Run algorithm simulation on the current graph
  const handleRunGraphSimulation = () => {
    if (nodes.length === 0) {
      toast.error('Please add nodes to the graph first');
      return;
    }

    if (!startNode || !endNode) {
      toast.error('Please select start and end nodes');
      return;
    }

    if (startNode === endNode) {
      toast.error('Start and end nodes must be different');
      return;
    }

    try {
      const simulationResult = runGraphSimulation(algorithm, nodes, edges, startNode, endNode);
      setResult(simulationResult);
      
      // Highlight path in the graph
      highlightPath(simulationResult.path);
      
      if (compareAlgorithm && compareAlgorithm !== algorithm) {
        const comparisonResult = runGraphSimulation(compareAlgorithm, nodes, edges, startNode, endNode);
        setCompareResult(comparisonResult);
        highlightComparePath(comparisonResult.path);
      }
      
      toast.success('Graph simulation completed!');
    } catch (error) {
      console.error('Graph simulation error:', error);
      toast.error('Error running graph simulation');
    }
  };

  // Highlight the path in the graph
  const highlightPath = (path: string[]) => {
    setNodes(nds => 
      nds.map(node => ({
        ...node,
        style: {
          ...node.style,
          background: path.includes(node.id) ? '#22c55e' : '#ffffff',
          color: path.includes(node.id) ? '#ffffff' : '#000000',
        }
      }))
    );

    setEdges(eds =>
      eds.map(edge => {
        const isInPath = path.some((nodeId, index) => {
          const nextNode = path[index + 1];
          return nextNode && edge.source === nodeId && edge.target === nextNode;
        });
        
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: isInPath ? '#22c55e' : '#b1b1b7',
            strokeWidth: isInPath ? 3 : 1,
          }
        };
      })
    );
  };

  // Highlight comparison path
  const highlightComparePath = (path: string[]) => {
    setEdges(eds =>
      eds.map(edge => {
        const isInComparePath = path.some((nodeId, index) => {
          const nextNode = path[index + 1];
          return nextNode && edge.source === nodeId && edge.target === nextNode;
        });
        
        if (isInComparePath) {
          return {
            ...edge,
            style: {
              ...edge.style,
              stroke: '#ef4444',
              strokeWidth: 3,
              strokeDasharray: '5,5',
            }
          };
        }
        
        return edge;
      })
    );
  };

  // Export graph as JSON
  const handleExportGraph = () => {
    if (nodes.length === 0) {
      toast.error('Graph is empty, nothing to export');
      return;
    }
    
    const graphData = { nodes, edges };
    const dataStr = JSON.stringify(graphData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `graph-export-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Graph exported successfully');
  };

  // Import graph from JSON file
  const handleImportGraph = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const graphData = JSON.parse(content);
        
        if (graphData.nodes && graphData.edges) {
          setNodes(graphData.nodes);
          setEdges(graphData.edges);
          toast.success('Graph imported successfully');
        } else {
          toast.error('Invalid graph file format');
        }
      } catch (error) {
        toast.error('Error importing graph file');
      }
    };
    reader.readAsText(file);
  };

  // Save the graph to localStorage
  const handleSaveGraph = () => {
    if (nodes.length === 0) {
      toast.error('Graph is empty, nothing to save');
      return;
    }
    
    const graphName = prompt('Enter a name for this graph:');
    if (!graphName) return;
    
    const savedGraphs = JSON.parse(localStorage.getItem('savedGraphs') || '{}');
    savedGraphs[graphName] = { nodes, edges };
    localStorage.setItem('savedGraphs', JSON.stringify(savedGraphs));
    
    if (onSaveGraph) {
      onSaveGraph(nodes, edges);
    }
    
    toast.success(`Graph "${graphName}" saved successfully`);
  };

  // Load graph from localStorage
  const handleLoadGraph = () => {
    const savedGraphs = JSON.parse(localStorage.getItem('savedGraphs') || '{}');
    const graphNames = Object.keys(savedGraphs);
    
    if (graphNames.length === 0) {
      toast.error('No saved graphs found');
      return;
    }
    
    // For simplicity, show a prompt. In production, you'd use a proper dialog
    const graphName = prompt(`Select a graph to load:\n${graphNames.join('\n')}`);
    if (!graphName || !savedGraphs[graphName]) return;
    
    const graphData = savedGraphs[graphName];
    setNodes(graphData.nodes);
    setEdges(graphData.edges);
    toast.success(`Graph "${graphName}" loaded successfully`);
  };

  const flowStyles = isEmbedded 
    ? { height: '100%', width: '100%' } 
    : { height: 'calc(100vh - 200px)', width: '100%' };

  const nodeOptions = nodes.map(node => ({
    id: node.id,
    label: node.data.label as string
  }));

  return (
    <div className="flex flex-col h-full">
      {showControls && (
        <div className="space-y-4 mb-4">
          {/* Node Creation */}
          <div className="flex items-center gap-2 p-2 bg-background rounded-md border">
            <Input
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              placeholder="Node name"
              className="px-3 py-2 border rounded-md flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAddNode()}
            />
            <Button onClick={handleAddNode} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Node
            </Button>
          </div>
          
          {/* Edge Creation */}
          <div className="p-2 bg-background rounded-md border">
            <div className="text-sm font-medium mb-2">Add Edge with Weight</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <Label htmlFor="source-node" className="text-xs">Source Node</Label>
                <Select value={selectedSource || ''} onValueChange={setSelectedSource}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodeOptions.map(node => (
                      <SelectItem key={`source-${node.id}`} value={node.id}>{node.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="target-node" className="text-xs">Target Node</Label>
                <Select value={selectedTarget || ''} onValueChange={setSelectedTarget}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodeOptions.map(node => (
                      <SelectItem key={`target-${node.id}`} value={node.id}>{node.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="edge-weight" className="text-xs mb-1">Weight</Label>
                <div className="flex items-center">
                  <Hash className="h-4 w-4 mr-1 text-muted-foreground" />
                  <Input
                    id="edge-weight"
                    type="number"
                    min="1"
                    value={edgeWeight}
                    onChange={(e) => setEdgeWeight(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <Button onClick={handleAddEdge} className="mb-0">Add Edge</Button>
            </div>
          </div>

          {/* Algorithm Selection and Path Finding */}
          <div className="p-2 bg-background rounded-md border">
            <div className="text-sm font-medium mb-2">Path Finding</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <Label className="text-xs">Start Node</Label>
                <Select value={startNode} onValueChange={setStartNode}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select start" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodeOptions.map(node => (
                      <SelectItem key={`start-${node.id}`} value={node.id}>{node.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs">End Node</Label>
                <Select value={endNode} onValueChange={setEndNode}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select end" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodeOptions.map(node => (
                      <SelectItem key={`end-${node.id}`} value={node.id}>{node.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <Label className="text-xs">Algorithm</Label>
                <Select value={algorithm} onValueChange={(value: Algorithm) => setAlgorithm(value)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dijkstra">Dijkstra</SelectItem>
                    <SelectItem value="astar">A*</SelectItem>
                    <SelectItem value="bellman-ford">Bellman-Ford</SelectItem>
                    <SelectItem value="floyd-warshall">Floyd-Warshall</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Compare With</Label>
                <Select value={compareAlgorithm || 'none'} onValueChange={(value) => setCompareAlgorithm(value === 'none' ? null : value as Algorithm)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="dijkstra">Dijkstra</SelectItem>
                    <SelectItem value="astar">A*</SelectItem>
                    <SelectItem value="bellman-ford">Bellman-Ford</SelectItem>
                    <SelectItem value="floyd-warshall">Floyd-Warshall</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleRunGraphSimulation} className="w-full">
              <Play className="h-4 w-4 mr-1" /> Run Algorithm
            </Button>
          </div>
          
          {/* Graph Management */}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleDeleteSelected} variant="destructive" size="sm">
              <Trash className="h-4 w-4 mr-1" /> Delete Selected
            </Button>
            
            <Button onClick={handleResetGraph} variant="destructive" size="sm">
              Reset Graph
            </Button>
          </div>

          {/* Save/Load/Export */}
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={handleSaveGraph} variant="outline" size="sm">
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
            
            <Button onClick={handleLoadGraph} variant="outline" size="sm">
              <FolderOpen className="h-4 w-4 mr-1" /> Load
            </Button>
            
            <Button onClick={handleExportGraph} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>

          {/* Import */}
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleImportGraph}
              style={{ display: 'none' }}
              id="import-graph"
            />
            <Button 
              onClick={() => document.getElementById('import-graph')?.click()}
              variant="outline" 
              size="sm"
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-1" /> Import Graph
            </Button>
          </div>
        </div>
      )}
      
      <div className={`flex-1 border rounded-md overflow-hidden ${!showControls ? 'h-full' : ''}`}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          style={flowStyles}
        >
          <Controls />
          <MiniMap />
          <Background />
          
          {!showControls && (
            <Panel position="top-left" className="bg-background/80 p-2 rounded-md border shadow-sm backdrop-blur-sm">
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={handleResetGraph}>
                  <Trash className="h-4 w-4 mr-1" /> Reset
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportGraph}>
                  <Download className="h-4 w-4 mr-1" /> Export
                </Button>
                <Button size="sm" variant="outline" onClick={handleRunGraphSimulation}>
                  <Play className="h-4 w-4 mr-1" /> Run
                </Button>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Results Display */}
      {(result || compareResult) && !showControls && (
        <div className="mt-4 p-4 bg-background rounded-md border">
          <h3 className="text-lg font-medium mb-2">Algorithm Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result && (
              <div>
                <h4 className="font-medium text-green-600">{result.algorithm.toUpperCase()}</h4>
                <p>Distance: {result.metrics.distance}m</p>
                <p>Time: {result.metrics.time}s</p>
                <p>Path: {result.path.join(' → ')}</p>
              </div>
            )}
            {compareResult && (
              <div>
                <h4 className="font-medium text-red-600">{compareResult.algorithm.toUpperCase()}</h4>
                <p>Distance: {compareResult.metrics.distance}m</p>
                <p>Time: {compareResult.metrics.time}s</p>
                <p>Path: {compareResult.path.join(' → ')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphBuilder;
