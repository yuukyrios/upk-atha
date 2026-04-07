import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api, getImageUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Series, MechSummary } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, ArrowLeft, ChevronRight, Bot } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function MechListPage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const [seriesInfo, setSeriesInfo] = useState<Series | null>(null);
  const [mechs, setMechs] = useState<MechSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingMech, setEditingMech] = useState<MechSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MechSummary | null>(null);

  useEffect(() => {
    if (!seriesId) return;
    api.get<{ series: any; mechs: MechSummary[] }>(`/series/${seriesId}`)
      .then(d => { setSeriesInfo(d.series); setMechs(d.mechs); })
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [seriesId]);

  const filtered = mechs.filter(m =>
    m.mech_name.toLowerCase().includes(search.toLowerCase()) ||
    m.model_number?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/mechs/${deleteTarget.mech_id}`);
      setMechs(prev => prev.filter(m => m.mech_id !== deleteTarget.mech_id));
      toast({ title: "Mech deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
          <Link to="/series" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{seriesInfo?.series_name || "Loading..."}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/series")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-display text-gradient">{seriesInfo?.series_name}</h1>
              {seriesInfo?.release_year && <span className="text-sm text-muted-foreground">{seriesInfo.release_year}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter mechs..." className="pl-9 bg-secondary/50" />
            </div>
            {isAdmin && (
              <Button onClick={() => { setEditingMech(null); setFormOpen(true); }} size="sm" className="shrink-0">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            )}
          </div>
        </div>

        {seriesInfo?.description && (
          <p className="text-muted-foreground text-sm mb-8 max-w-3xl">{seriesInfo.description}</p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Bot className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No mecha in this series yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((m, i) => (
              <motion.div key={m.mech_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="group cursor-pointer card-hover border-border/50 overflow-hidden h-full" onClick={() => navigate(`/mech/${m.mech_id}`)}>
                  <div className="aspect-[3/2] bg-secondary/30 relative overflow-hidden">
                    <img src={getImageUrl(m.image_url)} alt={m.mech_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
                    {m.classification && <Badge className="absolute top-3 right-3 bg-accent/90 text-accent-foreground text-[10px]">{m.classification}</Badge>}
                    {isAdmin && (
                      <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="secondary" className="h-7 w-7" onClick={e => { e.stopPropagation(); setEditingMech(m); setFormOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="destructive" className="h-7 w-7" onClick={e => { e.stopPropagation(); setDeleteTarget(m); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-display text-lg font-semibold truncate">{m.mech_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {m.model_number && <span className="font-mono text-xs">{m.model_number}</span>}
                      {m.height && <span>• {m.height}m</span>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <MechFormModal
        open={formOpen}
        mech={editingMech}
        seriesId={Number(seriesId)}
        onClose={() => { setFormOpen(false); setEditingMech(null); }}
        onSaved={(m, isNew) => {
          if (isNew) setMechs(prev => [...prev, m]);
          else setMechs(prev => prev.map(x => x.mech_id === m.mech_id ? m : x));
          setFormOpen(false); setEditingMech(null);
        }}
      />

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Mech</DialogTitle>
            <DialogDescription>Delete "{deleteTarget?.mech_name}"? This cannot be undone.</DialogDescription>
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

function MechFormModal({ open, mech, seriesId, onClose, onSaved }: {
  open: boolean; mech: MechSummary | null; seriesId: number; onClose: () => void;
  onSaved: (m: MechSummary, isNew: boolean) => void;
}) {
  const [form, setForm] = useState({
    mechName: "", modelNumber: "", classification: "", height: "", weight: "",
    loreDescription: "", armament: "", armorMaterial: "", powerSource: "",
    maxSpeed: "", manufacturer: "", pilot: "", designFeatures: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (mech) {
      setForm({
        mechName: mech.mech_name, modelNumber: mech.model_number || "",
        classification: mech.classification || "", height: mech.height?.toString() || "",
        weight: "", loreDescription: "", armament: "", armorMaterial: "",
        powerSource: "", maxSpeed: "", manufacturer: "", pilot: "", designFeatures: "",
      });
    } else {
      setForm({ mechName: "", modelNumber: "", classification: "", height: "", weight: "", loreDescription: "", armament: "", armorMaterial: "", powerSource: "", maxSpeed: "", manufacturer: "", pilot: "", designFeatures: "" });
    }
    setImage(null);
  }, [mech, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mechName.trim()) return toast({ title: "Mech name is required", variant: "destructive" });
    if (!form.loreDescription.trim() && !mech) return toast({ title: "Lore description is required", variant: "destructive" });
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("seriesId", seriesId.toString());
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (image) fd.append("mechImage", image);

      if (mech) {
        await api.upload(`/mechs/${mech.mech_id}`, fd, "PUT");
        onSaved({ ...mech, mech_name: form.mechName, model_number: form.modelNumber, classification: form.classification, height: parseFloat(form.height) || mech.height }, false);
        toast({ title: "Mech updated" });
      } else {
        const res = await api.upload<{ mechId: number }>("/mechs", fd);
        onSaved({ mech_id: res.mechId, mech_name: form.mechName, model_number: form.modelNumber, classification: form.classification, height: parseFloat(form.height) || 0, image_url: null }, true);
        toast({ title: "Mech created" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{mech ? "Edit Mech" : "Add New Mech"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.mechName} onChange={set("mechName")} placeholder="RX-78-2 Gundam" /></div>
            <div className="space-y-2"><Label>Model Number</Label><Input value={form.modelNumber} onChange={set("modelNumber")} placeholder="RX-78-2" /></div>
            <div className="space-y-2"><Label>Classification</Label><Input value={form.classification} onChange={set("classification")} placeholder="Mobile Suit" /></div>
            <div className="space-y-2"><Label>Height (m)</Label><Input type="number" step="0.01" value={form.height} onChange={set("height")} placeholder="18.0" /></div>
            <div className="space-y-2"><Label>Weight (tons)</Label><Input type="number" step="0.01" value={form.weight} onChange={set("weight")} placeholder="43.4" /></div>
            <div className="space-y-2"><Label>Manufacturer</Label><Input value={form.manufacturer} onChange={set("manufacturer")} /></div>
            <div className="space-y-2"><Label>Pilot</Label><Input value={form.pilot} onChange={set("pilot")} /></div>
            <div className="space-y-2"><Label>Power Source</Label><Input value={form.powerSource} onChange={set("powerSource")} /></div>
            <div className="space-y-2"><Label>Armor Material</Label><Input value={form.armorMaterial} onChange={set("armorMaterial")} /></div>
            <div className="space-y-2"><Label>Max Speed</Label><Input value={form.maxSpeed} onChange={set("maxSpeed")} /></div>
          </div>
          <div className="space-y-2"><Label>Armament</Label><Textarea value={form.armament} onChange={set("armament")} rows={2} placeholder="Beam Rifle, Beam Saber..." /></div>
          <div className="space-y-2"><Label>Lore Description {!mech && "*"}</Label><Textarea value={form.loreDescription} onChange={set("loreDescription")} rows={3} /></div>
          <div className="space-y-2"><Label>Design Features</Label><Textarea value={form.designFeatures} onChange={set("designFeatures")} rows={2} /></div>
          <div className="space-y-2"><Label>Image</Label><Input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} /></div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : mech ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
