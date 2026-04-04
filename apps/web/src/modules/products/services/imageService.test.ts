/**
 * Image Service Unit Tests
 * Tests for image validation, URL optimization, and helper functions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { imageService } from './imageService';

describe('imageService', () => {
  describe('validateImageFile', () => {
    it('should accept valid JPEG file under 5MB', () => {
      const file = new File(['x'.repeat(1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      });

      const result = imageService.validateImageFile(file);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid PNG file under 5MB', () => {
      const file = new File(['x'.repeat(1024 * 1024)], 'test.png', {
        type: 'image/png',
      });

      const result = imageService.validateImageFile(file);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid WebP file under 5MB', () => {
      const file = new File(['x'.repeat(1024 * 1024)], 'test.webp', {
        type: 'image/webp',
      });

      const result = imageService.validateImageFile(file);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject file larger than 5MB', () => {
      const file = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });

      const result = imageService.validateImageFile(file);

      expect(result.success).toBe(false);
      expect(result.error).toContain('5MB');
    });

    it('should reject non-image file types', () => {
      const file = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
      });

      const result = imageService.validateImageFile(file);

      expect(result.success).toBe(false);
      expect(result.error).toContain('JPEG, PNG ou WebP');
    });

    it('should reject unsupported image formats', () => {
      const file = new File(['content'], 'image.gif', {
        type: 'image/gif',
      });

      const result = imageService.validateImageFile(file);

      expect(result.success).toBe(false);
      expect(result.error).toContain('JPEG, PNG ou WebP');
    });
  });

  describe('getOptimizedUrl', () => {
    const cloudinaryUrl =
      'https://res.cloudinary.com/demo/image/upload/v1234567890/agon/products/sample.jpg';

    it('should return original URL for non-Cloudinary URLs', () => {
      const url = 'https://example.com/image.jpg';
      const result = imageService.getOptimizedUrl(url);

      expect(result).toBe(url);
    });

    it('should add width transformation', () => {
      const result = imageService.getOptimizedUrl(cloudinaryUrl, {
        width: 800,
      });

      expect(result).toContain('w_800');
      expect(result).toContain('q_80');
      expect(result).toContain('f_auto');
    });

    it('should add height transformation', () => {
      const result = imageService.getOptimizedUrl(cloudinaryUrl, {
        height: 600,
      });

      expect(result).toContain('h_600');
      expect(result).toContain('q_80');
      expect(result).toContain('f_auto');
    });

    it('should add width, height, and crop mode when both dimensions specified', () => {
      const result = imageService.getOptimizedUrl(cloudinaryUrl, {
        width: 800,
        height: 600,
      });

      expect(result).toContain('w_800');
      expect(result).toContain('h_600');
      expect(result).toContain('c_fill');
      expect(result).toContain('q_80');
      expect(result).toContain('f_auto');
    });

    it('should use custom quality setting', () => {
      const result = imageService.getOptimizedUrl(cloudinaryUrl, {
        quality: 90,
      });

      expect(result).toContain('q_90');
      expect(result).toContain('f_auto');
    });

    it('should default to quality 80 when not specified', () => {
      const result = imageService.getOptimizedUrl(cloudinaryUrl);

      expect(result).toContain('q_80');
      expect(result).toContain('f_auto');
    });

    it('should maintain URL structure with transformations', () => {
      const result = imageService.getOptimizedUrl(cloudinaryUrl, {
        width: 800,
        height: 600,
        quality: 85,
      });

      expect(result).toContain('/upload/');
      expect(result).toContain('agon/products/sample.jpg');
      expect(result).toMatch(/\/upload\/[^/]+\/agon\/products\/sample\.jpg/);
    });

    it('should handle URLs without transformations gracefully', () => {
      const malformedUrl = 'https://res.cloudinary.com/demo/image/sample.jpg';
      const result = imageService.getOptimizedUrl(malformedUrl);

      expect(result).toBe(malformedUrl);
    });
  });

  describe('createPreviewUrl and revokePreviewUrl', () => {
    let previewUrl: string;

    beforeEach(() => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      previewUrl = imageService.createPreviewUrl(file);
    });

    afterEach(() => {
      if (previewUrl) {
        imageService.revokePreviewUrl(previewUrl);
      }
    });

    it('should create blob URL for preview', () => {
      expect(previewUrl).toMatch(/^blob:/);
    });

    it('should revoke preview URL without errors', () => {
      expect(() => {
        imageService.revokePreviewUrl(previewUrl);
      }).not.toThrow();
    });
  });

  describe('getImageDimensions', () => {
    it('should resolve dimensions for valid image', async () => {
      // Create a minimal valid 1x1 PNG
      const pngData = atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      );
      const bytes = new Uint8Array(pngData.length);
      for (let i = 0; i < pngData.length; i++) {
        bytes[i] = pngData.charCodeAt(i);
      }
      const file = new File([bytes], 'test.png', { type: 'image/png' });

      const dimensions = await imageService.getImageDimensions(file);

      expect(dimensions.width).toBe(1);
      expect(dimensions.height).toBe(1);
    });

    it('should reject invalid image data', async () => {
      const file = new File(['invalid'], 'test.jpg', { type: 'image/jpeg' });

      await expect(imageService.getImageDimensions(file)).rejects.toThrow(
        'Failed to load image'
      );
    });
  });
});
