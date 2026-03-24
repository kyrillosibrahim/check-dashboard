import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(c => c.LoginComponent),
    title: 'KaroKan - تسجيل الدخول'
  },
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full'
  },
  {
    path: 'products',
    loadComponent: () => import('./features/dashboard/pages/product-list/product-list.component')
      .then(c => c.ProductListComponent),
    title: 'KaroKan - All Products',
    canActivate: [authGuard]
  },
  {
    path: 'add',
    loadComponent: () => import('./features/dashboard/pages/product-add/product-add.component')
      .then(c => c.ProductAddComponent),
    title: 'KaroKan - Add Product',
    canActivate: [authGuard]
  },
  {
    path: 'categories',
    loadComponent: () => import('./features/dashboard/pages/category-manage/category-manage.component')
      .then(c => c.CategoryManageComponent),
    title: 'KaroKan - إدارة الأقسام',
    canActivate: [authGuard]
  },
  {
    path: 'brands',
    loadComponent: () => import('./features/dashboard/pages/brand-manage/brand-manage.component')
      .then(c => c.BrandManageComponent),
    title: 'KaroKan - إدارة العلامات التجارية',
    canActivate: [authGuard]
  },
  {
    path: 'banners',
    loadComponent: () => import('./features/dashboard/pages/banner-manage/banner-manage.component')
      .then(c => c.BannerManageComponent),
    title: 'KaroKan - بنرات العروض',
    canActivate: [authGuard]
  },
  {
    path: 'customers',
    loadComponent: () => import('./features/dashboard/pages/customer-list/customer-list.component')
      .then(c => c.CustomerListComponent),
    title: 'KaroKan - كافة العملاء',
    canActivate: [authGuard]
  },
  {
    path: 'invoices',
    loadComponent: () => import('./features/dashboard/pages/invoice-list/invoice-list.component')
      .then(c => c.InvoiceListComponent),
    title: 'KaroKan - الفواتير',
    canActivate: [authGuard]
  },
  {
    path: 'invoices/:id',
    loadComponent: () => import('./features/dashboard/pages/invoice-detail/invoice-detail.component')
      .then(c => c.InvoiceDetailComponent),
    title: 'KaroKan - تفاصيل الفاتورة',
    canActivate: [authGuard]
  },
  {
    path: 'profits',
    loadComponent: () => import('./features/dashboard/pages/profits/profits.component')
      .then(c => c.ProfitsComponent),
    title: 'KaroKan - الأرباح',
    canActivate: [authGuard]
  },
  {
    path: 'expenses',
    loadComponent: () => import('./features/dashboard/pages/expense-manage/expense-manage.component')
      .then(c => c.ExpenseManageComponent),
    title: 'KaroKan - الخسائر والخصومات',
    canActivate: [authGuard]
  },
  {
    path: 'merchants',
    loadComponent: () => import('./features/dashboard/pages/merchant-manage/merchant-manage.component')
      .then(c => c.MerchantManageComponent),
    title: 'KaroKan - إدارة التجار',
    canActivate: [authGuard]
  },
  {
    path: 'edit/:category/:slug',
    loadComponent: () => import('./features/dashboard/pages/product-edit/product-edit.component')
      .then(c => c.ProductEditComponent),
    title: 'KaroKan - Edit Product',
    canActivate: [authGuard]
  },
  {
    path: 'price-compare',
    loadComponent: () => import('./features/dashboard/pages/price-compare/price-compare.component')
      .then(c => c.PriceCompareComponent),
    title: 'KaroKan - مقارنة اسعار التجار',
    canActivate: [authGuard]
  },
  {
    path: 'shipping',
    loadComponent: () => import('./features/dashboard/pages/shipping-manage/shipping-manage.component')
      .then(c => c.ShippingManageComponent),
    title: 'KaroKan - إدارة الشحن',
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/dashboard/pages/site-settings/site-settings.component')
      .then(c => c.SiteSettingsComponent),
    title: 'KaroKan - إعدادات الموقع',
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'products'
  }
];
