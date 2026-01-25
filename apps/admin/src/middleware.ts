import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// 認証不要のパス
const publicPaths = ["/login", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  // JWTトークンを取得
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  const isLoggedIn = !!token;

  // 公開パスは認証不要
  if (isPublicPath) {
    // ログイン済みでログインページにアクセスした場合はリダイレクト
    if (isLoggedIn && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // 非公開パスで未ログインの場合はログインページにリダイレクト
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 管理者権限チェック（ADMINまたはSUPER_ADMIN）
  const userRole = token?.role as string | undefined;
  if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/login?error=AccessDenied", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
