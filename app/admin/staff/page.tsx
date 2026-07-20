import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StaffManager } from "@/components/admin/staff-manager";

export default async function AdminStaffPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/admin");

  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-primary">Staff</h1>
      <StaffManager staff={staff} currentUserId={session.user.id} />
    </div>
  );
}
