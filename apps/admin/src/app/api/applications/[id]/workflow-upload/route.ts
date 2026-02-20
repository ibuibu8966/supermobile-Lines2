import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getAdminSession } from "@/lib/auth/admin-session";
import { getWorkflowImageUrls, uploadWorkflowImage } from "@/controllers/application.controller";

export const dynamic = "force-dynamic";

// ワークフロー画像のpublicURL取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return await getWorkflowImageUrls(id, prisma, getAdminSession);
  } catch (error) {
    console.error("GET /workflow-upload error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

// ワークフロー用画像アップロード
// imageType: "invoicePdf" | "invoiceEmail" | "payment" | "shipping"
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return await uploadWorkflowImage(id, request, prisma, getAdminSession);
  } catch (error) {
    console.error("POST /workflow-upload error:", error);
    return NextResponse.json({ error: "画像のアップロードに失敗しました" }, { status: 500 });
  }
}
