
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
import { toast } from '@/components/ui/sonner';
import { Download, Upload, Plus, Trash, Hash } from 'lucide-react';
import { MapType } from '../types';

// Initial empty state
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

interface GraphBuilderProps {
  onSaveGraph?: (nodes: Node[], edges: Edge[]) => void;
  mapType?: MapType;
  showControls?: boolean; // Only show controls in sidebar mode
  isEmbedded?: boolean; // Is this embedded in the main view
}

const GraphBuilder: React.FC<GraphBuilderProps> = ({ 
  onSaveGraph, 
  mapType = 'city', 
  showControls = false,
  isEmbedded = false
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeName, setNodeName] = useState('');
  
  // Edge input fields
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [edgeWeight, setEdgeWeight] = useState<string>('1');

  // Handle connecting two nodes with an edge
  const onConnect = useCallback(
    (connection: Connection) => {
      // Create an edge with a default weight of 1
      const newEdge = {
        ...connection,
        id: `e${connection.source}-${connection.target}`,
        label: '1', // Default weight
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
        x: Math.random() * 300,
        y: Math.random() * 300,
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
    
    // Check if edge already exists
    const edgeExists = edges.some(
      edge => edge.source === selectedSource && edge.target === selectedTarget
    );

    if (edgeExists) {
      // Update existing edge
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
      // Create new edge
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

  // Reset the graph
  const handleResetGraph = () => {
    if (nodes.length === 0 && edges.length === 0) return;
    
    setNodes([]);
    setEdges([]);
    setSelectedSource(null);
    setSelectedTarget(null);
    setEdgeWeight('1');
    toast.info('Graph has been reset');
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

  // Save the graph to the application state
  const handleSaveGraph = () => {
    if (nodes.length === 0) {
      toast.error('Graph is empty, nothing to save');
      return;
    }
    
    if (onSaveGraph) {
      onSaveGraph(nodes, edges);
      toast.success('Graph saved to application');
    }
  };

  const flowStyles = isEmbedded 
    ? { height: '100%', width: '100%' } 
    : { height: 'calc(100vh - 300px)', width: '100%' };

  // Get node options for select dropdown
  const nodeOptions = nodes.map(node => ({
    id: node.id,
    label: node.data.label as string
  }));

  return (
    <div className="flex flex-col h-full">
      {showControls && (
        <div className="space-y-4 mb-4">
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
          
          <div className="p-2 bg-background rounded-md border">
            <div className="text-sm font-medium mb-2">Add Edge with Weight</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <Label htmlFor="source-node" className="text-xs">Source Node</Label>
                <select
                  id="source-node"
                  className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedSource || ''}
                  onChange={(e) => setSelectedSource(e.target.value)}
                >
                  <option value="">Select source</option>
                  {nodeOptions.map(node => (
                    <option key={`source-${node.id}`} value={node.id}>{node.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="target-node" className="text-xs">Target Node</Label>
                <select
                  id="target-node"
                  className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedTarget || ''}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                >
                  <option value="">Select target</option>
                  {nodeOptions.map(node => (
                    <option key={`target-${node.id}`} value={node.id}>{node.label}</option>
                  ))}
                </select>
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
          
          <div className="flex justify-between">
            <Button onClick={handleResetGraph} variant="destructive" size="sm">
              <Trash className="h-4 w-4 mr-1" /> Reset Graph
            </Button>
            
            <div className="flex gap-2">
              <Button onClick={handleExportGraph} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
              <Button onClick={handleSaveGraph} size="sm">
                Save Graph
              </Button>
            </div>
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
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
};

export default GraphBuilder;
