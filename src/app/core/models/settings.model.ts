export interface ISiteSettings {
  logo: string;
  colors: {
    primaryLight: string;
    primaryDark: string;
    secondaryLight: string;
    secondaryDark: string;
  };
  social: {
    facebook: string;
    instagram: string;
    whatsapp: string;
    phone: string;
  };
  bestSellingProducts: string[];   // product IDs
  bestSellingBrands: number[];     // brand IDs
  naturalProducts?: { video: string; link: string }[];
  cartCount?: number;
  favoritesCount?: number;
}
