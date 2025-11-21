import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-semibold">Page Not Found</h1>
          </div>

          <p className="text-sm text-muted-foreground">
            Looks like this page doesn’t exist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
