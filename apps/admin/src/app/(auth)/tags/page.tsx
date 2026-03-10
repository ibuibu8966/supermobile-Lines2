import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES } from "@/lib/api/query-keys";
import { prisma } from "@/lib/database";
import { TagsClient } from "./tags-client";

export default async function TagsPage() {
  const queryClient = new QueryClient();

  try {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.usageTags,
        queryFn: async () => {
          const data = await prisma.usageTag.findMany({
            include: { _count: { select: { contractTags: true, planTags: true } } },
            orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
          });
          return JSON.parse(JSON.stringify(data));
        },
        staleTime: STALE_TIMES.MASTER,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.simLocationTags,
        queryFn: async () => {
          const data = await prisma.simLocationTag.findMany({
            include: { _count: { select: { sims: true } } },
            orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
          });
          return JSON.parse(JSON.stringify(data));
        },
        staleTime: STALE_TIMES.MASTER,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.lineTags,
        queryFn: async () => {
          const data = await prisma.lineTag.findMany({
            include: { _count: { select: { applicationLines: true } } },
            orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
          });
          return JSON.parse(JSON.stringify(data));
        },
        staleTime: STALE_TIMES.MASTER,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.lineReserveTags,
        queryFn: async () => {
          const data = await prisma.lineReserveTag.findMany({
            include: { _count: { select: { applicationLines: true } } },
            orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
          });
          return JSON.parse(JSON.stringify(data));
        },
        staleTime: STALE_TIMES.MASTER,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.referrerTags,
        queryFn: async () => {
          const data = await prisma.referrerTag.findMany({
            include: { _count: { select: { customers: true } } },
            orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
          });
          return JSON.parse(JSON.stringify(data));
        },
        staleTime: STALE_TIMES.MASTER,
      }),
    ]);
  } catch {
    // プリフェッチ失敗時はクライアント側でフォールバック取得
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TagsClient />
    </HydrationBoundary>
  );
}
