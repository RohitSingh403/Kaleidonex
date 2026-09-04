import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { createClient } from "@supabase/supabase-js";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      {
        name: "api-health-endpoint",
        configureServer(server) {
          server.middlewares.use("/api/health", async (_req, res) => {
            const startTime = Date.now();
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            try {
              const url = process.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL'];
              const key = process.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || process.env['SUPABASE_PUBLISHABLE_KEY'];
              if (!url || !key) {
                res.statusCode = 500;
                res.end(
                  JSON.stringify(
                    {
                      status: "error",
                      timestamp: new Date().toISOString(),
                      latencyMs: Date.now() - startTime,
                      error: "Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY",
                    },
                    null,
                    2
                  )
                );
                return;
              }
              const supabase = createClient(url, key);
              const { count, error } = await supabase
                .from("app_settings")
                .select("*", { count: "exact", head: true });

              if (error) {
                res.statusCode = 200;
                res.end(
                  JSON.stringify(
                    {
                      status: "degraded",
                      timestamp: new Date().toISOString(),
                      latencyMs: Date.now() - startTime,
                      supabase: "query_error",
                      error: error.message,
                    },
                    null,
                    2
                  )
                );
                return;
              }

              res.statusCode = 200;
              res.end(
                JSON.stringify(
                  {
                    status: "ok",
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                    supabase: "active",
                    settingsCount: count ?? 0,
                    message: "Supabase ping successful — project is kept active.",
                  },
                  null,
                  2
                )
              );
            } catch (err: unknown) {
              res.statusCode = 500;
              res.end(
                JSON.stringify(
                  {
                    status: "error",
                    timestamp: new Date().toISOString(),
                    latencyMs: Date.now() - startTime,
                    error: err instanceof Error ? err.message : "Unknown error",
                  },
                  null,
                  2
                )
              );
            }
          });
        },
      },
    ],
  },
});
