import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { insertMeasurementSchema, type InsertMeasurement, type Series } from "@shared/schema";
import { AlertCircle } from "lucide-react";

interface MeasurementFormProps {
  onSubmit: (data: InsertMeasurement) => void;
  isPending?: boolean;
  onCancel?: () => void;
}

export function MeasurementForm({ onSubmit, isPending, onCancel }: MeasurementFormProps) {
  const { data: seriesData = [] } = useQuery<Series[]>({
    queryKey: ["/api/series"],
  });

  const form = useForm<InsertMeasurement>({
    resolver: zodResolver(insertMeasurementSchema),
    defaultValues: {
      seriesId: "",
      value: 0,
      timestamp: new Date().toISOString(),
    },
  });

  const seriesId = form.watch("seriesId");
  const value = form.watch("value");

  const selected = seriesData.find((s) => s.id === seriesId);
  const valid =
    selected &&
    value >= selected.minValue &&
    value <= selected.maxValue;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="seriesId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Series</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a series" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {seriesData.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selected && (
          <div className="p-4 bg-white border border-neutral-300 rounded-md space-y-1">
            <p className="text-sm font-medium">{selected.name}</p>
            <p className="text-xs text-neutral-500">
              Range: {selected.minValue} – {selected.maxValue}
            </p>
          </div>
        )}

        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="any"
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {selected && !valid && value !== 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Value outside of valid range ({selected.minValue} – {selected.maxValue})
            </AlertDescription>
          </Alert>
        )}

<FormField
  control={form.control}
  name="timestamp"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Timestamp</FormLabel>
      <FormControl>
        <Input
          type="datetime-local"
          value={field.value ? field.value.slice(0, 16) : ""}
          onChange={(e) => {
            const local = e.target.value;
            const iso = new Date(local).toISOString();
            field.onChange(iso);
          }}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>


        <div className="flex gap-2 pt-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending || !valid}>
            {isPending ? "Saving..." : "Add Measurement"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
