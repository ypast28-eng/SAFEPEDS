import { NextResponse } from "next/server";
import {
  getBootstrapSecret,
  getDatabaseUrl,
  isBootstrapEnabled,
} from "@/lib/bootstrap/config";
import { getBootstrapStatus, runPedsafeBootstrap } from "@/lib/bootstrap/db";
import postgres from "postgres";
import { renderBootstrapPage } from "@/lib/bootstrap/html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function htmlResponse(page: Parameters<typeof renderBootstrapPage>[0], status = 200) {
  return new NextResponse(renderBootstrapPage(page), {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * One-time PEDSAFE schema bootstrap — visit once from your phone.
 *
 * GET /bootstrap/pedsafe?secret=YOUR_PEDSAFE_BOOTSTRAP_SECRET
 *
 * Requires server env:
 * - PEDSAFE_BOOTSTRAP_SECRET
 * - SUPABASE_DB_URL (Postgres URI from Supabase Dashboard)
 * - NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (existing app creds)
 *
 * After success, remove PEDSAFE_BOOTSTRAP_SECRET from Vercel to fully disable.
 */
export async function GET(request: Request) {
  if (!isBootstrapEnabled()) {
    return htmlResponse(
      {
        title: "Bootstrap disabled",
        status: "disabled",
        message:
          "PEDSAFE bootstrap is disabled. Set PEDSAFE_BOOTSTRAP_SECRET in your deployment env vars to enable it once.",
      },
      410
    );
  }

  const configuredSecret = getBootstrapSecret()!;
  const { searchParams } = new URL(request.url);
  const providedSecret = searchParams.get("secret")?.trim();

  if (!providedSecret || providedSecret !== configuredSecret) {
    return htmlResponse(
      {
        title: "Unauthorized",
        status: "error",
        message: "Missing or invalid secret. Use ?secret=YOUR_PEDSAFE_BOOTSTRAP_SECRET",
      },
      401
    );
  }

  if (!getDatabaseUrl()) {
    return htmlResponse(
      {
        title: "Configuration error",
        status: "error",
        message:
          "SUPABASE_DB_URL is not set. Add your Supabase Postgres connection string in Vercel → Settings → Environment Variables.",
        details: [
          "Supabase Dashboard → Project Settings → Database → Connection string → URI (Session pooler)",
        ],
      },
      500
    );
  }

  const databaseUrl = getDatabaseUrl()!;
  const sql = postgres(databaseUrl, { max: 1, prepare: false });

  try {
    const status = await getBootstrapStatus(sql);

    if (status.state === "completed") {
      return htmlResponse(
        {
          title: "Already applied",
          status: "disabled",
          message: `PEDSAFE schema was already applied on ${status.completedAt}. This route is disabled.`,
          details: [
            "Remove PEDSAFE_BOOTSTRAP_SECRET from Vercel env vars.",
            "Optionally remove SUPABASE_DB_URL after bootstrap.",
          ],
        },
        410
      );
    }

    if (status.state === "conflict") {
      return htmlResponse(
        {
          title: "Schema conflict",
          status: "error",
          message: status.message,
        },
        409
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not connect to the database.";
    return htmlResponse(
      {
        title: "Database connection failed",
        status: "error",
        message,
      },
      500
    );
  } finally {
    await sql.end({ timeout: 5 });
  }

  try {
    const result = await runPedsafeBootstrap();

    if (!result.ok) {
      const statusCode =
        result.code === "already_completed"
          ? 410
          : result.code === "conflict"
            ? 409
            : 423;

      return htmlResponse(
        {
          title:
            result.code === "already_completed" ? "Already applied" : "Bootstrap failed",
          status: result.code === "lock_busy" ? "info" : "error",
          message: result.message,
        },
        statusCode
      );
    }

    return htmlResponse({
      title: "PEDSAFE schema applied",
      status: "success",
      message: `Database bootstrap completed at ${result.completedAt}.`,
      details: [
        "Tables: profiles, compounds, cycles, cycle_compounds, bloodwork, lab_results, notes",
        "Remove PEDSAFE_BOOTSTRAP_SECRET from Vercel now to disable this route.",
        "Optionally remove SUPABASE_DB_URL after bootstrap.",
        "Grant admin after signup: update public.profiles set is_admin = true where email = 'you@example.com';",
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bootstrap failed.";
    return htmlResponse(
      {
        title: "Bootstrap failed",
        status: "error",
        message,
      },
      500
    );
  }
}
