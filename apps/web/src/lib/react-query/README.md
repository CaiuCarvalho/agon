# React Query Setup

This directory contains the React Query configuration for the Agon application.

## Installation

```bash
npm install @tanstack/react-query
```

## Configuration

The `QueryProvider.tsx` component wraps the application with `QueryClientProvider` and configures default options:

### Query Defaults

- **staleTime**: 5 minutes (300000ms)
  - Data is considered fresh for 5 minutes
  - No automatic refetch during this period
  
- **gcTime**: 10 minutes (600000ms)
  - Unused data is kept in cache for 10 minutes
  - Previously called `cacheTime` in React Query v4
  
- **retry**: 1
  - Failed queries are retried once before throwing an error
  
- **refetchOnWindowFocus**: false
  - Queries don't automatically refetch when window regains focus
  - Better UX for most use cases

## Usage

The `QueryProvider` is already integrated in the root layout (`apps/web/src/app/layout.tsx`):

```tsx
<AuthProvider>
  <QueryProvider>
    <WishlistProvider>
      <CartProvider>
        {/* App content */}
      </CartProvider>
    </WishlistProvider>
  </QueryProvider>
</AuthProvider>
```

## Provider Hierarchy

The provider hierarchy ensures proper context availability:

1. **AuthProvider** - Authentication context (outermost)
2. **QueryProvider** - React Query client
3. **WishlistProvider** - Wishlist state
4. **CartProvider** - Shopping cart state

## Next Steps

With React Query installed and configured, you can now:

1. Create query hooks in `apps/web/src/modules/products/hooks/`
2. Use `useQuery` for data fetching
3. Use `useMutation` for data mutations
4. Implement optimistic updates with automatic rollback

## Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [React Query Best Practices](https://tanstack.com/query/latest/docs/react/guides/important-defaults)
