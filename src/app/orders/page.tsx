import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import CustomerOrdersDashboard from "./CustomerOrdersDashboard";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "customer") {
    redirect(
      user.role === "owner"
        ? "/owner"
        : "/driver",
    );
  }

  const t = await getTranslations("ordersPage");

  return (
    <CustomerOrdersDashboard
      name={user.name}
      title={t("title")}
      subtitle={t("subtitle")}
    />
  );
}