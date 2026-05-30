import { Routes } from '@angular/router';
import { authGuard, adminGuard, developerGuard } from './core/guards';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/catalog/catalog.component').then(m => m.CatalogComponent) },
  { path: 'product/:code', loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
  { path: 'cart', loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent) },
  { path: 'checkout', loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent), canActivate: [authGuard] },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  { path: 'account', loadComponent: () => import('./pages/account/account.component').then(m => m.AccountComponent), canActivate: [authGuard] },
  { path: 'admin', loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent), canActivate: [adminGuard] },
  { path: 'admin/metrics', loadComponent: () => import('./pages/metrics/metrics.component').then(m => m.MetricsComponent), canActivate: [adminGuard] },
  { path: 'admin/orders', loadComponent: () => import('./pages/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent), canActivate: [adminGuard] },
  { path: 'antiques', loadComponent: () => import('./pages/antiques/antiques.component').then(m => m.AntiquesComponent) },
  { path: 'about', loadComponent: () => import('./pages/ceo/ceo.component').then(m => m.CeoComponent) },
  { path: 'developer', loadComponent: () => import('./pages/developer/developer.component').then(m => m.DeveloperComponent), canActivate: [developerGuard] },
  { path: '**', redirectTo: '' },
];
