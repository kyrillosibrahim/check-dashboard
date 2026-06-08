export interface IProductReview {
  id: string;
  productId: string;
  productTitle?: string;
  productSlug?: string;
  productCategory?: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved';
  createdAt?: string;
  updatedAt?: string;
}
