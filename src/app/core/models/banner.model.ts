export interface IBanner {
  id: number;
  image: string;
  link: string;
  page: 'home' | 'offers' | 'home-below' | 'below-categories' | 'below-bestselling' | 'below-brands';
}
