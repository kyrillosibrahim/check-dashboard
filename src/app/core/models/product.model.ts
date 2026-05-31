export interface IProduct {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  descriptionHtml?: string;
  descriptionHtmlAr?: string;
  price: number;
  discountPercentage: number;
  rating: number;
  ratingsCount: number;
  stock: number;
  categoryId: number;
  category: string;
  subcategory?: string;
  images: string[];
  naturalImages?: string[];
  brand: string;
  merchant?: string;
  isFeatured: boolean;
  tags: string[];
  filterTags?: string[];
  productForm?: {
    type: string;
    typeAr: string;
    count?: string;
  };
  comingSoon?: boolean;
  faq?: { q: string; a: string; qAr?: string; aAr?: string }[];

  // Dashboard pricing fields
  wholesalePrice?: number;
  originalPrice?: number;
  discountedPrice?: number;
  merchantProfitPercent?: number;
  minWholesaleQuantity?: number;
  /** Wholesale "bundle" offer: buy N pieces at this special bundle price. */
  offerPiecesCount?: number;
  offerPrice?: number;

  // Dashboard image categories
  swiperImages?: string[];

  // Backend image paths (relative like "main/img-1.webp")
  mainImages?: string[];
  normalImages?: string[];

  // URL slug
  slug?: string;

  // Actual folder name on disk (e.g. "vitamins")
  categoryFolder?: string;

  // Special offers
  offers?: { text: string; textAr?: string; image?: string }[];

  // Wholesale offers section flag
  isWholesaleOffer?: boolean;

  // SEO fields
  metaTitle?: string;
  metaDescription?: string;
  seoKeywords?: string[];

  // Price comparison with external websites
  comparisonSites?: IComparisonSite[];

  // Variants (sizes / types / colors / volumes / models)
  hasVariants?: boolean;
  variantOptionType?: 'size' | 'type' | 'volume' | 'color' | 'model';
  variantOptionTypeAr?: string;
  baseVariantName?: string;
  baseVariantNameAr?: string;
  baseColorHex?: string;
  variants?: IProductVariant[];
}

export interface IComparisonSite {
  websiteId?: number;
  websiteName: string;
  websiteLogo: string;
  price: number;
  link: string;
}

export interface IProductVariant {
  id: string;
  name: string;
  nameAr?: string;
  mainImages: string[];
  naturalImages?: string[];
  wholesalePrice?: number;
  originalPrice?: number;
  discountedPrice?: number;
  stock?: number;
  colorHex?: string;
}
