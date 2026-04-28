export interface IWholesaleOffer {
  id: string;
  slug?: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  descriptionHtml?: string;
  descriptionHtmlAr?: string;
  wholesalePrice: number;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage?: number;
  merchantProfitPercentage?: number;
  /** Quantity at which the wholesale price kicks in. Default 0 means always. */
  minWholesaleQuantity?: number;
  /** Cloudinary URLs (populated from server response). */
  mainImages?: string[];
  swiperImages?: string[];
  normalImages?: string[];
  /** Convenience field used by the dashboard form (mirrors mainImages). */
  images?: string[];
  /** Convenience field used by the dashboard form (mirrors normalImages). */
  naturalImages?: string[];
  faq?: { q: string; a: string; qAr?: string; aAr?: string }[];
  offers?: { text: string; textAr?: string; image?: string }[];
  metaTitle?: string;
  metaDescription?: string;
  seoKeywords?: string[];
  createdAt?: string;
}
