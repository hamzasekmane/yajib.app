import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DriverDashboard from "./DriverDashboard";

export const dynamic = "force-dynamic";

export default async function DriverPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "driver") {
    redirect(
      user.role === "owner"
        ? "/owner"
        : "/",
    );
  }

  return <DriverDashboard name={user.name} />;
}