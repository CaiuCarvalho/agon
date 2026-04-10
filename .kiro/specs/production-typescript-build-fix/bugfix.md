# Bugfix Requirements Document

## Introduction

The Next.js production build fails on VPS Ubuntu 24.04 with a TypeScript error in `ProductTable.tsx`, while the same build succeeds locally. The error occurs because React Query v5's `useQuery` hook returns a type wrapped in `NoInfer<TQueryFnData>`, preventing TypeScript from properly inferring that `data` is of type `PaginatedProducts | undefined`. This causes the compiler to reject property access like `data?.products` because it cannot verify that the `products` property exists on the generic `NoInfer` type.

**Root Cause Analysis - End-to-End Type Flow Issues:**

1. **Missing Hook Return Type**: `useProducts` and `useProduct` hooks lack explicit `UseQueryResult<T, E>` return type annotations, causing TypeScript to infer `NoInfer<TQueryFnData>` in production builds

2. **Implicit `any` in Service Layer**: `transformProductRow(row: any)` accepts `any` type, breaking type safety chain from database to component

3. **Missing Service Return Type Annotations**: While `getProducts` has `Promise<PaginatedProducts>` return type, the internal helper `getProductsWithSearch` also needs explicit typing to ensure consistency

4. **Type Inference Dependency**: The entire type flow depends on implicit inference rather than explicit contracts, making it fragile across different TypeScript compiler configurations (local vs production)

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the production build runs TypeScript compilation on `ProductTable.tsx` THEN the system fails with error "Property 'products' does not exist on type 'NoInfer_2<TQueryFnData>'" at line 58

1.2 WHEN `useProducts` hook is called without explicit return type annotation THEN TypeScript in production infers the return type as containing `NoInfer<TQueryFnData>` instead of `UseQueryResult<PaginatedProducts, Error>`

1.3 WHEN the component attempts to access `data?.products` where `data` is inferred as `NoInfer<TQueryFnData>` THEN TypeScript cannot verify the `products` property exists and rejects the compilation

1.4 WHEN `transformProductRow` accepts `row: any` parameter THEN type safety is broken at the service layer, allowing implicit `any` to propagate through the type chain

1.5 WHEN service functions rely on implicit return type inference THEN TypeScript cannot guarantee type consistency across different compiler configurations (local vs production)

### Expected Behavior (Correct)

2.1 WHEN the production build runs TypeScript compilation on `ProductTable.tsx` THEN the system SHALL complete successfully without type errors

2.2 WHEN `useProducts` hook is called THEN the system SHALL return a properly typed `UseQueryResult<PaginatedProducts, Error>` where `data` is explicitly `PaginatedProducts | undefined`

2.3 WHEN the component accesses `data?.products` THEN TypeScript SHALL recognize `products` as a valid property of type `Product[]` and allow the compilation

2.4 WHEN `transformProductRow` processes database rows THEN it SHALL accept properly typed parameters (not `any`) and return `Product` type with full type safety

2.5 WHEN service functions return data THEN they SHALL have explicit return type annotations ensuring type consistency across all compiler configurations

2.6 WHEN the type chain flows from database → service → hook → component THEN TypeScript SHALL maintain complete type safety without implicit `any` at any layer

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `useProducts` hook is called with valid filters THEN the system SHALL CONTINUE TO fetch and return paginated products correctly

3.2 WHEN `useProduct` hook is called with a product ID THEN the system SHALL CONTINUE TO fetch and return a single product correctly

3.3 WHEN React Query caching, retry logic, and staleTime configurations are active THEN the system SHALL CONTINUE TO function as configured

3.4 WHEN components consume `useProducts` or `useProduct` hooks THEN the system SHALL CONTINUE TO provide the same runtime behavior and data structure

3.5 WHEN local development builds run THEN the system SHALL CONTINUE TO compile successfully
