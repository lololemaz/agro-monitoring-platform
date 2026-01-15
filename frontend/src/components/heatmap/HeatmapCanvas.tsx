import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { TreeData, HeatmapMetricType, getColorForValue, metricConfigs } from "@/data/heatmapData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HeatmapCanvasProps {
  trees: TreeData[];
  metric: HeatmapMetricType;
  showCriticalOnly: boolean;
  showOutliers: boolean;
  selectedPlotId?: string;
  onTreeClick?: (tree: TreeData) => void;
  className?: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  tree: TreeData | null;
}

export function HeatmapCanvas({
  trees,
  metric,
  showCriticalOnly,
  showOutliers,
  selectedPlotId,
  onTreeClick,
  className,
}: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, tree: null });

  // Filter trees based on settings
  const filteredTrees = useMemo(() => {
    let result = trees;
    
    if (selectedPlotId) {
      result = result.filter(t => t.plotId === selectedPlotId);
    }
    
    if (showCriticalOnly) {
      result = result.filter(t => t.isCritical);
    }
    
    if (showOutliers) {
      result = result.filter(t => t.isOutlier || t.isCritical);
    }
    
    return result;
  }, [trees, selectedPlotId, showCriticalOnly, showOutliers]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Draw the heatmap
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const { x: tx, y: ty, scale } = transform;

    // Clear canvas
    ctx.fillStyle = '#1a1f2e';
    ctx.fillRect(0, 0, width, height);

    // Draw grid pattern for reference
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 50 * scale;
    for (let x = (tx % gridSize); x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = (ty % gridSize); y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Calculate tree size based on scale
    const baseTreeSize = Math.max(3, Math.min(12, 5 * scale));
    
    // Draw plot boundaries
    const plotBounds = new Map<string, { minX: number; maxX: number; minY: number; maxY: number }>();
    for (const tree of trees) {
      const bounds = plotBounds.get(tree.plotId) || { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
      bounds.minX = Math.min(bounds.minX, tree.x);
      bounds.maxX = Math.max(bounds.maxX, tree.x);
      bounds.minY = Math.min(bounds.minY, tree.y);
      bounds.maxY = Math.max(bounds.maxY, tree.y);
      plotBounds.set(tree.plotId, bounds);
    }

    // Draw plot backgrounds
    ctx.globalAlpha = 0.15;
    for (const [plotId, bounds] of plotBounds) {
      const x = bounds.minX * width * scale + tx - 10;
      const y = bounds.minY * height * scale + ty - 10;
      const w = (bounds.maxX - bounds.minX) * width * scale + 20;
      const h = (bounds.maxY - bounds.minY) * height * scale + 20;
      
      ctx.fillStyle = selectedPlotId === plotId ? '#4ade80' : '#64748b';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw plot labels
    ctx.font = `${11 * Math.min(1.5, scale)}px "IBM Plex Sans", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (const [plotId, bounds] of plotBounds) {
      const x = bounds.minX * width * scale + tx;
      const y = bounds.minY * height * scale + ty - 4;
      if (scale > 0.5) {
        ctx.fillText(plotId, x, y);
      }
    }

    // Draw trees
    for (const tree of filteredTrees) {
      const x = tree.x * width * scale + tx;
      const y = tree.y * height * scale + ty;
      
      // Skip if outside viewport
      if (x < -baseTreeSize || x > width + baseTreeSize || y < -baseTreeSize || y > height + baseTreeSize) {
        continue;
      }

      const value = tree.metrics[metric];
      const color = getColorForValue(metric, value);
      
      // Draw tree dot
      ctx.beginPath();
      ctx.arc(x, y, baseTreeSize, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Add subtle border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Highlight critical/outlier trees
      if (tree.isCritical || tree.isOutlier) {
        ctx.beginPath();
        ctx.arc(x, y, baseTreeSize + 2, 0, Math.PI * 2);
        ctx.strokeStyle = tree.isCritical ? '#ef4444' : '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Draw stats overlay
    ctx.font = '11px "IBM Plex Sans", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`${filteredTrees.length.toLocaleString()} árvores • Zoom: ${(scale * 100).toFixed(0)}%`, 12, height - 12);
  }, [dimensions, transform, filteredTrees, trees, metric, selectedPlotId]);

  // Redraw on changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
      return;
    }

    // Check for tree hover
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { width, height } = dimensions;
    const { x: tx, y: ty, scale } = transform;
    const baseTreeSize = Math.max(3, Math.min(12, 5 * scale));

    // Find hovered tree
    let hoveredTree: TreeData | null = null;
    for (const tree of filteredTrees) {
      const x = tree.x * width * scale + tx;
      const y = tree.y * height * scale + ty;
      const dist = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
      if (dist <= baseTreeSize + 2) {
        hoveredTree = tree;
        break;
      }
    }

    if (hoveredTree) {
      setTooltip({
        visible: true,
        x: mouseX,
        y: mouseY,
        tree: hoveredTree,
      });
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(5, transform.scale * delta));

    // Zoom towards mouse position
    const scaleChange = newScale / transform.scale;
    setTransform(prev => ({
      scale: newScale,
      x: mouseX - (mouseX - prev.x) * scaleChange,
      y: mouseY - (mouseY - prev.y) * scaleChange,
    }));
  };

  const handleClick = (e: React.MouseEvent) => {
    if (tooltip.tree && onTreeClick) {
      onTreeClick(tooltip.tree);
    }
  };

  const config = metricConfigs[metric];

  return (
    <div 
      ref={containerRef} 
      className={cn("relative w-full h-full min-h-[400px] overflow-hidden rounded-lg bg-[#1a1f2e]", className)}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className={cn("cursor-grab", isDragging && "cursor-grabbing")}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onClick={handleClick}
      />

      {/* Tooltip */}
      {tooltip.visible && tooltip.tree && (
        <div
          className="absolute z-50 pointer-events-none bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3 min-w-[200px]"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y + 15,
            transform: tooltip.x > dimensions.width - 220 ? 'translateX(-230px)' : undefined,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: getColorForValue(metric, tooltip.tree.metrics[metric]) }}
            />
            <span className="font-semibold text-sm">{tooltip.tree.id}</span>
            {tooltip.tree.isCritical && (
              <span className="px-1.5 py-0.5 text-[9px] rounded bg-status-critical-bg text-status-critical">CRÍTICO</span>
            )}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Talhão:</span>
              <span className="font-medium">{tooltip.tree.plotName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Variedade:</span>
              <span className="font-medium">{tooltip.tree.variety}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 mt-1">
              <span className="text-muted-foreground">{config.label}:</span>
              <span className="font-bold text-primary">
                {tooltip.tree.metrics[metric].toFixed(1)}{config.unit}
              </span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Atualizado:</span>
              <span>{format(tooltip.tree.lastUpdate, "HH:mm", { locale: ptBR })}</span>
            </div>
          </div>
        </div>
      )}

      {/* Zoom controls hint */}
      <div className="absolute bottom-3 right-3 text-[10px] text-white/50 bg-black/30 px-2 py-1 rounded">
        Scroll para zoom • Arraste para mover
      </div>
    </div>
  );
}
