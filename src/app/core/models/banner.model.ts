export interface IBanner {
  id: number;
  image: string;
  link: string;
  order?: number;
  page: 'home' | 'offers' | 'home-below' | 'below-categories' | 'below-bestselling' | 'below-brands';
}
