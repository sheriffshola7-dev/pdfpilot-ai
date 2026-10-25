import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);

  if (!url || !publishableKey || !serviceRoleKey || adminEmails.length === 0) {
    return jsonError("Admin access is not configured yet. Set ADMIN_EMAILS and SUPABASE_SERVICE_ROLE_KEY in the hosting provider.", 503);
  }

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return jsonError("Please sign in first.", 401);

  const authClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user?.email) return jsonError("Your session is invalid. Please sign in again.", 401);
  if (!adminEmails.includes(authData.user.email.toLowerCase())) return jsonError("Administrator access required.", 403);

  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const [users, documents, insights, activity] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 100 }),
    admin.from("documents").select("id", { count: "exact", head: true }),
    admin.from("saved_insights").select("id", { count: "exact", head: true }),
    admin.from("activity_events").select("id", { count: "exact", head: true }),
  ]);

  if (users.error || documents.error || insights.error || activity.error) {
    return jsonError("Could not load admin metrics. Check the database schema and service-role permissions.", 500);
  }

  return NextResponse.json({
    metrics: {
      totalUsers: users.data.users.length,
      usersReturned: users.data.users.length,
      usersMayBeTruncated: users.data.users.length === 100,
      totalDocuments: documents.count || 0,
      totalSavedInsights: insights.count || 0,
      totalActivityEvents: activity.count || 0,
    },
    users: users.data.users.map((user) => ({
      id: user.id,
      email: user.email || "",
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      emailConfirmed: Boolean(user.email_confirmed_at),
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}
