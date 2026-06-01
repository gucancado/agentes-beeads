import { cookies } from "next/headers";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const BLOQUIM_BASE =
  process.env.BLOQUIM_API_URL ?? "https://bloquim.beeads.com.br/api";
const BLOQUIM_ORIGIN = BLOQUIM_BASE.replace(/\/api\/?$/, "");

export async function GET() {
  const user = await getAuthUser();
  if (!user) return new Response(null, { status: 401 });

  const store = await cookies();
  const session = store.get("__beeads_session")?.value ?? store.get("token")?.value;
  if (!session) return new Response(null, { status: 401 });

  const upstream = await fetch(
    `${BLOQUIM_ORIGIN}/api/users/${user.userId}/avatar`,
    { headers: { Cookie: `__beeads_session=${session}` }, cache: "no-store" },
  );
  if (!upstream.ok || !upstream.body) {
    return new Response(null, { status: upstream.status || 404 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return new Response(null, { status: 415 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
