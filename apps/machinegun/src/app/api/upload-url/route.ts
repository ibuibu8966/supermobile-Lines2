import { NextRequest, NextResponse } from "next/server";
import { createSignedUploadUrl } from "@repo/database";

export const dynamic = "force-dynamic";

const ALLOWED_BUCKETS = ["kyc"];

export async function POST(request: NextRequest) {
  try {
    const { bucket, path } = await request.json();

    if (!bucket || !path) {
      return NextResponse.json(
        { error: "bucket と path は必須です" },
        { status: 400 }
      );
    }

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json(
        { error: "許可されていないバケットです" },
        { status: 400 }
      );
    }

    if (!path.startsWith("kyc/")) {
      return NextResponse.json(
        { error: "不正なパスです" },
        { status: 400 }
      );
    }

    const result = await createSignedUploadUrl(bucket, path);

    if (!result) {
      return NextResponse.json(
        { error: "アップロードURLの生成に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: result.signedUrl,
      path: result.path,
    });
  } catch (error) {
    console.error("Upload URL生成エラー:", error);
    return NextResponse.json(
      { error: "アップロードURLの生成に失敗しました" },
      { status: 500 }
    );
  }
}
