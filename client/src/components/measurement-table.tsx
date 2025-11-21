import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Trash2, ArrowUpDown } from "lucide-react";
import type { Measurement, Series } from "@shared/schema";

interface MeasurementTableProps {
  measurements: Measurement[];
  series: Series[];
  onHighlight: (id: string | null) => void;
  highlightedMeasurementId?: string | null;
  onDelete?: (id: string) => void;
  isAdmin: boolean;
  startDate?: Date;
  endDate?: Date;
}

type SortField = "timestamp" | "value" | "series";
type SortOrder = "asc" | "desc";

export function MeasurementTable({
  measurements,
  series,
  onHighlight,
  highlightedMeasurementId,
  onDelete,
  isAdmin,
  startDate,
  endDate,
}: MeasurementTableProps) {
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const data = useMemo(() => {
    let list = measurements;

    if (startDate) list = list.filter((m) => new Date(m.timestamp) >= startDate);
    if (endDate) list = list.filter((m) => new Date(m.timestamp) <= endDate);

    return [...list].sort((a, b) => {
      let c = 0;

      if (sortField === "timestamp") {
        c = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortField === "value") {
        c = a.value - b.value;
      } else {
        const an = series.find((s) => s.id === a.seriesId)?.name || "";
        const bn = series.find((s) => s.id === b.seriesId)?.name || "";
        c = an.localeCompare(bn);
      }

      return sortOrder === "asc" ? c : -c;
    });
  }, [measurements, series, sortField, sortOrder, startDate, endDate]);

  const toggleSort = (f: SortField) => {
    if (f === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(f);
      setSortOrder("asc");
    }
  };

  const icon = (f: SortField) => {
    const active = f === sortField;
    return (
      <ArrowUpDown
        className={`h-3 w-3 ml-1 opacity-60 ${active && sortOrder === "desc" ? "rotate-180" : ""}`}
      />
    );
  };

  const getSeries = (id: string) => series.find((s) => s.id === id);

  return (
    <>
      <Card className="print-keep-together">
        <CardHeader>
          <CardTitle>Measurement Table</CardTitle>
          <CardDescription>{data.length} measurements</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => toggleSort("series")} className="h-8 px-2 no-print">
                      Series {icon("series")}
                    </Button>
                    <span className="hidden print:inline">Series</span>
                  </TableHead>

                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => toggleSort("value")} className="h-8 px-2 no-print">
                      Value {icon("value")}
                    </Button>
                    <span className="hidden print:inline">Value</span>
                  </TableHead>

                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => toggleSort("timestamp")} className="h-8 px-2 no-print">
                      Timestamp {icon("timestamp")}
                    </Button>
                    <span className="hidden print:inline">Timestamp</span>
                  </TableHead>

                  {isAdmin && <TableHead className="no-print text-right">Delete</TableHead>}
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.map((m) => {
                  const s = getSeries(m.seriesId);
                  const color = s?.color || "#777";

                  return (
                    <TableRow
                      key={m.id}
                      onClick={() => onHighlight(m.id === highlightedMeasurementId ? null : m.id)}
                      className={`cursor-pointer transition ${
                        m.id === highlightedMeasurementId ? "bg-accent border-l-4 border-l-primary" : ""
                      }`}
                    >
                      <TableCell>
                        <Badge variant="outline" style={{ borderColor: color, color }}>
                          {s?.name || "-"}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-mono">{m.value.toFixed(2)}</TableCell>

                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {format(new Date(m.timestamp), "PPpp")}
                      </TableCell>

                      {isAdmin && (
                        <TableCell className="no-print text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(m.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {data.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">No data available</div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white text-neutral-900 rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Measurement</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId && onDelete) onDelete(deleteId);
                setDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
