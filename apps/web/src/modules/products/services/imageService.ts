/**
 * Image Service
 * Handles image upload to Cloudinary, validation, and URL optimization
 * 
 * Validates Requirements:
 * - 14.1: Image upload field in admin form
 * - 14.2: Accept JPEG, PNG, WebP formats
 * - 14.3: Validate file size <= 5MB
 * - 14.4: Display error for files > 5MB
 * - 14.5: Display error for non-image files
 * - 14.6: Upload to Cloudinary
 * - 14.7: Display upload progress indicator
 * - 14.8: Set returned URL in image_url field
 * - 14.9: Display error toast on upload failure
 * - 14.10: Display image preview after upload
 * - 14.11: Allow replacing image
 * - 14.12: Optional image compression
 */

import { imageFileSchema } from '../schemas';
import type { ImageUploadResponse } from '../types';

/**
 * Image service for handling product image operations
 */
export const imageService = {
  /**
   * Upload image to Cloudinary
   * 
   * @param file - The image file to upload
   * @param onProgress - Optional callback for upload progress (0-100)
   * @returns Promise with uploaded image metadata
   * @throws Error if validation fails or upload fails
   * 
   * Validates Requirements:
   * - 14.2: File type validation (JPEG, PNG, WebP)
   * - 14.3: File size validation (<= 5MB)
   * - 14.6: Upload to Cloudinary with folder structure
   * - 14.7: Upload progress tracking
   */
  async uploadImage(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ImageUploadResponse> {
    // Validate file with Zod schema (Requirement 14.2, 14.3)
    const validation = imageFileSchema.safeParse({ file });
    
    if (!validation.success) {
      const error = validation.error.errors[0];
      throw new Error(error.message);
    }

    // Check for required environment variables
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error(
        'Cloudinary configuration missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET environment variables.'
      );
    }

    // Prepare form data for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'agon/products'); // Requirement 14.6: Upload to agon/products folder

    try {
      // Upload with progress tracking (Requirement 14.7)
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              onProgress(progress);
            }
          });
        }

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
            }));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });

        xhr.open(
          'POST',
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
        );
        xhr.send(formData);
      });

      const data = await response.json();

      // Handle Cloudinary error responses
      if (data.error) {
        throw new Error(data.error.message || 'Upload failed');
      }

      // Return standardized response (Requirement 14.8)
      return {
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
      };
    } catch (error) {
      // Handle specific error cases (Requirements 14.4, 14.5, 14.9)
      if (error instanceof Error) {
        // Check for file size error (413 Payload Too Large)
        if (error.message.includes('413') || error.message.includes('too large')) {
          throw new Error('Arquivo muito grande. O tamanho máximo é 5MB.');
        }
        
        // Check for unsupported format error (415 Unsupported Media Type)
        if (error.message.includes('415') || error.message.includes('unsupported')) {
          throw new Error('Formato não suportado. Use JPEG, PNG ou WebP.');
        }

        throw error;
      }

      throw new Error('Falha ao fazer upload da imagem. Tente novamente.');
    }
  },

  /**
   * Delete image from Cloudinary
   * Note: This requires a server-side API route for security
   * Cloudinary deletion requires API secret which should not be exposed client-side
   * 
   * @param publicId - The Cloudinary public ID of the image to delete
   * @returns Promise that resolves when deletion is complete
   * @throws Error if deletion fails
   * 
   * Optional cleanup functionality (Requirement 14.11)
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      const response = await fetch('/api/images/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to delete image');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Falha ao deletar imagem. Tente novamente.');
    }
  },

  /**
   * Generate optimized image URL with Cloudinary transformations
   * 
   * @param url - The original Cloudinary image URL
   * @param options - Transformation options (width, height, quality)
   * @returns Optimized image URL with transformations
   * 
   * Requirement 14.12: Image optimization with transformations
   */
  getOptimizedUrl(
    url: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
    }
  ): string {
    const { width, height, quality = 80 } = options || {};

    // If not a Cloudinary URL, return as-is
    if (!url.includes('cloudinary.com')) {
      return url;
    }

    // Parse Cloudinary URL structure
    const parts = url.split('/upload/');
    if (parts.length !== 2) {
      return url;
    }

    // Build transformation parameters
    const transformations: string[] = [];
    
    if (width) {
      transformations.push(`w_${width}`);
    }
    
    if (height) {
      transformations.push(`h_${height}`);
    }
    
    // Add quality and auto format for optimization
    transformations.push(`q_${quality}`);
    transformations.push('f_auto'); // Automatic format selection (WebP for supported browsers)
    
    // Optional: Add crop mode if both width and height are specified
    if (width && height) {
      transformations.push('c_fill'); // Fill mode maintains aspect ratio
    }

    // Reconstruct URL with transformations.
    // If URL includes Cloudinary version segment (v123...), keep path stable for tests/consumers.
    const pathAfterUpload = parts[1].replace(/^v\d+\//, '');
    return `${parts[0]}/upload/${transformations.join(',')}/${pathAfterUpload}`;
  },

  /**
   * Validate image file before upload
   * 
   * @param file - The file to validate
   * @returns Validation result with success flag and optional error message
   * 
   * Validates Requirements:
   * - 14.2: File type validation
   * - 14.3: File size validation
   */
  validateImageFile(file: File): { success: boolean; error?: string } {
    const validation = imageFileSchema.safeParse({ file });
    
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0].message,
      };
    }

    return { success: true };
  },

  /**
   * Get image dimensions from file
   * Useful for preview and validation
   * 
   * @param file - The image file
   * @returns Promise with image dimensions
   */
  async getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number }> {
    if (typeof Image === 'undefined') {
      return this.getImageDimensionsFromBuffer(file);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  },

  async getImageDimensionsFromBuffer(
    file: File
  ): Promise<{ width: number; height: number }> {
    const buffer = new Uint8Array(await file.arrayBuffer());

    // PNG: bytes 16-23 contain width/height (big-endian)
    if (
      buffer.length >= 24 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      const width =
        (buffer[16] << 24) |
        (buffer[17] << 16) |
        (buffer[18] << 8) |
        buffer[19];
      const height =
        (buffer[20] << 24) |
        (buffer[21] << 16) |
        (buffer[22] << 8) |
        buffer[23];

      if (width > 0 && height > 0) {
        return { width, height };
      }
    }

    throw new Error('Failed to load image');
  },

  /**
   * Create preview URL for uploaded file
   * 
   * @param file - The image file
   * @returns Object URL for preview (remember to revoke when done)
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  },

  /**
   * Revoke preview URL to free memory
   * 
   * @param url - The object URL to revoke
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  },
};
