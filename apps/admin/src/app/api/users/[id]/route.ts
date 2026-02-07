import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getAdminSession, assertServiceAccess } from "@/lib/admin-session";

const updateUserSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください").optional(),
  password: z.string().min(8, "パスワードは8文字以上で入力してください").optional(),
  role: z.enum(["CUSTOMER", "ADMIN", "SUPER_ADMIN"]).optional(),
  serviceId: z.string().cuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

// 詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionResult = await getAdminSession();
    if (sessionResult instanceof NextResponse) return sessionResult;
    const session = sessionResult;

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        service: true,
        customers: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            customers: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    const accessDenied = assertServiceAccess(session, user.serviceId);
    if (accessDenied) return accessDenied;

    // パスワードを除外
    const { password, ...sanitizedUser } = user;

    return NextResponse.json(sanitizedUser);
  } catch (error) {
    console.error("ユーザー詳細取得エラー:", error);
    return NextResponse.json(
      { error: "ユーザーの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionResult = await getAdminSession();
    if (sessionResult instanceof NextResponse) return sessionResult;
    const session = sessionResult;

    const { id } = await params;
    const body = await request.json();
    const validated = updateUserSchema.parse(body);

    // 既存ユーザーの確認
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    const accessDenied = assertServiceAccess(session, existingUser.serviceId);
    if (accessDenied) return accessDenied;

    // ADMINはロール変更・サービス変更不可
    if (session.scopedServiceId) {
      if (validated.role && validated.role !== "CUSTOMER") {
        return NextResponse.json(
          { error: "ロールを変更する権限がありません" },
          { status: 403 }
        );
      }
      if (validated.serviceId !== undefined && validated.serviceId !== session.scopedServiceId) {
        return NextResponse.json(
          { error: "サービスを変更する権限がありません" },
          { status: 403 }
        );
      }
    }

    // メールアドレスの重複チェック（自分以外）
    if (validated.email && validated.email !== existingUser.email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: validated.email,
          id: { not: id },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "このメールアドレスは既に使用されています" },
          { status: 400 }
        );
      }
    }

    // パスワードが変更される場合はハッシュ化
    const updateData: Record<string, unknown> = { ...validated };
    if (validated.password) {
      updateData.password = await bcrypt.hash(validated.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        service: true,
      },
    });

    // パスワードを除外
    const { password, ...sanitizedUser } = user;

    return NextResponse.json(sanitizedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("ユーザー更新エラー:", error);
    return NextResponse.json(
      { error: "ユーザーの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// 削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionResult = await getAdminSession();
    if (sessionResult instanceof NextResponse) return sessionResult;
    const session = sessionResult;

    const { id } = await params;

    // 関連データがあるかチェック
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            customers: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    const accessDenied = assertServiceAccess(session, user.serviceId);
    if (accessDenied) return accessDenied;

    if (user._count.customers > 0) {
      // 論理削除
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "ユーザーを無効化しました" });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "ユーザーを削除しました" });
  } catch (error) {
    console.error("ユーザー削除エラー:", error);
    return NextResponse.json(
      { error: "ユーザーの削除に失敗しました" },
      { status: 500 }
    );
  }
}
