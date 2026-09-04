import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Building2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { getSupabase, BACKEND_UNAVAILABLE } from "@/lib/supabase-optional";

const DENIED = "Access denied. This portal is restricted to Kaleidonex staff accounts.";
const STAFF_ROLES = ["admin", "ceo", "hr", "employee"];

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Login — Kaleidonex CRM Portal" },
      { name: "description", content: "Restricted sign in for Kaleidonex administrators." },
      { property: "og:title", content: "Login — Kaleidonex CRM Portal" },
      { property: "og:description", content: "Restricted sign in for Kaleidonex administrators." },
    ],
  }),
  beforeLoad: async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      const roles = (roleRows ?? []).map((r) => r.role as string);
      if (roles.some((r) => STAFF_ROLES.includes(r))) {
        throw redirect({ to: "/admin" });
      }
    }
  },
  component: AuthPage,
});

function requireClient() {
  const client = getSupabase();
  if (!client) throw new Error(BACKEND_UNAVAILABLE);
  return client;
}

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .then(({ data: roleRows }) => {
            const roles = (roleRows ?? []).map((r) => r.role as string);
            if (roles.some((r) => STAFF_ROLES.includes(r))) {
              navigate({ to: "/admin", replace: true });
            }
          });
      }
    });
  }, [navigate]);

  async function ensureStaffOrDeny() {
    const supabase = requireClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) throw new Error(DENIED);

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const roles = (roleRows ?? []).map((r) => r.role as string);
    if (!roles.some((r) => STAFF_ROLES.includes(r))) {
      await supabase.auth.signOut();
      throw new Error(DENIED);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const supabase = requireClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      await ensureStaffOrDeny();
      if (!remember) sessionStorage.setItem("kaleidonex.session-only", "1");
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function onForgotPassword() {
    setError(null);
    setNotice(null);
    if (!email) {
      setError("Enter your email address first, then select Forgot password.");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      setError(BACKEND_UNAVAILABLE);
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) setError(resetError.message);
    else setNotice("If that address has portal access, a reset link is on its way.");
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lift">
          <div className="px-6 py-10 sm:px-12">
            <div className="text-center">
              <Link to="/" className="font-display text-5xl font-extrabold tracking-tight">
                <span className="text-accent">K</span>
                <span className="text-primary">aleido</span>
                <span className="text-accent">n</span>
                <span className="text-primary">ex</span>
              </Link>
              <p className="mt-3 text-base text-muted-foreground">
                Sign in to access your dashboard
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-10 grid gap-6">
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-input bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-ring">
                  <Mail className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@school.com"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-input bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-ring">
                  <Lock className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                Remember me
              </label>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Signing in…" : "Sign in to CRM Portal"}
              </button>
            </form>
          </div>

          <div className="border-t border-border bg-accent/10 px-6 py-8 text-center sm:px-12">
            <p className="text-base">Need access to CRM portal?</p>
            <p className="mt-2 flex items-center justify-center gap-2 text-base font-medium">
              <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden />
              Contact your system administrator
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
