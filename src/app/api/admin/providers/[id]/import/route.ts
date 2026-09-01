import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { getAdapterForProvider } from "@/lib/providers/registry";

// Pulls the provider's full service list and upserts ProviderService rows.
// This does NOT auto-create internal `Service` records or link them —
// that mapping step is deliberately manual (via the admin services UI) so
// an admin controls pricing/markup and naming before a service goes live.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const provider = await prisma.provider.findUnique({ where: { id: params.id } });
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  const adapter = getAdapterForProvider(provider);

  let remoteServices;
  try {
    remoteServices = await adapter.listServices();
  } catch (err) {
    console.error("provider.import failed", err);
    return NextResponse.json({ error: "Could not fetch services from provider." }, { status: 502 });
  }

  // Stash the raw import in a Setting row keyed by provider id, so the
  // admin UI can show "unmapped provider services" to link to internal
  // Service records. We do not blindly create Services automatically,
  // since pricing/markup and Arabic naming need a human decision.
  await prisma.setting.upsert({
    where: { key: `provider_import:${provider.id}` },
    update: { value: remoteServices as any },
    create: { key: `provider_import:${provider.id}`, value: remoteServices as any },
  });

  await prisma.provider.update({
    where: { id: provider.id },
    data: { lastSyncedAt: new Date() },
  });

  return NextResponse.json({ importedCount: remoteServices.length, services: remoteServices });
}
