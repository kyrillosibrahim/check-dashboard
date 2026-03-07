import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full'
  },
  {
    path: 'products',
    loadComponent: () => import('./features/dashboard/pages/product-list/product-list.component')
      .then(c => c.ProductListComponent),
    title: 'KaroKan - All Products'
  },
  {
    path: 'add',
    loadComponent: () => import('./features/dashboard/pages/product-add/product-add.component')
      .then(c => c.ProductAddComponent),
    title: 'KaroKan - Add Product'
  },
  {
    path: 'categories',
    loadComponent: () => import('./features/dashboard/pages/category-manage/category-manage.component')
      .then(c => c.CategoryManageComponent),
    title: 'KaroKan - إدارة الأقسام'
  },
  {
    path: 'brands',
    loadComponent: () => import('./features/dashboard/pages/brand-manage/brand-manage.component')
      .then(c => c.BrandManageComponent),
    title: 'KaroKan - إدارة العلامات التجارية'
  },
  {
    path: 'banners',
    loadComponent: () => import('./features/dashboard/pages/banner-manage/banner-manage.component')
      .then(c => c.BannerManageComponent),
    title: 'KaroKan - بنرات العروض'
  },
  {
    path: 'customers',
    loadComponent: () => import('./features/dashboard/pages/customer-list/customer-list.component')
      .then(c => c.CustomerListComponent),
    title: 'KaroKan - كافة العملاء'
  },
  {
    path: 'invoices',
    loadComponent: () => import('./features/dashboard/pages/invoice-list/invoice-list.component')
      .then(c => c.InvoiceListComponent),
    title: 'KaroKan - الفواتير'
  },
  {
    path: 'invoices/:id',
    loadComponent: () => import('./features/dashboard/pages/invoice-detail/invoice-detail.component')
      .then(c => c.InvoiceDetailComponent),
    title: 'KaroKan - تفاصيل الفاتورة'
  },
  {
    path: 'profits',
    loadComponent: () => import('./features/dashboard/pages/profits/profits.component')
      .then(c => c.ProfitsComponent),
    title: 'KaroKan - الأرباح'
  },
  {
    path: 'expenses',
    loadComponent: () => import('./features/dashboard/pages/expense-manage/expense-manage.component')
      .then(c => c.ExpenseManageComponent),
    title: 'KaroKan - الخسائر والخصومات'
  },
  {
    path: 'merchants',
    loadComponent: () => import('./features/dashboard/pages/merchant-manage/merchant-manage.component')
      .then(c => c.MerchantManageComponent),
    title: 'KaroKan - إدارة التجار'
  },
  {
    path: 'edit/:category/:slug',
    loadComponent: () => import('./features/dashboard/pages/product-edit/product-edit.component')
      .then(c => c.ProductEditComponent),
    title: 'KaroKan - Edit Product'
  },
  {
    path: 'price-compare',
    loadComponent: () => import('./features/dashboard/pages/price-compare/price-compare.component')
      .then(c => c.PriceCompareComponent),
    title: 'KaroKan - مقارنة اسعار التجار'
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/dashboard/pages/site-settings/site-settings.component')
      .then(c => c.SiteSettingsComponent),
    title: 'KaroKan - إعدادات الموقع'
  },
  {
    path: '**',
    redirectTo: 'products'
  }
];
