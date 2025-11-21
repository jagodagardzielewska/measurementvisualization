import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MeasurementChart } from "@/components/measurement-chart";
import { MeasurementTable } from "@/components/measurement-table";
import { MeasurementForm } from "@/components/measurement-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Measurement, Series, InsertMeasurement } from "@shared/schema";
import { Plus, Printer } from "lucide-react";

interface DashboardProps {
  isAdmin: boolean;
}

export default function Dashboard({ isAdmin }: DashboardProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [highlightedMeasurementId, setHighlightedMeasurementId] = useState<string | null>(null);
  const [selectedSeriesIds, setSelectedSeriesIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const { data: series = [], isLoading: isLoadingSeries } = useQuery<Series[]>({
    queryKey: ["/api/series"],
  });

  const { data: measurements = [], isLoading: isLoadingMeasurements } = useQuery<Measurement[]>({
    queryKey: ["/api/measurements"],
  });

  useEffect(() => {
    if (series.length > 0 && selectedSeriesIds.length === 0) {
      setSelectedSeriesIds(series.map((s) => s.id));
    }
  }, [series]);

  const addMeasurement = useMutation({
    mutationFn: (data: InsertMeasurement) =>
      apiRequest("POST", "/api/measurements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurements"] });
      toast({
        title: "Measurement added",
        description: "The new measurement has been saved.",
      });
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error adding measurement",
        description: error.message,
      });
    },
  });

  const deleteMeasurement = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/measurements/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurements"] });
      toast({
        title: "Measurement removed",
        description: "The measurement was deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error deleting measurement",
        description: error.message,
      });
    },
  });

  const toggleSeries = (seriesId: string) => {
    setSelectedSeriesIds((current) =>
      current.includes(seriesId)
        ? current.filter((id) => id !== seriesId)
        : [...current, seriesId]
    );
  };

  if (isLoadingSeries || isLoadingMeasurements) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Dashboard</h1>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="no-print">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>

          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Measurement
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md bg-white text-neutral-900 rounded-lg shadow-lg">
                <DialogHeader>
                  <DialogTitle>Add Measurement</DialogTitle>
                </DialogHeader>

                <MeasurementForm
                  onSubmit={(data) => addMeasurement.mutate(data)}
                  isPending={addMeasurement.isPending}
                  onCancel={() => setIsAddDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {series.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No data available.
              </p>

              {isAdmin && (
                <Link href="/series">
                  <Button>Create Series</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <MeasurementChart
            measurements={measurements}
            series={series}
            selectedSeries={selectedSeriesIds}
            onSeriesToggle={toggleSeries}
            highlightedMeasurementId={highlightedMeasurementId}
            startDate={startDate}
            endDate={endDate}
          />

          <MeasurementTable
            measurements={measurements}
            series={series}
            highlightedMeasurementId={highlightedMeasurementId}
            onHighlight={setHighlightedMeasurementId}
            onDelete={isAdmin ? (id) => deleteMeasurement.mutate(id) : undefined}
            isAdmin={isAdmin}
            startDate={startDate}
            endDate={endDate}
          />
        </>
      )}
    </div>
  );
}
