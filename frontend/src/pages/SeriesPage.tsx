import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api, getImageUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Series } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Series | null>(null);

  useEffect(() => {
    api.get<{ series: Series[] }>("/series")
      .then(d => setSeries(d.series))
      .catch(e => toast({ title: "Error loading series", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = series.filter(s => s.series_name.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/series/${deleteTarget.series_id}`);
      setSeries(prev => prev.filter(s => s.series_id !== deleteTarget.series_id));
      toast({ title: "Series deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const handleSaved = (saved: Series, isNew: boolean) => {
    if (isNew) setSeries(prev => [...prev, saved]);
    else setSeries(prev => prev.map(s => s.series_id === saved.series_id ? saved : s));
    setFormOpen(false);
    setEditingSeries(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display text-gradient">Series</h1>
            <p className="text-muted-foreground text-sm">Browse mecha universes</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter series..." className="pl-9 bg-secondary/50" />
            </div>
            {isAdmin && (
              <Button onClick={() => { setEditingSeries(null); setFormOpen(true); }} size="sm" className="shrink-0">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No series found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((s, i) => (
              <motion.div
                key={s.series_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="group cursor-pointer card-hover border-border/50 overflow-hidden h-full"
                  onClick={() => navigate(`/series/${s.series_id}`)}
                >
                  <div className="aspect-[3/2] bg-secondary/30 relative overflow-hidden">
                    <img
                      src={getImageUrl(s.cover_image_url)}
                      alt={s.series_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
                    <Badge className="absolute top-3 right-3 bg-primary/90">{s.mech_count} mechs</Badge>
                    {isAdmin && (
                      <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="secondary" className="h-7 w-7" onClick={e => { e.stopPropagation(); setEditingSeries(s); setFormOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="destructive" className="h-7 w-7" onClick={e => { e.stopPropagation(); setDeleteTarget(s); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-lg font-semibold truncate">{s.series_name}</h3>
                      {s.release_year && <span className="text-xs text-muted-foreground shrink-0">{s.release_year}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{s.description || "No description"}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      <SeriesFormModal
        open={formOpen}
        series={editingSeries}
        onClose={() => { setFormOpen(false); setEditingSeries(null); }}
        onSaved={handleSaved}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Series</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.series_name}"? This will also delete all mechs in this series.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SeriesFormModal({ open, series, onClose, onSaved }: {
  open: boolean;
  series: Series | null;
  onClose: () => void;
  onSaved: (s: Series, isNew: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [year, setYear] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (series) {
      setName(series.series_name);
      setDesc(series.description || "");
      setYear(series.release_year?.toString() || "");
    } else {
      setName(""); setDesc(""); setYear("");
    }
    setImage(null);
  }, [series, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast({ title: "Series name is required", variant: "destructive" });
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("seriesName", name);
      if (desc) fd.append("description", desc);
      if (year) fd.append("releaseYear", year);
      if (image) fd.append("coverImage", image);

      if (series) {
        await api.upload(`/series/${series.series_id}`, fd, "PUT");
        const updated = await api.get<{ series: any; mechs: any[] }>(`/series/${series.series_id}`);
        onSaved({ ...updated.series, mech_count: series.mech_count } as Series, false);
        toast({ title: "Series updated" });
      } else {
        const res = await api.upload<{ seriesId: number }>("/series", fd);
        const fresh = await api.get<{ series: Series[] }>("/series");
        const created = fresh.series.find(s => s.series_id === res.seriesId);
        if (created) onSaved(created, true);
        toast({ title: "Series created" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{series ? "Edit Series" : "Add New Series"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Series Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mobile Suit Gundam" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="About this series..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Release Year</Label>
            <Input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="1979" />
          </div>
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <Input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : series ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
