import { getAuthUser, getRawCookieHeader } from "@/lib/auth";

export const dynamic = "force-dynamic";

const BLOQUIM_BASE =
  process.env.BLOQUIM_API_URL ?? "https://bloquim.beeads.com.br/api";
const BLOQUIM_ORIGIN = BLOQUIM_BASE.replace(/\/api\/?$/, "");

export async function GET() {
  const user = await getAuthUser();
  if (!user) return new Response(null, { status: 401 });

  const cookie = await getRawCookieHeader();
  const upstream = await fetch(
    `${BLOQUIM_ORIGIN}/api/users/${user.userId}/avatar`,
    { headers: { Cookie: cookie }, cache: "no-store" },
  );

  if (!upstream.ok) {
    return new Response(null, { status: upstream.status });
  }

  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "private, max-age=300",
    },
  });
}
