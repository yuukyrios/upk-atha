import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, continueAsGuest, isAuthenticated } = useAuth();
  const { toast } = useToast();

  if (isAuthenticated) {
    navigate("/series", { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="relative z-10 text-center max-w-lg">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="h-12 w-12 text-primary" />
            <h1 className="text-5xl lg:text-6xl font-display text-gradient">MechaDex</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-4">The Ultimate Mecha Encyclopedia</p>
          <p className="text-sm text-muted-foreground/70">
            Browse mecha designs across series, explore specs and lore, and join the community discussion.
          </p>
        </div>
      </motion.div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex-1 flex items-center justify-center p-8"
      >
        <Card className="w-full max-w-md border-border/50 card-glow">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">Welcome, Pilot</CardTitle>
            <CardDescription>Sign in or create an account to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
                <TabsTrigger value="guest">Guest</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm onSuccess={() => navigate("/series")} login={login} toast={toast} />
              </TabsContent>
              <TabsContent value="register">
                <RegisterForm onSuccess={() => navigate("/series")} register={register} toast={toast} />
              </TabsContent>
              <TabsContent value="guest">
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Browse as a guest. You won't be able to comment, vote, or interact with the community.
                  </p>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => { continueAsGuest(); navigate("/series"); }}
                  >
                    Continue as Guest
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function LoginForm({ onSuccess, login, toast }: { onSuccess: () => void; login: (n: string, p: string) => Promise<void>; toast: any }) {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !password) return toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
    setLoading(true);
    try {
      await login(nickname, password);
      toast({ title: "Welcome back!" });
      onSuccess();
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="login-nick">Nickname</Label>
        <Input id="login-nick" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Enter your nickname" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-pw">Password</Label>
        <div className="relative">
          <Input id="login-pw" type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}

function RegisterForm({ onSuccess, register, toast }: { onSuccess: () => void; register: (n: string, p: string, e?: string) => Promise<void>; toast: any }) {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !password) return toast({ title: "Error", description: "Nickname and password are required", variant: "destructive" });
    if (password.length < 6) return toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
    if (password !== confirm) return toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
    setLoading(true);
    try {
      await register(nickname, password, email || undefined);
      toast({ title: "Account created!" });
      onSuccess();
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="reg-nick">Nickname *</Label>
        <Input id="reg-nick" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Choose a nickname" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-email">Email (optional)</Label>
        <Input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-pw">Password *</Label>
        <div className="relative">
          <Input id="reg-pw" type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-confirm">Confirm Password *</Label>
        <Input id="reg-confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
