import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api, getImageUrl } from "@/lib/api";
import type { MechSummary } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const [results, setResults] = useState<MechSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) { setResults([]); setLoading(false); return; }
    setLoading(true);
    api.get<{ mechs: MechSummary[] }>(`/mechs/search?query=${encodeURIComponent(query)}&limit=50`)
      .then(d => setResults(d.mechs))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <h1 className="text-2xl font-display mb-1">Search Results</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {loading ? "Searching..." : `${results.length} results for "${query}"`}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <SearchIcon className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No mechs found for "{query}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((m, i) => (
              <motion.div key={m.mech_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/mech/${m.mech_id}`}>
                  <Card className="group card-hover border-border/50 overflow-hidden">
                    <div className="aspect-[3/2] bg-secondary/30 relative overflow-hidden">
                      <img src={getImageUrl(m.image_url)} alt={m.mech_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
                      {m.classification && <Badge className="absolute top-3 right-3 bg-accent/90 text-accent-foreground text-[10px]">{m.classification}</Badge>}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-display text-lg font-semibold truncate">{m.mech_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {m.model_number && <span className="font-mono text-xs">{m.model_number}</span>}
                        {m.series_name && <span>• {m.series_name}</span>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
