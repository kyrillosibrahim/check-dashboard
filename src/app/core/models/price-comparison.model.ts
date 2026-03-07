export interface IMerchantPrice {
  merchantName: string;
  originalPrice: number;
  wholesalePrice: number;
  sellingPrice: number;
}

export interface IPriceComparison {
  id: number;
  productId: string;
  productName: string;
  categorySlug: string;
  merchants: IMerchantPrice[];
  bestMerchant: string;
  bestWholesalePrice: number;
  sellingPrice: number;
  profit: number;
  profitPercent: number;
  createdAt: string;
}
