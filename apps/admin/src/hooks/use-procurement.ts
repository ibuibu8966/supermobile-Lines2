import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES } from "@/lib/api/query-keys";
import type { PurchaseOrder } from "@/types/procurement";
import type { PurchaseOrderUpdateInput } from "@/repositories/procurement.repository";

/**
 * Procurement管理用カスタムフック
 * 発注データの取得と更新を管理
 */
export function useProcurement() {
  const queryClient = useQueryClient();

  // 発注データの取得
  const { data: orders, isLoading, error } = useQuery<PurchaseOrder[]>({
    queryKey: queryKeys.procurement,
    queryFn: () => fetch("/api/procurement").then((r) => r.json()),
    staleTime: STALE_TIMES.MASTER, // 楽観的更新後の不要な再フェッチを防止
    refetchInterval: 60000, // 60秒ごとに自動再フェッチ（他ユーザーの更新を取得）
    refetchOnWindowFocus: false, // 楽観的更新後の即座な再フェッチを防止（UIフリッカー対策）
  });

  // 発注データの更新
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PurchaseOrderUpdateInput }) => {
      const res = await fetch(`/api/procurement/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onMutate: async ({ id, data }) => {
      // 進行中のクエリをキャンセル
      await queryClient.cancelQueries({ queryKey: queryKeys.procurement });

      // 以前の値をスナップショット
      const previousOrders = queryClient.getQueryData<PurchaseOrder[]>(queryKeys.procurement);

      // 楽観的更新
      queryClient.setQueryData<PurchaseOrder[]>(queryKeys.procurement, (old) => {
        if (!old) return old;
        return old.map((order) => {
          if (order.id === id) {
            const normalizedData = {
              ...data,
              invoiceDate: data.invoiceDate instanceof Date
                ? data.invoiceDate.toISOString()
                : (data.invoiceDate ?? order.invoiceDate),
              deliveryDate: data.deliveryDate instanceof Date
                ? data.deliveryDate.toISOString()
                : (data.deliveryDate ?? order.deliveryDate),
            };
            return { ...order, ...normalizedData };
          }
          return order;
        });
      });

      return { previousOrders };
    },
    onSuccess: (updatedOrder, { id }) => {
      // APIレスポンスで該当データのみ更新（再フェッチ不要）
      queryClient.setQueryData<PurchaseOrder[]>(queryKeys.procurement, (old) => {
        if (!old) return old;
        return old.map((order) =>
          order.id === id ? updatedOrder : order
        );
      });
    },
    onError: (err, variables, context) => {
      // エラー時はロールバック
      if (context?.previousOrders) {
        queryClient.setQueryData(queryKeys.procurement, context.previousOrders);
      }
    },
  });

  // 画像アップロード（楽観的更新付き）
  const uploadImageMutation = useMutation({
    mutationFn: async ({
      id,
      imageType,
      file,
    }: {
      id: string;
      imageType: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("imageType", imageType);

      const res = await fetch(`/api/procurement/${id}/upload-image`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload image");
      return res.json();
    },
    onMutate: async ({ id, imageType, file }) => {
      // 進行中のクエリをキャンセル
      await queryClient.cancelQueries({ queryKey: queryKeys.procurement });

      // 以前の値をスナップショット
      const previousOrders = queryClient.getQueryData<PurchaseOrder[]>(queryKeys.procurement);

      // 画像タイプに応じたフィールド名
      const fieldMap = {
        purchaseOrder: "purchaseOrderImagePath",
        quote: "quoteImagePath",
        invoice: "invoiceImagePath",
      } as const;

      const fieldName = fieldMap[imageType as keyof typeof fieldMap];

      // ローカルプレビュー用のURLを作成
      const previewUrl = URL.createObjectURL(file);

      // 楽観的更新（該当フィールドのみ更新）
      queryClient.setQueryData<PurchaseOrder[]>(queryKeys.procurement, (old) => {
        if (!old) return old;
        return old.map((order) => {
          if (order.id === id) {
            return { ...order, [fieldName]: previewUrl };
          }
          return order;
        });
      });

      return { previousOrders, previewUrl };
    },
    onSuccess: (updatedOrder, { id, imageType }) => {
      // 成功時は該当の発注データのみ更新（全体の再フェッチを避ける）
      queryClient.setQueryData<PurchaseOrder[]>(queryKeys.procurement, (old) => {
        if (!old) return old;
        return old.map((order) => {
          if (order.id === id) {
            return updatedOrder;
          }
          return order;
        });
      });
    },
    onError: (err, variables, context) => {
      // エラー時はロールバック
      if (context?.previousOrders) {
        queryClient.setQueryData(queryKeys.procurement, context.previousOrders);
      }
      // プレビューURLをクリーンアップ
      if (context?.previewUrl) {
        URL.revokeObjectURL(context.previewUrl);
      }
    },
    onSettled: (data, error, variables, context) => {
      // プレビューURLをクリーンアップ
      if (context?.previewUrl) {
        URL.revokeObjectURL(context.previewUrl);
      }
    },
  });

  // 画像削除（楽観的更新付き）
  const deleteImageMutation = useMutation({
    mutationFn: async ({ id, imageType }: { id: string; imageType: string }) => {
      const res = await fetch(
        `/api/procurement/${id}/upload-image?imageType=${imageType}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Failed to delete image");
      return res.json();
    },
    onMutate: async ({ id, imageType }) => {
      // 進行中のクエリをキャンセル
      await queryClient.cancelQueries({ queryKey: queryKeys.procurement });

      // 以前の値をスナップショット
      const previousOrders = queryClient.getQueryData<PurchaseOrder[]>(queryKeys.procurement);

      // 画像タイプに応じたフィールド名
      const fieldMap = {
        purchaseOrder: "purchaseOrderImagePath",
        quote: "quoteImagePath",
        invoice: "invoiceImagePath",
      } as const;

      const fieldName = fieldMap[imageType as keyof typeof fieldMap];

      // 楽観的更新（該当フィールドをnullに）
      queryClient.setQueryData<PurchaseOrder[]>(queryKeys.procurement, (old) => {
        if (!old) return old;
        return old.map((order) => {
          if (order.id === id) {
            return { ...order, [fieldName]: null };
          }
          return order;
        });
      });

      return { previousOrders };
    },
    onSuccess: (updatedOrder, { id }) => {
      // 成功時は該当の発注データのみ更新（全体の再フェッチを避ける）
      queryClient.setQueryData<PurchaseOrder[]>(queryKeys.procurement, (old) => {
        if (!old) return old;
        return old.map((order) => {
          if (order.id === id) {
            return updatedOrder;
          }
          return order;
        });
      });
    },
    onError: (err, variables, context) => {
      // エラー時はロールバック
      if (context?.previousOrders) {
        queryClient.setQueryData(queryKeys.procurement, context.previousOrders);
      }
    },
  });

  return {
    orders,
    isLoading,
    error,
    updateMutation,
    uploadImageMutation,
    deleteImageMutation,
  };
}
