import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(c => c.LoginComponent),
    title: 'Kaf - تسجيل الدخول'
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
    title: 'Kaf - All Products',
    canActivate: [authGuard]
  },
  {
    path: 'add',
    loadComponent: () => import('./features/dashboard/pages/product-add/product-add.component')
      .then(c => c.ProductAddComponent),
    title: 'Kaf - Add Product',
    canActivate: [authGuard]
  },
  {
    path: 'wholesale-offers',
    loadComponent: () => import('./features/dashboard/pages/wholesale-offers-list/wholesale-offers-list.component')
      .then(c => c.WholesaleOffersListComponent),
    title: 'Kaf - كافة عروض الجملة',
    canActivate: [authGuard]
  },
  {
    path: 'categories',
    loadComponent: () => import('./features/dashboard/pages/category-manage/category-manage.component')
      .then(c => c.CategoryManageComponent),
    title: 'Kaf - إدارة الأقسام',
    canActivate: [authGuard]
  },
  {
    path: 'brands',
    loadComponent: () => import('./features/dashboard/pages/brand-manage/brand-manage.component')
      .then(c => c.BrandManageComponent),
    title: 'Kaf - إدارة العلامات التجارية',
    canActivate: [authGuard]
  },
  {
    path: 'banners',
    loadComponent: () => import('./features/dashboard/pages/banner-manage/banner-manage.component')
      .then(c => c.BannerManageComponent),
    title: 'Kaf - بنرات العروض',
    canActivate: [authGuard]
  },
  {
    path: 'customers',
    loadComponent: () => import('./features/dashboard/pages/customer-list/customer-list.component')
      .then(c => c.CustomerListComponent),
    title: 'Kaf - كافة العملاء',
    canActivate: [authGuard]
  },
  {
    path: 'invoices',
    loadComponent: () => import('./features/dashboard/pages/invoice-list/invoice-list.component')
      .then(c => c.InvoiceListComponent),
    title: 'Kaf - الفواتير',
    canActivate: [authGuard]
  },
  {
    path: 'product-reviews',
    loadComponent: () => import('./features/dashboard/pages/product-reviews/product-reviews.component')
      .then(c => c.ProductReviewsComponent),
    title: 'Kaf - تقييمات المنتجات',
    canActivate: [authGuard]
  },
  {
    path: 'invoices/:id',
    loadComponent: () => import('./features/dashboard/pages/invoice-detail/invoice-detail.component')
      .then(c => c.InvoiceDetailComponent),
    title: 'Kaf - تفاصيل الفاتورة',
    canActivate: [authGuard]
  },
  {
    path: 'profits',
    loadComponent: () => import('./features/dashboard/pages/profits/profits.component')
      .then(c => c.ProfitsComponent),
    title: 'Kaf - الأرباح',
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'expenses',
    loadComponent: () => import('./features/dashboard/pages/expense-manage/expense-manage.component')
      .then(c => c.ExpenseManageComponent),
    title: 'Kaf - الخسائر والخصومات',
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'merchants',
    loadComponent: () => import('./features/dashboard/pages/merchant-manage/merchant-manage.component')
      .then(c => c.MerchantManageComponent),
    title: 'Kaf - إدارة التجار',
    canActivate: [authGuard]
  },
  {
    path: 'edit/:category/:slug',
    loadComponent: () => import('./features/dashboard/pages/product-edit/product-edit.component')
      .then(c => c.ProductEditComponent),
    title: 'Kaf - Edit Product',
    canActivate: [authGuard]
  },
  {
    path: 'external-websites',
    loadComponent: () => import('./features/dashboard/pages/external-websites-manage/external-websites-manage.component')
      .then(c => c.ExternalWebsitesManageComponent),
    title: 'Kaf - إدارة المواقع الخارجية',
    canActivate: [authGuard]
  },
  {
    path: 'price-compare',
    loadComponent: () => import('./features/dashboard/pages/price-compare/price-compare.component')
      .then(c => c.PriceCompareComponent),
    title: 'Kaf - مقارنة اسعار التجار',
    canActivate: [authGuard]
  },
  {
    path: 'shipping',
    loadComponent: () => import('./features/dashboard/pages/shipping-manage/shipping-manage.component')
      .then(c => c.ShippingManageComponent),
    title: 'Kaf - إدارة الشحن',
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/dashboard/pages/site-settings/site-settings.component')
      .then(c => c.SiteSettingsComponent),
    title: 'Kaf - إعدادات الموقع',
    canActivate: [authGuard]
  },
  {
    path: 'guardian-angel',
    loadComponent: () => import('./features/dashboard/pages/guardian-angel/guardian-angel.component')
      .then(c => c.GuardianAngelComponent),
    title: 'Kaf - الملاك الحارس',
    canActivate: [authGuard]
  },
  {
    path: 'admin-activity',
    loadComponent: () => import('./features/dashboard/pages/admin-activity/admin-activity.component')
      .then(c => c.AdminActivityComponent),
    title: 'Kaf - حركة الإدارة',
    canActivate: [authGuard, adminGuard]
  },
  {
    path: '**',
    redirectTo: 'products'
  }
];
