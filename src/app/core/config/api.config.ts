import { environment } from '../../../environments/environment';

const BASE = environment.baseUrl;

export const API_CONFIG = {
  baseUrl: BASE,
  productsUrl: `${BASE}/api/products`,
  categoriesUrl: `${BASE}/api/categories`,
  brandsUrl: `${BASE}/api/brands`,
  bannersUrl: `${BASE}/api/banners`,
  uploadsUrl: `${BASE}/uploads`,
  authUrl: `${BASE}/api/auth`,
  ordersUrl: `${BASE}/api/orders`,
  merchantsUrl: `${BASE}/api/merchants`,
  settingsUrl: `${BASE}/api/settings`,
  priceComparisonsUrl: `${BASE}/api/price-comparisons`,
  expensesUrl: `${BASE}/api/expenses`,
  governoratesUrl: `${BASE}/api/governorates`,
};
