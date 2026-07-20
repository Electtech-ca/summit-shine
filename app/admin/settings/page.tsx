import { getBookingSettings } from "@/lib/booking-settings";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const [bookingSettings, businessNameRow] = await Promise.all([
    getBookingSettings(),
    prisma.siteSetting.findUnique({ where: { key: "businessName" } }),
  ]);
  const smsRow = await prisma.siteSetting.findUnique({ where: { key: "smsRemindersEnabled" } });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-primary">Settings</h1>
      <SettingsForm
        initial={{
          businessName: (businessNameRow?.value as string) ?? "Summit Shine Car Wash & Detail Co.",
          gstPct: bookingSettings.gstPct,
          pstPct: bookingSettings.pstPct,
          bookingLeadTimeMin: bookingSettings.bookingLeadTimeMin,
          maxAdvanceBookingDays: bookingSettings.maxAdvanceBookingDays,
          slotCapacity: bookingSettings.slotCapacity,
          bufferMinutes: bookingSettings.bufferMinutes,
          depositPct: bookingSettings.depositPct,
          cancellationWindowHours: bookingSettings.cancellationWindowHours,
          payAtLocationEnabled: bookingSettings.payAtLocationEnabled,
          smsRemindersEnabled: (smsRow?.value as boolean) ?? false,
        }}
      />
    </div>
  );
}
