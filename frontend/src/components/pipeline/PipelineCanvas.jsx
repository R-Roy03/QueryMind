import { useState, useCallback, useMemo } from "react";
import { ReactFlow, Controls, Background, MarkerType, useNodesState, useEdgesState } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import PipelineNode from "./PipelineNode";

const nodeTypes = { pipeline: PipelineNode };

const EDGE_COLORS = ["#00A896", "#00D264", "#06B6D4", "#10B981", "#00A896"];

/**
 * Auto-layout: arranges nodes top-to-bottom in DAG order.
 * Each layer gets its own Y level, nodes spread horizontally within a layer.
 */
function autoLayout(rawNodes, rawEdges) {
  if (!rawNodes.length) return [];

  // Build adjacency: who are the parents of each node?
  const parents = {};
  const children = {};
  rawNodes.forEach(n => { parents[n.id] = []; children[n.id] = []; });
  rawEdges.forEach(e => {
    if (parents[e.target]) parents[e.target].push(e.source);
    if (children[e.source]) children[e.source].push(e.target);
  });

  // Assign layers via topological sort (BFS)
  const inDegree = {};
  rawNodes.forEach(n => { inDegree[n.id] = (parents[n.id] || []).length; });
  const queue = rawNodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
  const layers = {};
  const visited = new Set();

  // BFS
  let currentLayer = 0;
  let nextQueue = [...queue];
  while (nextQueue.length > 0) {
    const thisLayer = [...nextQueue];
    nextQueue = [];
    thisLayer.forEach(id => {
      if (visited.has(id)) return;
      visited.add(id);
      layers[id] = currentLayer;
      (children[id] || []).forEach(childId => {
        inDegree[childId]--;
        if (inDegree[childId] <= 0 && !visited.has(childId)) {
          nextQueue.push(childId);
        }
      });
    });
    currentLayer++;
  }

  // Assign positions not visited (cycles or disconnected)
  rawNodes.forEach(n => { if (layers[n.id] === undefined) layers[n.id] = currentLayer++; });

  // Group by layer
  const layerGroups = {};
  rawNodes.forEach(n => {
    const l = layers[n.id];
    if (!layerGroups[l]) layerGroups[l] = [];
    layerGroups[l].push(n);
  });

  // Position: Y = layer * spacing, X = spread within layer
  const NODE_WIDTH = 240;
  const X_GAP = 60;
  const Y_GAP = 140;

  const positioned = [];
  Object.keys(layerGroups).sort((a, b) => a - b).forEach(layer => {
    const group = layerGroups[layer];
    const totalWidth = group.length * NODE_WIDTH + (group.length - 1) * X_GAP;
    const startX = -totalWidth / 2 + NODE_WIDTH / 2;

    group.forEach((node, idx) => {
      positioned.push({
        ...node,
        position: { x: startX + idx * (NODE_WIDTH + X_GAP), y: parseInt(layer) * Y_GAP },
      });
    });
  });

  return positioned;
}

export default function PipelineCanvas({ pipelineData }) {
  if (!pipelineData) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 14 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔀</div>
          <div>Build a pipeline to see the visualization here</div>
        </div>
      </div>
    );
  }

  return <PipelineFlow pipelineData={pipelineData} />;
}

/**
 * Separate component so useNodesState/useEdgesState hooks work properly.
 */
function PipelineFlow({ pipelineData }) {
  const { initialNodes, initialEdges } = useMemo(() => {
    const rawNodes = (pipelineData.nodes || []).map((node) => ({
      id: node.id,
      type: "pipeline",
      position: { x: 0, y: 0 }, // will be overridden by autoLayout
      data: { label: node.label, type: node.type, operation: node.operation || node.table || node.destination || "" },
    }));

    const rawEdges = (pipelineData.edges || []).map((edge, i) => {
      const color = EDGE_COLORS[i % EDGE_COLORS.length];
      return {
        id: `edge-${i}`,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        animated: true,
        style: {
          stroke: color,
          strokeWidth: 2.5,
          strokeDasharray: "8 4",
          filter: `drop-shadow(0 0 4px ${color}60)`,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: color,
          width: 16,
          height: 16,
        },
      };
    });

    const layoutNodes = autoLayout(rawNodes, rawEdges);
    return { initialNodes: layoutNodes, initialEdges: rawEdges };
  }, [pipelineData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ height: "100%", border: "1px solid var(--border-default)" }}
    >
      <style>{`
        .react-flow__edge.animated path {
          stroke-dasharray: 8 4 !important;
          animation: marchingAnts 0.6s linear infinite !important;
        }
        @keyframes marchingAnts {
          to { stroke-dashoffset: -24; }
        }
        .react-flow__controls {
          background: var(--bg-card) !important;
          border: 1px solid var(--border-default) !important;
          border-radius: 8px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        }
        .react-flow__controls-button {
          background: transparent !important;
          border-bottom: 1px solid var(--border-subtle) !important;
          color: var(--text-muted) !important;
        }
        .react-flow__controls-button:hover {
          background: var(--bg-hover) !important;
        }
        .react-flow__controls-button svg {
          fill: var(--text-muted) !important;
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        minZoom={0.2}
        maxZoom={2}
        style={{ backgroundColor: "var(--bg-surface)" }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Controls />
        <Background color="rgba(0,168,150,0.06)" gap={24} size={1} />
      </ReactFlow>
    </div>
  );
}
