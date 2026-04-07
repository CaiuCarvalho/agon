# Bugfix Requirements Document

## Introduction

The Agon e-commerce application is experiencing critical production errors that prevent users from viewing product images and completing checkout transactions. The issues stem from missing product image files referenced in the database seed data, causing cascading failures in Next.js image optimization and potentially impacting the checkout flow. These errors degrade user experience and may prevent successful purchases.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a product page requests flamengo.jpg or barcelona.jpg THEN the system returns HTTP 404 Not Found because these files don't exist in apps/web/public/products/

1.2 WHEN Next.js Image component attempts to optimize missing product images (flamengo.jpg, barcelona.jpg, corinthians.jpg, palmeiras.jpg, sao-paulo.jpg, brasil.jpg, argentina.jpg, real-madrid.jpg, psg.jpg) via /_next/image endpoint THEN the system returns HTTP 400 Bad Request

1.3 WHEN the database seed data references 9 team jersey images (/products/flamengo.jpg, /products/barcelona.jpg, /products/corinthians.jpg, /products/palmeiras.jpg, /products/sao-paulo.jpg, /products/brasil.jpg, /products/argentina.jpg, /products/real-madrid.jpg, /products/psg.jpg) THEN only 9 generic product images exist (product-bag.jpg, product-ball.jpg, product-cap.jpg, product-jersey.jpg, product-mask.jpg, product-scarf.jpg, product-serum.jpg, product-shampoo.jpg, product-shorts.jpg) causing a mismatch

1.4 WHEN /api/checkout/create-order is called in production THEN the system returns HTTP 502 Bad Gateway error, potentially due to Mercado Pago configuration issues or server errors

### Expected Behavior (Correct)

2.1 WHEN a product page requests any product image referenced in the database THEN the system SHALL return HTTP 200 with the image file or a fallback placeholder image

2.2 WHEN Next.js Image component attempts to optimize product images THEN the system SHALL successfully optimize and serve the images without 400 errors

2.3 WHEN the database references product images THEN all referenced image files SHALL exist in apps/web/public/products/ or the database SHALL be updated to reference existing images or use fallback images

2.4 WHEN /api/checkout/create-order is called with valid authentication and shipping data THEN the system SHALL return either HTTP 200 with order details or appropriate error codes (400, 401, 500) with descriptive error messages, not 502 Bad Gateway

### Unchanged Behavior (Regression Prevention)

3.1 WHEN existing product images (product-bag.jpg, product-ball.jpg, product-cap.jpg, product-jersey.jpg, product-mask.jpg, product-scarf.jpg, product-serum.jpg, product-shampoo.jpg, product-shorts.jpg) are requested THEN the system SHALL CONTINUE TO serve them successfully with HTTP 200

3.2 WHEN Next.js Image component optimizes existing valid images THEN the system SHALL CONTINUE TO optimize and cache them correctly

3.3 WHEN /api/checkout/create-order receives invalid data (missing authentication, invalid shipping info) THEN the system SHALL CONTINUE TO return appropriate error responses (401, 400) with descriptive messages

3.4 WHEN Mercado Pago preference creation succeeds THEN the system SHALL CONTINUE TO return the init_point URL for payment redirect

3.5 WHEN the checkout API encounters errors THEN the system SHALL CONTINUE TO log detailed error information to the console for debugging
