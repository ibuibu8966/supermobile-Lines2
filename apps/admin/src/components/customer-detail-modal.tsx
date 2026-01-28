import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui";

interface CustomerDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    type: string;
    lastName: string;
    firstName: string;
    lastNameKana?: string | null;
    firstNameKana?: string | null;
    companyName?: string | null;
    companyNameKana?: string | null;
    postalCode?: string | null;
    prefecture?: string | null;
    city?: string | null;
    address?: string | null;
    building?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

export function CustomerDetailModal({
  open,
  onOpenChange,
  customer,
}: CustomerDetailModalProps) {
  const isIndividual = customer.type === "INDIVIDUAL";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>顧客情報</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 個人/法人タイプ表示 */}
          <div>
            <div className="text-sm text-muted-foreground">種別</div>
            <div className="font-medium">
              {isIndividual ? "個人" : "法人"}
            </div>
          </div>

          {/* 名前/会社名 */}
          {isIndividual ? (
            <>
              <div>
                <div className="text-sm text-muted-foreground">氏名</div>
                <div className="font-medium">
                  {customer.lastName} {customer.firstName}
                </div>
              </div>
              {(customer.lastNameKana || customer.firstNameKana) && (
                <div>
                  <div className="text-sm text-muted-foreground">フリガナ</div>
                  <div>
                    {customer.lastNameKana} {customer.firstNameKana}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <div className="text-sm text-muted-foreground">会社名</div>
                <div className="font-medium">{customer.companyName}</div>
              </div>
              {customer.companyNameKana && (
                <div>
                  <div className="text-sm text-muted-foreground">フリガナ</div>
                  <div>{customer.companyNameKana}</div>
                </div>
              )}
            </>
          )}

          {/* 連絡先情報 */}
          {customer.email && (
            <div>
              <div className="text-sm text-muted-foreground">
                メールアドレス
              </div>
              <div>{customer.email}</div>
            </div>
          )}
          {customer.phone && (
            <div>
              <div className="text-sm text-muted-foreground">電話番号</div>
              <div>{customer.phone}</div>
            </div>
          )}

          {/* 住所 */}
          {(customer.postalCode || customer.prefecture) && (
            <div>
              <div className="text-sm text-muted-foreground">住所</div>
              <div className="space-y-1">
                {customer.postalCode && <div>〒{customer.postalCode}</div>}
                <div>
                  {customer.prefecture}
                  {customer.city}
                  {customer.address}
                  {customer.building && <div>{customer.building}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
