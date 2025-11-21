import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings } from "lucide-react";

interface NavigationProps {
  user: { username: string; role: string } | null;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

export function Navigation({ user, onLogout, onNavigate }: NavigationProps) {
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white no-print">
      <div className="mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-semibold px-2 py-1 rounded-md">
              Measurement Visualization
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-2 text-sm">
                <Link
                  href="/"
                  className={`px-3 py-2 rounded-md ${
                    location === "/" ? "bg-accent" : ""
                  }`}
                >
                  Dashboard
                </Link>

                {user.role === "admin" && (
                  <Link
                    href="/series"
                    className={`px-3 py-2 rounded-md ${
                      location === "/series" ? "bg-accent" : ""
                    }`}
                  >
                    Series
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs rounded-md border">
                  <User className="h-3 w-3" />
                  <span>{user.username}</span>
                </div>

                {user.role === "admin" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onNavigate("/profile")}
                    className={location === "/profile" ? "bg-accent" : ""}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}

                <Button variant="ghost" size="icon" onClick={onLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => onNavigate("/login")}>
                  Login
                </Button>
                <Button onClick={() => onNavigate("/register")}>Register</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
