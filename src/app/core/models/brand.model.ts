export interface IBrand {
  id: number;
  name: string;
  slug: string;
  image: string;
  link?: string;
  /** Products of this brand are listed first on category/subcategory pages. */
  pinned?: boolean;
}
