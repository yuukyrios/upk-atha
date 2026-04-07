import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, getImageUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Camera, Shield, Calendar, MessageSquare, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function ProfilePage() {
  const { user, isAuthenticated, isAdmin, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [changePwOpen, setChangePwOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/auth"); return; }
    api.get<{ user: any }>("/auth/profile")
      .then(d => setProfile(d.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("profilePicture", file);
      const res = await api.upload<{ profilePicture: string }>("/auth/profile/picture", fd, "PUT");
      updateUser({ profilePicture: res.profilePicture, profile_picture_url: res.profilePicture });
      setProfile((p: any) => ({ ...p, profile_picture_url: res.profilePicture }));
      toast({ title: "Profile picture updated" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteAccount = async (password: string) => {
    try {
      await api.delete("/auth/account", { password });
      toast({ title: "Account deleted" });
      logout();
      navigate("/auth");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8"><Skeleton className="h-48 w-full" /></div>
    </div>
  );

  const avatarUrl = getImageUrl(profile?.profile_picture_url || user?.profilePicture || user?.profile_picture_url);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-3xl">
        {/* Profile Header */}
        <Card className="border-border/50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-2xl bg-primary/20 text-primary">{user?.nickname?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-5 w-5 text-foreground" />
                  <input type="file" className="hidden" accept="image/*" onChange={handlePictureChange} />
                </label>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-display">{user?.nickname}</h1>
                  {isAdmin && (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      <Shield className="h-3 w-3 mr-1" /> Admin
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  {profile?.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Joined {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  )}
                  {profile?.comment_count !== undefined && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {profile.comment_count} comments
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base font-display">Change Password</CardTitle></CardHeader>
              <CardContent>
                <Button variant="secondary" onClick={() => setChangePwOpen(true)}>Change Password</Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/30">
              <CardHeader><CardTitle className="text-base font-display text-destructive">Danger Zone</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Permanently delete your account and all associated data.</p>
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <AlertTriangle className="h-4 w-4 mr-1" /> Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <ChangePasswordModal open={changePwOpen} onClose={() => setChangePwOpen(false)} />
      <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDeleteAccount} />
    </div>
  );
}

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={current} onChange={e => setCurrent(e.target.value)} /></div>
          <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={async () => {
            try {
              await api.put("/auth/profile/password", { currentPassword: current, newPassword: newPw });
              toast({ title: "Password changed" });
              onClose();
            } catch (e: any) {
              toast({ title: "Error", description: e.message, variant: "destructive" });
            }
          }}>Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAccountModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: (pw: string) => void }) {
  const [password, setPassword] = useState("");
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>This action is permanent. Enter your password to confirm.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => onConfirm(password)} disabled={!password}>Delete My Account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
