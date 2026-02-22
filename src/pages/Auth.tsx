import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, BookOpen, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"student" | "instructor">("student");
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isEduEmail = (email: string) => email.trim().toLowerCase().endsWith(".edu");

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEduEmail(email)) {
      toast({ title: "Invalid email", description: "Only .edu email addresses are allowed.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "We sent a password reset link to your email." });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEduEmail(email)) {
      toast({ title: "Invalid email", description: "Only .edu email addresses are allowed.", variant: "destructive" });
      return;
    }
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, displayName, selectedRole);
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check your email", description: "We sent a verification link to confirm your account." });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      } else {
        navigate("/chat");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto mb-4">
            E
          </div>
          <h1 className="text-3xl font-bold text-foreground">Welcome to EVA</h1>
          <p className="text-muted-foreground mt-1">Anonymous AI-assisted classroom discussions</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          {isForgotPassword ? (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-1">Reset your password</h2>
              <p className="text-sm text-muted-foreground mb-4">Enter your .edu email and we'll send you a reset link.</p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Label htmlFor="resetEmail">Email</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="rounded-xl mt-1"
                    required
                  />
                </div>
                <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <Button type="button" variant="ghost" className="w-full rounded-xl" onClick={() => setIsForgotPassword(false)}>
                  Back to Sign In
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="flex gap-2 mb-6">
                <Button variant={!isSignUp ? "default" : "outline"} className="flex-1 rounded-xl" onClick={() => setIsSignUp(false)}>
                  Sign In
                </Button>
                <Button variant={isSignUp ? "default" : "outline"} className="flex-1 rounded-xl" onClick={() => setIsSignUp(true)}>
                  Sign Up
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="rounded-xl mt-1"
                      required
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="rounded-xl mt-1"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Only .edu emails are accepted</p>
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="rounded-xl mt-1 pr-10"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}

                {isSignUp && (
                  <div>
                    <Label className="mb-2 block">I am a...</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedRole("student")}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          selectedRole === "student"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <GraduationCap className="h-6 w-6" />
                        <span className="text-sm font-medium">Student</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole("instructor")}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          selectedRole === "instructor"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <BookOpen className="h-6 w-6" />
                        <span className="text-sm font-medium">Instructor</span>
                      </button>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                  {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
