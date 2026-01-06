import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PERTNetwork,
  NetworkNode,
  NetworkLink,
} from "@/types/PERTCalculations";

interface PERTChartProps {
  network: PERTNetwork;
  onNodeClick?: (nodeId: string) => void;
  onLinkClick?: (link: NetworkLink) => void;
  className?: string;
}

const PERTChart: React.FC<PERTChartProps> = ({
  network,
  onNodeClick,
  onLinkClick,
  className = "",
}) => {
  const { nodes, links } = network;

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg">
        <p className="text-muted-foreground">Aucune activité à afficher</p>
      </div>
    );
  }

  // Calculate view dimensions
  const maxX = Math.max(...nodes.map((n) => n.x));
  const maxY = Math.max(...nodes.map((n) => n.y));
  const viewBox = `0 0 ${maxX + 200} ${maxY + 200}`;

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardContent className="p-4">
          <div className="overflow-auto">
            <svg
              width="100%"
              height="500"
              viewBox={viewBox}
              className="border rounded-lg bg-background"
            >
              {/* Draw links/arrows first (so they appear behind nodes) */}
              {links.map((link, index) => {
                const sourceNode = nodes.find((n) => n.id === link.source);
                const targetNode = nodes.find((n) => n.id === link.target);

                if (!sourceNode || !targetNode) return null;

                return (
                  <g key={`link-${index}`}>
                    {/* Arrow line */}
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={link.isCritical ? "#ef4444" : "#94a3b8"}
                      strokeWidth={link.isCritical ? 3 : 1.5}
                      strokeDasharray={link.isCritical ? "none" : "5,5"}
                      markerEnd="url(#arrowhead)"
                      className="cursor-pointer hover:stroke-width-2"
                      onClick={() => onLinkClick?.(link)}
                    />

                    {/* Arrow marker definition */}
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 10 3.5, 0 7"
                          fill={link.isCritical ? "#ef4444" : "#94a3b8"}
                        />
                      </marker>
                    </defs>
                  </g>
                );
              })}

              {/* Draw nodes */}
              {nodes.map((node) => (
                <Tooltip key={node.id}>
                  <TooltipTrigger asChild>
                    <g
                      className="cursor-pointer transition-transform hover:scale-105"
                      onClick={() => onNodeClick?.(node.id)}
                    >
                      {/* Node circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.isCritical ? 30 : 25}
                        fill={node.isCritical ? "#fef2f2" : "#f8fafc"}
                        stroke={node.isCritical ? "#ef4444" : "#3b82f6"}
                        strokeWidth={node.isCritical ? 3 : 2}
                      />

                      {/* Node text */}
                      <text
                        x={node.x}
                        y={node.y - 5}
                        textAnchor="middle"
                        className="text-xs font-semibold fill-foreground"
                      >
                        {node.name.length > 15
                          ? `${node.name.substring(0, 15)}...`
                          : node.name}
                      </text>

                      {/* Duration text */}
                      <text
                        x={node.x}
                        y={node.y + 15}
                        textAnchor="middle"
                        className="text-xs fill-muted-foreground"
                      >
                        {node.pertEstimate.toFixed(1)}j
                      </text>

                      {/* Slack time indicator */}
                      {node.slackTime > 0 && (
                        <circle
                          cx={node.x + 20}
                          cy={node.y - 20}
                          r="8"
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                      )}
                    </g>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <h4 className="font-bold">{node.name}</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Durée PERT</p>
                          <p className="font-medium">
                            {node.pertEstimate.toFixed(1)} jours
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Marge</p>
                          <p className="font-medium">
                            {node.slackTime.toFixed(1)} jours
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Début au plus tôt
                          </p>
                          <p className="font-medium">J+{node.earliestStart}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Fin au plus tard
                          </p>
                          <p className="font-medium">J+{node.latestFinish}</p>
                        </div>
                      </div>
                      {node.isCritical && (
                        <div className="mt-2 pt-2 border-t">
                          <span className="text-xs font-semibold text-red-600">
                            ACTIVITÉ CRITIQUE
                          </span>
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-[#ef4444] bg-[#fef2f2]"></div>
              <span className="text-sm">Chemin critique</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-[#3b82f6] bg-[#f8fafc]"></div>
              <span className="text-sm">Activité normale</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
              <span className="text-sm">Marge disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-[#ef4444]"></div>
              <span className="text-sm">Lien critique</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-[#94a3b8] border-dashed border"></div>
              <span className="text-sm">Dépendance</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default PERTChart;
