import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Search, LogOut, User, Settings, Menu, X } from "lucide-react";
import { getImageUrl } from "@/lib/api";
import { useState } from "react";

export default function Navbar() {
  const { user, isAuthenticated, isGuest, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
      setMobileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center gap-4">
        <Link to="/series" className="flex items-center gap-2 shrink-0">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-display text-xl font-bold text-gradient hidden sm:inline">MechaDex</span>
        </Link>

        {/* Desktop search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search mechs..."
              className="pl-9 bg-secondary/50 border-border/50"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile menu toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={getImageUrl(user.profilePicture || user.profile_picture_url)} />
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">{user.nickname?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm">{user.nickname}</span>
                  {isAdmin && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">ADMIN</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Settings className="mr-2 h-4 w-4" /> Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); navigate("/auth"); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" onClick={() => navigate("/auth")}>
              {isGuest ? "Sign In" : "Login"}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile search */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 p-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mechs..." className="pl-9 bg-secondary/50" />
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
