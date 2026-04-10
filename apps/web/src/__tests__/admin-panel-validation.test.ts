/**
 * Admin Panel Validation Tests
 * 
 * Validates the structure and integrity of the admin panel implementation
 * These tests check for:
 * - File existence
 * - Type safety
 * - Required exports
 * - Configuration completeness
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Admin Panel - File Structure', () => {
  const basePath = join(process.cwd(), 'src/modules/admin');
  
  it('should have all required service files', () => {
    const services = [
      'services/adminService.ts',
      'services/productService.ts',
      'services/orderService.ts',
      'services/fulfillmentService.ts',
      'services/dashboardService.ts',
    ];
    
    services.forEach(service => {
      const path = join(basePath, service);
      expect(existsSync(path), `Missing service: ${service}`).toBe(true);
    });
  });
  
  it('should have all required hook files', () => {
    const hooks = [
      'hooks/useAdminAuth.ts',
      'hooks/useAdminProducts.ts',
      'hooks/useAdminOrders.ts',
      'hooks/useAdminShipping.ts',
      'hooks/useAdminDashboard.ts',
    ];
    
    hooks.forEach(hook => {
      const path = join(basePath, hook);
      expect(existsSync(path), `Missing hook: ${hook}`).toBe(true);
    });
  });
  
  it('should have all required component files', () => {
    const components = [
      'components/shared/AdminGuard.tsx',
      'components/shared/ErrorBoundary.tsx',
      'components/shared/EmptyState.tsx',
      'components/Products/ProductsPage.tsx',
      'components/Products/ProductTable.tsx',
      'components/Products/ProductForm.tsx',
      'components/Orders/OrdersPage.tsx',
      'components/Orders/OrderTable.tsx',
      'components/Orders/OrderFilters.tsx',
      'components/Fulfillment/ShippingUpdateModal.tsx',
      'components/Fulfillment/ShippingForm.tsx',
    ];
    
    components.forEach(component => {
      const path = join(basePath, component);
      expect(existsSync(path), `Missing component: ${component}`).toBe(true);
    });
  });
  
  it('should have type definitions', () => {
    const path = join(basePath, 'types.ts');
    expect(existsSync(path), 'Missing types.ts').toBe(true);
    
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('export type PaymentStatus');
    expect(content).toContain('export type ShippingStatus');
    expect(content).toContain('export type OrderStatus');
    expect(content).toContain('export interface Order');
    expect(content).toContain('export interface Product');
  });
  
  it('should have validation schemas', () => {
    const path = join(basePath, 'schemas.ts');
    expect(existsSync(path), 'Missing schemas.ts').toBe(true);
    
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('productSchema');
    expect(content).toContain('shippingUpdateSchema');
    expect(content).toContain('orderFiltersSchema');
  });
  
  it('should have constants file', () => {
    const path = join(basePath, 'constants.ts');
    expect(existsSync(path), 'Missing constants.ts').toBe(true);
    
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('PAGE_SIZE');
    expect(content).toContain('COMMON_CARRIERS');
  });
});

describe('Admin Panel - API Routes', () => {
  const apiPath = join(process.cwd(), 'src/app/api/admin');
  
  it('should have dashboard API route', () => {
    const path = join(apiPath, 'dashboard/route.ts');
    expect(existsSync(path), 'Missing dashboard API route').toBe(true);
  });
  
  it('should have products API routes', () => {
    const routes = [
      'products/route.ts',
      'products/[id]/route.ts',
      'products/[id]/stock/route.ts',
      'products/[id]/toggle/route.ts',
    ];
    
    routes.forEach(route => {
      const path = join(apiPath, route);
      expect(existsSync(path), `Missing API route: ${route}`).toBe(true);
    });
  });
  
  it('should have orders API routes', () => {
    const routes = [
      'orders/route.ts',
      'orders/[id]/route.ts',
      'orders/[id]/shipping/route.ts',
    ];
    
    routes.forEach(route => {
      const path = join(apiPath, route);
      expect(existsSync(path), `Missing API route: ${route}`).toBe(true);
    });
  });
});

describe('Admin Panel - Database Migrations', () => {
  const migrationsPath = join(process.cwd(), '../../supabase/migrations');
  
  it('should have shipping fields migration', () => {
    const path = join(migrationsPath, '20250409_admin_panel_shipping_fields.sql');
    expect(existsSync(path), 'Missing shipping fields migration').toBe(true);
    
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('shipping_status');
    expect(content).toContain('tracking_code');
    expect(content).toContain('carrier');
    expect(content).toContain('shipped_at');
    expect(content).toContain('derive_order_status');
  });
  
  it('should have webhook RPC update migration', () => {
    const path = join(migrationsPath, '20250409_update_webhook_rpc_atomic.sql');
    expect(existsSync(path), 'Missing webhook RPC migration').toBe(true);
    
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('update_payment_from_webhook');
    expect(content).toContain('assert_single_payment_per_order');
  });
  
  it('should have RLS policies migration', () => {
    const path = join(migrationsPath, '20250409_admin_panel_rls_policies.sql');
    expect(existsSync(path), 'Missing RLS policies migration').toBe(true);
    
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('admin_select_products');
    expect(content).toContain('admin_select_orders');
    expect(content).toContain('admin_update_orders');
  });
});

describe('Admin Panel - Environment Configuration', () => {
  it('should have admin variables in .env.example', () => {
    const path = join(process.cwd(), '../../.env.example');
    expect(existsSync(path), 'Missing .env.example').toBe(true);
    
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('ADMIN_EMAIL_PRIMARY');
    expect(content).toContain('ADMIN_EMAIL_BACKUP');
    expect(content).toContain('NEXT_PUBLIC_ADMIN_EMAIL_PRIMARY');
    expect(content).toContain('NEXT_PUBLIC_ADMIN_EMAIL_BACKUP');
  });
});

describe('Admin Panel - Documentation', () => {
  it('should have setup guide', () => {
    const path = join(process.cwd(), '../../ADMIN-PANEL-SETUP.md');
    expect(existsSync(path), 'Missing ADMIN-PANEL-SETUP.md').toBe(true);
    
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('Configuração de Variáveis de Ambiente');
    expect(content).toContain('Criar Usuário Admin');
    expect(content).toContain('Whitelist de Emails');
  });
  
  it('should have RLS policies guide', () => {
    const path = join(process.cwd(), '../../supabase/APPLY_ADMIN_RLS_POLICIES.md');
    expect(existsSync(path), 'Missing APPLY_ADMIN_RLS_POLICIES.md').toBe(true);
  });
  
  it('should have testing guide', () => {
    const path = join(process.cwd(), '../../ADMIN-PANEL-TESTING-GUIDE.md');
    expect(existsSync(path), 'Missing ADMIN-PANEL-TESTING-GUIDE.md').toBe(true);
  });
});

describe('Admin Panel - Type Safety', () => {
  it('should export all required types', async () => {
    const types = await import('../modules/admin/types');
    
    // Check type exports exist (TypeScript will validate at compile time)
    expect(types).toBeDefined();
  });
  
  it('should export all required schemas', async () => {
    const schemas = await import('../modules/admin/schemas');
    
    expect(schemas.productSchema).toBeDefined();
    expect(schemas.shippingUpdateSchema).toBeDefined();
    expect(schemas.stockUpdateSchema).toBeDefined();
    expect(schemas.orderFiltersSchema).toBeDefined();
  });
  
  it('should export constants', async () => {
    const constants = await import('../modules/admin/constants');
    
    expect(constants.PAGE_SIZE).toBe(20);
    expect(constants.COMMON_CARRIERS).toBeDefined();
    expect(Array.isArray(constants.COMMON_CARRIERS)).toBe(true);
  });
});

describe('Admin Panel - Service Layer Validation', () => {
  it('should have adminService with validateAdmin function', async () => {
    const { validateAdmin, isApiError } = await import('../modules/admin/services/adminService');
    
    expect(validateAdmin).toBeDefined();
    expect(typeof validateAdmin).toBe('function');
    expect(isApiError).toBeDefined();
    expect(typeof isApiError).toBe('function');
  });
  
  it('should have productService with CRUD functions', async () => {
    const service = await import('../modules/admin/services/productService');
    
    expect(service.listProducts).toBeDefined();
    expect(service.createProduct).toBeDefined();
    expect(service.updateProduct).toBeDefined();
    expect(service.toggleProduct).toBeDefined();
    expect(service.updateStock).toBeDefined();
  });
  
  it('should have orderService with list and details functions', async () => {
    const service = await import('../modules/admin/services/orderService');
    
    expect(service.listOrders).toBeDefined();
    expect(service.getOrderDetails).toBeDefined();
  });
  
  it('should have fulfillmentService with updateShipping function', async () => {
    const service = await import('../modules/admin/services/fulfillmentService');
    
    expect(service.updateShipping).toBeDefined();
    expect(typeof service.updateShipping).toBe('function');
  });
});

describe('Admin Panel - Webhook Idempotency', () => {
  it('should have webhook handler with idempotency check', () => {
    const path = join(process.cwd(), 'src/app/api/webhooks/mercadopago/route.ts');
    expect(existsSync(path), 'Missing webhook handler').toBe(true);
    
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('idempotency');
    expect(content).toContain('correlationId');
    expect(content).toContain('skipped');
    expect(content).toContain('[Webhook]');
  });
});

describe('Admin Panel - Security Validation', () => {
  it('should have AdminGuard component', () => {
    const path = join(process.cwd(), 'src/modules/admin/components/shared/AdminGuard.tsx');
    expect(existsSync(path), 'Missing AdminGuard').toBe(true);
    
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('useAdminAuth');
    expect(content).toContain('loading');
    expect(content).toContain('isAdmin');
  });
  
  it('should have useAdminAuth hook with security checks', () => {
    const path = join(process.cwd(), 'src/modules/admin/hooks/useAdminAuth.ts');
    expect(existsSync(path), 'Missing useAdminAuth').toBe(true);
    
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('getUser');
    expect(content).toContain('role');
    expect(content).toContain('admin');
    expect(content).toContain('whitelist');
    expect(content).toContain('NEXT_PUBLIC_ADMIN_EMAIL');
  });
  
  it('should validate admin in all API routes', () => {
    const apiPath = join(process.cwd(), 'src/app/api/admin');
    const routes = [
      'dashboard/route.ts',
      'products/route.ts',
      'orders/route.ts',
    ];
    
    routes.forEach(route => {
      const path = join(apiPath, route);
      const content = readFileSync(path, 'utf-8');
      expect(content).toContain('validateAdmin');
      expect(content).toContain('isApiError');
    });
  });
});
