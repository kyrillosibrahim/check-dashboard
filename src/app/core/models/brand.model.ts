export interface IBrand {
  id: number;
  name: string;
  slug: string;
  image: string;
  link?: string;
  /** Products of this brand are listed first on category/subcategory pages. */
  pinned?: boolean;
  /** Wide image shown instead of the categories row when the products page is filtered by this brand. */
  banner?: string;
}
