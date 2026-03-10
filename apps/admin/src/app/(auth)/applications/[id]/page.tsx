import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES } from "@/lib/api/query-keys";
import { prisma } from "@/lib/database";
import { ApplicationRepository } from "@/repositories/application.repository";
import { ApplicationDetailClient } from "./application-detail-client";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = new QueryClient();

  try {
    const applicationRepo = new ApplicationRepository(prisma);

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.applicationDetail(id),
        queryFn: () => applicationRepo.findById(id).then((r) => JSON.parse(JSON.stringify(r))),
        staleTime: STALE_TIMES.LIST,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.lineTags,
        queryFn: async () => {
          const data = await prisma.lineTag.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
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
            where: { isActive: true },
            select: { id: true, name: true },
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
            where: { isActive: true },
            select: { id: true, name: true },
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
      <ApplicationDetailClient />
    </HydrationBoundary>
  );
}
