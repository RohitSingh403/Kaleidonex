import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Building2, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import { getSupabase, BACKEND_UNAVAILABLE } from "@/lib/supabase-optional";
const supabase = new Proxy({} as NonNullable<ReturnType<typeof getSupabase>>, {
  get(_t, prop) {
    const client = getSupabase();
    if (!client) throw new Error(BACKEND_UNAVAILABLE);
    return Reflect.get(client, prop, client);
  },
});

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — Kaleidonex CRM Portal" },
      { name: "description", content: "Set a new password for your Kaleidonex CRM portal account." },
      { property: "og:title", content: "Reset password — Kaleidonex CRM Portal" },
      {
        property: "og:description",
        content: "Set a new password for your Kaleidonex CRM portal account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function Wordmark() {
  return (
    <Link to="/" className="font-display text-5xl font-extrabold tracking-tight">
      <span className="text-accent">K</span>
      <span className="text-primary">aleido</span>
      <span className="text-accent">n</span>
      <span className="text-primary">ex</span>
    </Link>
  );
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid" | "done">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) setStatus("ready");
    });

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setStatus((prev) => (prev === "ready" ? prev : data.session ? "ready" : "invalid"));
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Both passwords must match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lift">
          <div className="px-6 py-10 sm:px-12">
            <div className="text-center">
              <Wordmark />
              <p className="mt-3 text-base text-muted-foreground">
                {status === "done"
                  ? "Your password has been updated"
                  : "Set a new password for your dashboard"}
              </p>
            </div>

            {status === "checking" ? (
              <p className="mt-10 text-center text-sm text-muted-foreground">
                Checking your reset link…
              </p>
            ) : null}

            {status === "invalid" ? (
              <div className="mt-10 text-center">
                <p className="text-sm text-destructive">
                  This reset link is invalid or has expired.
                </p>
                <Link
                  to="/auth"
                  className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
                >
                  Request a new link
                </Link>
              </div>
            ) : null}

            {status === "done" ? (
              <div className="mt-10 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-primary" aria-hidden />
                <p className="mt-4 text-sm text-muted-foreground">
                  You can now sign in to the CRM portal with your new password.
                </p>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/auth", replace: true })}
                  className="mt-6 w-full rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
                >
                  Back to sign in
                </button>
              </div>
            ) : null}

            {status === "ready" ? (
              <form onSubmit={onSubmit} className="mt-10 grid gap-6">
                <div className="grid gap-2">
                  <label htmlFor="new-password" className="text-sm font-medium">
                    New Password
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-input bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-ring">
                    <Lock className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Enter your new password"
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

                <div className="grid gap-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-input bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-ring">
                    <Lock className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    <input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Re-enter your new password"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            ) : null}
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
