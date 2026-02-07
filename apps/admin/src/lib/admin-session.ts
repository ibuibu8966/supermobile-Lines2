import { auth } from "@/auth";
import { NextResponse } from "next/server";

export interface AdminSession {
  userId: string;
  role: "ADMIN" | "SUPER_ADMIN";
  serviceId: string | null;
  isSuperAdmin: boolean;
  /** ADMIN → そのserviceId, SUPER_ADMIN → null（制限なし） */
  scopedServiceId: string | null;
}

export async function getAdminSession(): Promise<AdminSession | NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const { id, role, serviceId } = session.user;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "管理者権限が必要です" },
      { status: 403 }
    );
  }
  if (role === "ADMIN" && !serviceId) {
    return NextResponse.json(
      { error: "サービスが割り当てられていません" },
      { status: 403 }
    );
  }
  const isSuperAdmin = role === "SUPER_ADMIN";
  return {
    userId: id!,
    role: role as "ADMIN" | "SUPER_ADMIN",
    serviceId: serviceId ?? null,
    isSuperAdmin,
    scopedServiceId: isSuperAdmin ? null : serviceId!,
  };
}

export function assertServiceAccess(
  session: AdminSession,
  resourceServiceId: string | null
): NextResponse | null {
  if (session.isSuperAdmin) return null;
  if (session.serviceId === resourceServiceId) return null;
  return NextResponse.json(
    { error: "このリソースへのアクセス権限がありません" },
    { status: 403 }
  );
}
