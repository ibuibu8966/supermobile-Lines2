/**
 * KYC Image Entity
 *
 * KYC画像のドメインエンティティ定義
 */

export interface KycImage {
  id: string;
  applicationId: string;
  imageType: string;
  imageUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote: string | null;
  reviewedAt: Date | null;
  expiryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface KycImageWithApplication extends KycImage {
  application: {
    id: string;
    kycImages: KycImage[];
  };
}

export interface KycImageUpdateInput {
  status?: 'APPROVED' | 'REJECTED';
  reviewNote?: string;
  expiryDate?: string | null;
}

export interface KycImageUpdateResult {
  kycImage: KycImage;
  kycStatus: 'PENDING' | 'DEFICIENT' | 'RESUBMIT' | 'COMPLETED';
}
