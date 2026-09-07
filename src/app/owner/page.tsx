import { redirect } from "next/navigation";
import { db } from "@/db";
import { restaurants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import OwnerDashboard from "./OwnerDashboard";

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "owner") {
    redirect(
      user.role === "driver"
        ? "/driver"
        : "/",
    );
  }

  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.ownerId, user.id))
    .limit(1);

  return (
    <OwnerDashboard
      restaurantName={restaurant?.name ?? "مطعمك"}
      slug={restaurant?.slug ?? ""}
      restaurantLat={restaurant?.lat ?? 24.7136}
      restaurantLng={restaurant?.lng ?? 46.6753}
    />
  );
}