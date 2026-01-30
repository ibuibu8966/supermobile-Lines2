import { mutate } from "swr";

// デフォルトフィルターでの初期ページURLを定義
const PREFETCH_ENDPOINTS = [
  // 常にアクセスするデータ
  "/api/dashboard/stats",
  "/api/services",
  "/api/services?includeInactive=true",
  "/api/plans",
  "/api/plans?includeInactive=true",
  "/api/usage-tags",
  "/api/sim-location-tags",
  "/api/line-reserve-tags",
  "/api/users?includeInactive=false",

  // ページネーション対象（1ページ目のみ）
  "/api/lines?page=1",
  "/api/applications?page=1",
  "/api/sims?page=1",
];

export async function prefetchAdminData(): Promise<void> {
  const results = await Promise.allSettled(
    PREFETCH_ENDPOINTS.map(async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch ${url}`);
      const data = await res.json();
      return { url, data };
    })
  );

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      // SWRキャッシュに格納（revalidate: false で即座反映）
      mutate(result.value.url, result.value.data, false);
    }
  });
}
