import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Measurement, Series } from "@shared/schema";
import { Activity } from "lucide-react";

interface MeasurementChartProps {
  measurements: Measurement[];
  series: Series[];
  selectedSeries: string[];
  onSeriesToggle: (seriesId: string) => void;
  highlightedMeasurementId?: string | null;
  startDate?: Date;
  endDate?: Date;
}

export function MeasurementChart({
  measurements,
  series,
  selectedSeries,
  onSeriesToggle,
  highlightedMeasurementId,
  startDate,
  endDate,
}: MeasurementChartProps) {
  const chartData = useMemo(() => {
    let filtered = measurements;

    if (startDate) {
      filtered = filtered.filter((m) => new Date(m.timestamp) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((m) => new Date(m.timestamp) <= endDate);
    }

    const grouped = filtered.reduce(
      (acc, measurement) => {
        const timestamp = new Date(measurement.timestamp).getTime();
        if (!acc[timestamp]) {
          acc[timestamp] = { timestamp };
        }
        acc[timestamp][measurement.seriesId] = measurement.value;
        acc[timestamp][`${measurement.seriesId}_id`] = measurement.id;
        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.values(grouped).sort((a, b) => a.timestamp - b.timestamp);
  }, [measurements, startDate, endDate]);

  const highlightedPoint = useMemo(() => {
    if (!highlightedMeasurementId) return null;
    const measurement = measurements.find((m) => m.id === highlightedMeasurementId);
    if (!measurement) return null;
    return {
      timestamp: new Date(measurement.timestamp).getTime(),
      value: measurement.value,
      seriesId: measurement.seriesId,
    };
  }, [highlightedMeasurementId, measurements]);

  const formatXAxis = (timestamp: number) => {
    return format(new Date(timestamp), "HH:mm:ss");
  };

  const formatTooltip = (value: any, name: string) => {
    const seriesData = series.find((s) => s.id === name);
    return [value.toFixed(2), seriesData?.name || name];
  };

  const formatTooltipLabel = (timestamp: number) => {
    return format(new Date(timestamp), "PPpp");
  };

  return (
    <Card className="print-keep-together">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle>Measurement Chart</CardTitle>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-4 no-print">
          <Label className="text-sm font-medium">Select Series:</Label>
          {series.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <Checkbox
                id={`series-${s.id}`}
                checked={selectedSeries.includes(s.id)}
                onCheckedChange={() => onSeriesToggle(s.id)}
              />
              <Label
                htmlFor={`series-${s.id}`}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-sm">{s.name}</span>
              </Label>
            </div>
          ))}
        </div>

        <div className="w-full" style={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                className="text-xs"
                stroke="currentColor"
              />
              <YAxis className="text-xs" stroke="currentColor" />
              <Tooltip
                formatter={formatTooltip}
                labelFormatter={formatTooltipLabel}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              {series
                .filter((s) => selectedSeries.includes(s.id))
                .map((s) => (
                  <Line
                    key={s.id}
                    type="monotone"
                    dataKey={s.id}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name={s.name}
                    connectNulls
                  />
                ))}
              {highlightedPoint && selectedSeries.includes(highlightedPoint.seriesId) && (
                <ReferenceDot
                  x={highlightedPoint.timestamp}
                  y={highlightedPoint.value}
                  r={8}
                  fill="red"
                  stroke="white"
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {chartData.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
