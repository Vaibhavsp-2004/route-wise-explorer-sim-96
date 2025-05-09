
import React, { useState, useCallback } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { Download, Upload, Plus, Trash } from 'lucide-react';

// Initial empty state
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Custom node types can be added here as the feature expands

interface GraphBuilderProps {
  onSaveGraph?: (nodes: Node[], edges: Edge[]) => void;
}

const GraphBuilder: React.FC<GraphBuilderProps> = ({ onSaveGraph }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeName, setNodeName] = useState('');

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

  // Reset the graph
  const handleResetGraph = () => {
    if (nodes.length === 0 && edges.length === 0) return;
    
    setNodes([]);
    setEdges([]);
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 p-2 bg-background rounded-md border">
        <input
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
        
        <Button onClick={handleResetGraph} variant="destructive" size="sm">
          <Trash className="h-4 w-4 mr-1" /> Reset
        </Button>
      </div>
      
      <div className="flex-1 border rounded-md overflow-hidden">
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
        </ReactFlow>
      </div>
      
      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={handleExportGraph} variant="outline">
          <Download className="h-4 w-4 mr-1" /> Export Graph
        </Button>
        <Button onClick={handleSaveGraph}>
          Save Graph
        </Button>
      </div>
    </div>
  );
};

export default GraphBuilder;
