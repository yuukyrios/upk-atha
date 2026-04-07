import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { AdminStats, User, Series, DeletedComment } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, BookOpen, Bot, MessageSquare, Shield, Search, ArrowLeft, Ban } from "lucide-react";
import Navbar from "@/components/Navbar";

type Tab = "dashboard" | "users" | "moderation";

export default function AdminDashboard() {
  const { isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) navigate("/series", { replace: true });
  }, [isAuthenticated, isAdmin]);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/series")}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-3xl font-display text-gradient">Admin Dashboard</h1>
        </div>

        <div className="flex gap-2 mb-8">
          {(["dashboard", "users", "moderation"] as Tab[]).map(t => (
            <Button key={t} variant={tab === t ? "default" : "secondary"} size="sm" onClick={() => setTab(t)} className="capitalize">
              {t}
            </Button>
          ))}
        </div>

        {tab === "dashboard" && <DashboardTab />}
        {tab === "users" && <UsersTab />}
        {tab === "moderation" && <ModerationTab />}
      </main>
    </div>
  );
}

function DashboardTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AdminStats>("/admin/stats")
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  if (!stats) return <p className="text-muted-foreground">Failed to load stats</p>;

  const cards = [
    { label: "Users", value: stats.users.total_users, delta: `+${stats.users.new_users_today} today`, icon: Users, color: "text-primary" },
    { label: "Series", value: stats.content.total_series, icon: BookOpen, color: "text-success" },
    { label: "Mechs", value: stats.content.total_mechs, delta: `+${stats.activity.mechs_added_today} today`, icon: Bot, color: "text-warning" },
    { label: "Comments", value: stats.content.total_comments, delta: `+${stats.activity.comments_today} today`, icon: MessageSquare, color: "text-info" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(c => (
        <Card key={c.label} className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <p className="text-3xl font-display font-bold">{c.value}</p>
            {c.delta && <p className="text-xs text-muted-foreground mt-1">{c.delta}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    api.get<{ users: User[] }>(`/admin/users?limit=100&search=${search}`)
      .then(d => setUsers(d.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  const toggleRole = async (u: User) => {
    const id = u.user_id || u.userId;
    const newType = (u.user_type || u.userType) === "admin" ? "normal" : "admin";
    try {
      await api.put(`/admin/users/${id}/type`, { userType: newType });
      setUsers(prev => prev.map(x => (x.user_id || x.userId) === id ? { ...x, user_type: newType, userType: newType } : x));
      toast({ title: `User role updated to ${newType}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const toggleBan = async (u: User) => {
    const id = u.user_id || u.userId;
    try {
      const res = await api.put<{ isActive: boolean }>(`/admin/users/${id}/status`, {});
      setUsers(prev => prev.map(x => (x.user_id || x.userId) === id ? { ...x, is_active: res.isActive } : x));
      toast({ title: res.isActive ? "User unbanned" : "User banned" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-9 bg-secondary/50" />
      </div>

      {loading ? <Skeleton className="h-48" /> : (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nickname</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.user_id || u.userId}>
                  <TableCell className="font-medium">{u.nickname}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={(u.user_type || u.userType) === "admin" ? "default" : "secondary"}>
                      {(u.user_type || u.userType) === "admin" && <Shield className="h-3 w-3 mr-1" />}
                      {u.user_type || u.userType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.is_active !== false ? "outline" : "destructive"}>
                      {u.is_active !== false ? "Active" : "Banned"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => toggleRole(u)} className="text-xs h-7">
                        {(u.user_type || u.userType) === "admin" ? "Demote" : "Promote"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleBan(u)} className="text-xs h-7 text-destructive">
                        <Ban className="h-3 w-3 mr-1" />
                        {u.is_active !== false ? "Ban" : "Unban"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function ModerationTab() {
  const [deleted, setDeleted] = useState<DeletedComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ deletedComments: DeletedComment[] }>("/admin/moderation")
      .then(d => setDeleted(d.deletedComments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-48" />;

  return (
    <Card className="border-border/50">
      <CardHeader><CardTitle className="font-display">Moderation Queue</CardTitle></CardHeader>
      <CardContent>
        {deleted.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No deleted comments</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Deleted By</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deleted.map(d => (
                <TableRow key={d.comment_id}>
                  <TableCell className="max-w-xs truncate text-sm">{d.content}</TableCell>
                  <TableCell>{d.author}</TableCell>
                  <TableCell>{d.deleted_by_name}</TableCell>
                  <TableCell className="text-muted-foreground">{d.deleted_reason || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(d.deleted_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
