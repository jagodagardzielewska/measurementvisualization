import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SeriesForm } from "@/components/series-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Series, InsertSeries } from "@shared/schema";
import { Plus, Activity, Thermometer, Droplets, Wind, Zap, TrendingUp } from "lucide-react";

const ICON_MAP: Record<string, any> = {
  Activity,
  Thermometer,
  Droplets,
  Wind,
  Zap,
  TrendingUp,
};

export default function SeriesManagement() {
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [deletingSeries, setDeletingSeries] = useState<Series | null>(null);

  const { data: series = [], isLoading } = useQuery<Series[]>({
    queryKey: ["/api/series"],
  });

  const createSeriesMutation = useMutation({
    mutationFn: (data: InsertSeries) => apiRequest("POST", "/api/series", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/series"] });
      toast({ title: "Series created", description: "New measurement series has been created." });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed to create series", description: error.message });
    },
  });

  const updateSeriesMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertSeries }) =>
      apiRequest("PUT", `/api/series/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/series"] });
      toast({ title: "Series updated", description: "Series has been updated successfully." });
      setEditingSeries(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed to update series", description: error.message });
    },
  });

  const deleteSeriesMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/series/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/series"] });
      queryClient.invalidateQueries({ queryKey: ["/api/measurements"] });
      toast({
        title: "Series deleted",
        description: "Series and all related measurements have been removed.",
      });
      setDeletingSeries(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed to delete series", description: error.message });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Manage Series</h1>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Series
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-neutral-900 rounded-lg shadow-lg p-6">
            <DialogHeader>
              <DialogTitle>Create New Series</DialogTitle>
            </DialogHeader>
            <SeriesForm
              onSubmit={(data) => createSeriesMutation.mutate(data)}
              isPending={createSeriesMutation.isPending}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {series.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No data available.</p>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Series
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {series.map((s) => {
            const Icon = ICON_MAP[s.icon] || Activity;

            return (
              <Card key={s.id} className="hover-elevate">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div
                      className="rounded-full p-3 flex-shrink-0"
                      style={{ backgroundColor: `${s.color}20`, color: s.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{s.name}</CardTitle>
                      <CardDescription className="mt-1 font-mono text-xs">
                        Range: {s.minValue} – {s.maxValue}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Min Value</p>
                      <div className="font-mono">{s.minValue}</div>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Max Value</p>
                      <div className="font-mono">{s.maxValue}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingSeries(s)}>
                      Edit
                    </Button>

                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setDeletingSeries(s)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={editingSeries !== null} onOpenChange={() => setEditingSeries(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-neutral-900 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>Edit Series</DialogTitle>
            <DialogDescription>Update the configuration for this series.</DialogDescription>
          </DialogHeader>

          {editingSeries && (
            <SeriesForm
              initialData={editingSeries}
              onSubmit={(data) =>
                updateSeriesMutation.mutate({ id: editingSeries.id, data })
              }
              isPending={updateSeriesMutation.isPending}
              onCancel={() => setEditingSeries(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingSeries !== null} onOpenChange={() => setDeletingSeries(null)}>
        <AlertDialogContent className="bg-white text-neutral-900 rounded-lg shadow-lg p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Series</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deletingSeries?.name}" and all its measurements? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={() => deletingSeries && deleteSeriesMutation.mutate(deletingSeries.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
