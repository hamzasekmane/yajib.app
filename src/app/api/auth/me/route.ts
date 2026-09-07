import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null });
  const { password: _pw, ...safe } = user;
  void _pw;
  return Response.json({ user: safe });
}
