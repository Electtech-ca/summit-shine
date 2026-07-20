import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getBusinessName = cache(async (): Promise<string> => {
  const row = await prisma.siteSetting.findUnique({ where: { key: "businessName" } });
  return (row?.value as string) ?? "Summit Shine Car Wash & Detail Co.";
});
