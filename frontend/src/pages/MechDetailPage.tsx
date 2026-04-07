import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api, getImageUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { MechDetail, Comment, Reply } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ArrowBigUp, ArrowBigDown, MessageSquare, Trash2, Shield, Send, ChevronDown, ChevronUp, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import { formatDistanceToNow } from "date-fns";

export default function MechDetailPage() {
  const { mechId } = useParams<{ mechId: string }>();
  const [mech, setMech] = useState<MechDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!mechId) return;
    api.get<{ mech: MechDetail }>(`/mechs/${mechId}`)
      .then(d => setMech(d.mech))
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [mechId]);

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );

  if (!mech) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Mech not found</p>
      </div>
    </div>
  );

  const specs = [
    { label: "Classification", value: mech.classification },
    { label: "Height", value: mech.height ? `${mech.height}m` : null },
    { label: "Weight", value: mech.weight ? `${mech.weight}t` : null },
    { label: "Manufacturer", value: mech.manufacturer },
    { label: "Pilot", value: mech.pilot },
  ].filter(s => s.value);

  const techSpecs = [
    { label: "Power Source", value: mech.power_source },
    { label: "Armor Material", value: mech.armor_material },
    { label: "Max Speed", value: mech.max_speed },
  ].filter(s => s.value);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
          <Link to="/series" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={`/series/${mech.series_id}`} className="hover:text-foreground transition-colors">{mech.series_name}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{mech.mech_name}</span>
        </nav>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="relative rounded-lg overflow-hidden bg-secondary/30 aspect-[21/9] max-h-80">
            <img src={getImageUrl(mech.image_url)} alt={mech.mech_name} className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl font-display text-gradient">{mech.mech_name}</h1>
              {mech.model_number && <Badge variant="outline" className="font-mono text-sm">{mech.model_number}</Badge>}
            </div>
            <Link to={`/series/${mech.series_id}`} className="text-sm text-primary hover:underline">{mech.series_name}</Link>
          </div>
        </motion.div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Specs Column */}
          <div className="lg:col-span-3 space-y-6">
            {specs.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="font-display text-lg">Basic Information</CardTitle></CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-4">
                      {specs.map(s => (
                        <div key={s.label}>
                          <dt className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</dt>
                          <dd className="text-sm font-medium mt-0.5">{s.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {techSpecs.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="font-display text-lg">Technical Specifications</CardTitle></CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-4">
                      {techSpecs.map(s => (
                        <div key={s.label}>
                          <dt className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</dt>
                          <dd className="text-sm font-medium mt-0.5">{s.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {mech.armament && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="font-display text-lg">Armament</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {mech.armament.split(",").map((w, i) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          {w.trim()}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {mech.lore_description && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="font-display text-lg">Lore & History</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{mech.lore_description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {mech.design_features && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="font-display text-lg">Design Features</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{mech.design_features}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Comments Column */}
          <div className="lg:col-span-2">
            <CommentSection mechId={Number(mechId)} />
          </div>
        </div>
      </main>
    </div>
  );
}

function CommentSection({ mechId }: { mechId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const { isAuthenticated, isGuest, user, isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchComments = () => {
    api.get<{ comments: Comment[] }>(`/comments/mech/${mechId}?sort=${sort}`)
      .then(d => setComments(d.comments))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComments(); }, [mechId, sort]);

  const postComment = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const res = await api.post<{ comment: Comment }>(`/comments/mech/${mechId}`, { content: newComment });
      setComments(prev => [{ ...res.comment, reply_count: 0, userVote: null }, ...prev]);
      setNewComment("");
      toast({ title: "Comment posted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setPosting(false); }
  };

  return (
    <Card className="border-border/50 sticky top-20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg">Discussion</CardTitle>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="controversial">Controversial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
        {/* Comment Input */}
        {isAuthenticated ? (
          <div className="space-y-2">
            <Textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              maxLength={2000}
              className="bg-secondary/30"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{newComment.length}/2000</span>
              <Button size="sm" onClick={postComment} disabled={posting || !newComment.trim()}>
                <Send className="h-3 w-3 mr-1" /> {posting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 text-center">
            <Lock className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              <Link to="/auth" className="text-primary hover:underline">Login</Link> to join the discussion
            </p>
          </div>
        )}

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
        ) : (
          comments.map(c => (
            <CommentItem key={c.comment_id} comment={c} mechId={mechId} onDeleted={id => setComments(prev => prev.filter(x => x.comment_id !== id))} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CommentItem({ comment, mechId, onDeleted }: { comment: Comment; mechId: number; onDeleted: (id: number) => void }) {
  const [c, setC] = useState(comment);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const { isAuthenticated, user, isAdmin } = useAuth();
  const { toast } = useToast();

  const vote = async (type: "upvote" | "downvote") => {
    if (!isAuthenticated) return;
    try {
      await api.post(`/comments/${c.comment_id}/vote`, { voteType: type });
      setC(prev => {
        const wasUp = prev.userVote === "upvote";
        const wasDown = prev.userVote === "downvote";
        if (type === "upvote") {
          return {
            ...prev,
            upvotes: wasUp ? prev.upvotes - 1 : prev.upvotes + 1,
            downvotes: wasDown ? prev.downvotes - 1 : prev.downvotes,
            userVote: wasUp ? null : "upvote",
          };
        } else {
          return {
            ...prev,
            downvotes: wasDown ? prev.downvotes - 1 : prev.downvotes + 1,
            upvotes: wasUp ? prev.upvotes - 1 : prev.upvotes,
            userVote: wasDown ? null : "downvote",
          };
        }
      });
    } catch (e: any) {
      toast({ title: "Vote failed", description: e.message, variant: "destructive" });
    }
  };

  const loadReplies = async () => {
    if (showReplies) { setShowReplies(false); return; }
    try {
      const d = await api.get<{ replies: Reply[] }>(`/comments/${c.comment_id}/replies`);
      setReplies(d.replies);
      setShowReplies(true);
    } catch {}
  };

  const postReply = async () => {
    if (!replyText.trim()) return;
    try {
      const res = await api.post<{ reply: Reply }>(`/comments/${c.comment_id}/replies`, { content: replyText });
      setReplies(prev => [...prev, res.reply]);
      setReplyText("");
      setReplyOpen(false);
      setShowReplies(true);
      setC(prev => ({ ...prev, reply_count: prev.reply_count + 1 }));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      const body = isAdmin && user?.userId !== c.user_id ? { reason: deleteReason } : undefined;
      await api.delete(`/comments/${c.comment_id}`, body);
      onDeleted(c.comment_id);
      toast({ title: "Comment deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setDeleteOpen(false);
  };

  const deleteReply = async (replyId: number) => {
    try {
      await api.delete(`/comments/replies/${replyId}`);
      setReplies(prev => prev.filter(r => r.reply_id !== replyId));
      setC(prev => ({ ...prev, reply_count: prev.reply_count - 1 }));
      toast({ title: "Reply deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const canDelete = isAuthenticated && (user?.userId === c.user_id || isAdmin);
  const score = c.upvotes - c.downvotes;

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border/30 bg-secondary/10 p-3">
        <div className="flex items-start gap-3">
          {/* Vote */}
          <div className="flex flex-col items-center gap-0.5 pt-1">
            <button
              onClick={() => vote("upvote")}
              className={`transition-colors ${c.userVote === "upvote" ? "text-warning" : "text-muted-foreground hover:text-foreground"} ${c.userVote === "upvote" ? "animate-vote-bounce" : ""}`}
              disabled={!isAuthenticated}
            >
              <ArrowBigUp className="h-5 w-5" />
            </button>
            <span className={`text-xs font-medium ${score > 0 ? "text-warning" : score < 0 ? "text-info" : "text-muted-foreground"}`}>{score}</span>
            <button
              onClick={() => vote("downvote")}
              className={`transition-colors ${c.userVote === "downvote" ? "text-info" : "text-muted-foreground hover:text-foreground"} ${c.userVote === "downvote" ? "animate-vote-bounce" : ""}`}
              disabled={!isAuthenticated}
            >
              <ArrowBigDown className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Avatar className="h-5 w-5">
                <AvatarImage src={getImageUrl(c.profile_picture_url)} />
                <AvatarFallback className="text-[8px] bg-primary/20 text-primary">{c.nickname?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">{c.nickname}</span>
              {(c.is_admin_comment || c.user_type === "admin") && (
                <Badge className="h-4 px-1 text-[9px] bg-primary/20 text-primary border-primary/30">
                  <Shield className="h-2 w-2 mr-0.5" /> ADMIN
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
            </div>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{c.content}</p>
            <div className="flex items-center gap-3 mt-2">
              {isAuthenticated && (
                <button onClick={() => setReplyOpen(!replyOpen)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Reply
                </button>
              )}
              {c.reply_count > 0 && (
                <button onClick={loadReplies} className="text-xs text-primary hover:underline flex items-center gap-1">
                  {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {c.reply_count} {c.reply_count === 1 ? "reply" : "replies"}
                </button>
              )}
              {canDelete && (
                <button onClick={() => setDeleteOpen(true)} className="text-xs text-destructive/70 hover:text-destructive flex items-center gap-1">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reply Input */}
        {replyOpen && (
          <div className="ml-8 mt-3 flex gap-2">
            <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply..." className="text-xs bg-secondary/30" onKeyDown={e => e.key === "Enter" && !e.shiftKey && postReply()} />
            <Button size="sm" onClick={postReply} disabled={!replyText.trim()}>
              <Send className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="ml-6 space-y-2 border-l-2 border-border/30 pl-3">
          {replies.map(r => (
            <div key={r.reply_id} className="rounded-lg bg-secondary/5 p-2.5">
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={getImageUrl(r.profile_picture_url)} />
                  <AvatarFallback className="text-[7px] bg-primary/20 text-primary">{r.nickname?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-[11px] font-medium">{r.nickname}</span>
                {(r.is_admin_reply || r.user_type === "admin") && (
                  <Badge className="h-3.5 px-1 text-[8px] bg-primary/20 text-primary border-primary/30">
                    <Shield className="h-2 w-2 mr-0.5" /> ADMIN
                  </Badge>
                )}
                <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                {isAuthenticated && (user?.userId === r.user_id || isAdmin) && (
                  <button onClick={() => deleteReply(r.reply_id)} className="ml-auto text-destructive/50 hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              <p className="text-xs text-foreground/80 whitespace-pre-wrap">{r.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Comment</DialogTitle></DialogHeader>
          {isAdmin && user?.userId !== c.user_id && (
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input value={deleteReason} onChange={e => setDeleteReason(e.target.value)} placeholder="Why are you deleting this comment?" />
            </div>
          )}
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
