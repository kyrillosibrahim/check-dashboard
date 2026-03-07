import { IBrand } from './brand.model';

export interface ISubcategory {
  id: number;
  name: string;
  slug: string;
  image: string;
}

export interface ICategory {
  id: number;
  name: string;
  slug: string;
  image?: string;
  subcategories?: ISubcategory[];
  famousBrands?: number[];          // brand IDs (stored)
  famousBrandsData?: IBrand[];      // populated brand objects (from detailed API)
}
