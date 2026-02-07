import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const createUserSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
  role: z.enum(["CUSTOMER", "ADMIN", "SUPER_ADMIN"]),
  serviceId: z.string().cuid().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

// 一覧取得
export async function GET(request: NextRequest) {
  try {
    const sessionResult = await getAdminSession();
    if (sessionResult instanceof NextResponse) return sessionResult;
    const session = sessionResult;

    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get("includeInactive") === "true";
    const role = searchParams.get("role");
    const serviceId = searchParams.get("serviceId");

    const where: Record<string, unknown> = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    // ADMINは自分のサービスのCUSTOMERのみ閲覧可能
    if (session.scopedServiceId) {
      where.serviceId = session.scopedServiceId;
      where.role = "CUSTOMER";
    } else {
      if (role) {
        where.role = role;
      }
      if (serviceId) {
        where.serviceId = serviceId;
      }
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        service: true,
        _count: {
          select: {
            customers: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { email: "asc" }],
    });

    // パスワードを除外
    const sanitizedUsers = users.map(({ password, ...rest }) => rest);

    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error("ユーザー一覧取得エラー:", error);
    return NextResponse.json(
      { error: "ユーザー一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 新規作成
export async function POST(request: NextRequest) {
  try {
    const sessionResult = await getAdminSession();
    if (sessionResult instanceof NextResponse) return sessionResult;
    const session = sessionResult;

    const body = await request.json();
    const validated = createUserSchema.parse(body);

    // ADMINはCUSTOMERのみ作成可能、serviceIdを強制
    if (session.scopedServiceId) {
      if (validated.role !== "CUSTOMER") {
        return NextResponse.json(
          { error: "管理者ユーザーを作成する権限がありません" },
          { status: 403 }
        );
      }
    }

    // メールアドレスの重複チェック
    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "このメールアドレスは既に使用されています" },
        { status: 400 }
      );
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        role: validated.role,
        serviceId: session.scopedServiceId || validated.serviceId || null,
        isActive: validated.isActive,
      },
      include: {
        service: true,
      },
    });

    // パスワードを除外
    const { password, ...sanitizedUser } = user;

    return NextResponse.json(sanitizedUser, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("ユーザー作成エラー:", error);
    return NextResponse.json(
      { error: "ユーザーの作成に失敗しました" },
      { status: 500 }
    );
  }
}
