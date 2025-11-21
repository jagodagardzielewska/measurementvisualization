import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

import { insertSeriesSchema, type InsertSeries, type Series } from "@shared/schema";
import { Thermometer, Wind, Activity } from "lucide-react";

const ICONS = [
  { value: "Thermometer", label: "Temperature", icon: Thermometer },
  { value: "Wind", label: "Wind", icon: Wind },
];

const COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
  { value: "#a855f7", label: "Purple" },
  { value: "#ffde21", label: "Yellow" },
  { value: "#ef4444", label: "Red" },
  { value: "#ec4899", label: "Pink" },
];

interface Props {
  onSubmit: (data: InsertSeries) => void;
  initialData?: Series;
  isPending?: boolean;
  onCancel?: () => void;
}

export function SeriesForm({ onSubmit, initialData, isPending, onCancel }: Props) {
  const form = useForm<InsertSeries>({
    resolver: zodResolver(insertSeriesSchema),
    defaultValues: initialData ?? {
      name: "",
      minValue: 0,
      maxValue: 100,
      color: COLORS[0].value,
      icon: undefined,
    },
  });

  const selectedColor = form.watch("color");
  const selectedIcon = form.watch("icon");
  const IconPreview = ICONS.find((i) => i.value === selectedIcon)?.icon || Activity;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Series name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter series name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum value</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum value</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icon</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ICONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose color" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded border"
                            style={{ background: c.value }}
                          />
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center gap-4 p-4 rounded border">
          <div
            className="rounded-full p-3"
            style={{
              backgroundColor: `${selectedColor}20`,
              color: selectedColor,
            }}
          >
            <IconPreview className="h-6 w-6" />
          </div>

          <div>
            <p className="text-sm font-medium">Preview</p>
            <p className="text-xs text-muted-foreground">
              {form.watch("name") || "Series name"} • {form.watch("minValue")} –{" "}
              {form.watch("maxValue")}
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
              Cancel
            </Button>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : initialData ? "Update" : "Add series"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
