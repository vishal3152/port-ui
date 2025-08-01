import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { useEffect, useRef } from "react";

interface PortfolioChartProps {
  data?: any[];
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export function PortfolioChart({ data, timeRange, onTimeRangeChange }: PortfolioChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // In a real implementation, this would use Chart.js or similar
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, chartRef.current.width, chartRef.current.height);

    // Draw a simple mock chart
    const width = chartRef.current.width;
    const height = chartRef.current.height;
    const padding = 40;

    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    // Draw mock performance line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const points = [
      { x: padding, y: height - 100 },
      { x: width * 0.2, y: height - 120 },
      { x: width * 0.4, y: height - 80 },
      { x: width * 0.6, y: height - 140 },
      { x: width * 0.8, y: height - 160 },
      { x: width - padding, y: height - 180 },
    ];

    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.lineTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();

  }, [data, timeRange]);

  const timeRanges = [
    { label: "1Y", value: "1Y" },
    { label: "3Y", value: "3Y" },
    { label: "5Y", value: "5Y" },
    { label: "All", value: "All" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Portfolio Performance</CardTitle>
          <div className="flex space-x-2">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? "default" : "outline"}
                size="sm"
                onClick={() => onTimeRangeChange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center relative">
          <canvas
            ref={chartRef}
            width={600}
            height={320}
            className="absolute inset-0 w-full h-full"
          />
          <div className="text-center z-10 pointer-events-none">
            <TrendingUp className="text-primary text-4xl mb-4 mx-auto" />
            <p className="text-muted-foreground">Interactive Performance Chart</p>
            <p className="text-sm text-muted-foreground">
              Shows portfolio value over time with benchmark comparison
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
