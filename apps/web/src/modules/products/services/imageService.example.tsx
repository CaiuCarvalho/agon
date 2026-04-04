/**
 * Image Service Usage Examples
 * 
 * This file demonstrates how to use the imageService in React components
 * for product image uploads in the admin panel.
 */

import { useState } from 'react';
import { imageService } from './imageService';
import type { ImageUploadResponse } from '../types';

/**
 * Example 1: Basic Image Upload Component
 */
export function BasicImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate before upload
    const validation = imageService.validateImageFile(file);
    if (!validation.success) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const result = await imageService.uploadImage(file);
      setImageUrl(result.url);
      console.log('Upload successful:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {imageUrl && <img src={imageUrl} alt="Uploaded" width={200} />}
    </div>
  );
}

/**
 * Example 2: Image Upload with Progress Tracking
 */
export function ImageUploadWithProgress() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState<string>('');

  const handleUpload = async (file: File) => {
    setUploading(true);
    setProgress(0);

    try {
      const result = await imageService.uploadImage(file, (progress) => {
        setProgress(progress);
      });
      setImageUrl(result.url);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        disabled={uploading}
      />
      {uploading && (
        <div>
          <progress value={progress} max={100} />
          <span>{progress}%</span>
        </div>
      )}
      {imageUrl && <img src={imageUrl} alt="Uploaded" width={200} />}
    </div>
  );
}

/**
 * Example 3: Image Upload with Preview
 */
export function ImageUploadWithPreview() {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (file: File) => {
    // Validate file
    const validation = imageService.validateImageFile(file);
    if (!validation.success) {
      alert(validation.error);
      return;
    }

    // Create preview
    const preview = imageService.createPreviewUrl(file);
    setPreviewUrl(preview);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);

    try {
      const result = await imageService.uploadImage(file);
      setUploadedUrl(result.url);
      
      // Clean up preview URL
      if (previewUrl) {
        imageService.revokePreviewUrl(previewUrl);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
            handleUpload(file);
          }
        }}
        disabled={uploading}
      />
      {previewUrl && !uploadedUrl && (
        <div>
          <p>Preview:</p>
          <img src={previewUrl} alt="Preview" width={200} />
        </div>
      )}
      {uploadedUrl && (
        <div>
          <p>Uploaded:</p>
          <img src={uploadedUrl} alt="Uploaded" width={200} />
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: Optimized Image Display
 */
export function OptimizedImageDisplay({ imageUrl }: { imageUrl: string }) {
  // Generate optimized URLs for different sizes
  const thumbnailUrl = imageService.getOptimizedUrl(imageUrl, {
    width: 200,
    height: 200,
    quality: 80,
  });

  const mediumUrl = imageService.getOptimizedUrl(imageUrl, {
    width: 800,
    height: 600,
    quality: 85,
  });

  const largeUrl = imageService.getOptimizedUrl(imageUrl, {
    width: 1920,
    height: 1080,
    quality: 90,
  });

  return (
    <div>
      <h3>Thumbnail</h3>
      <img src={thumbnailUrl} alt="Thumbnail" width={200} />

      <h3>Medium</h3>
      <img src={mediumUrl} alt="Medium" width={800} />

      <h3>Large</h3>
      <img src={largeUrl} alt="Large" width={1920} />
    </div>
  );
}

/**
 * Example 5: Product Form with Image Upload
 */
export function ProductFormWithImageUpload() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageUpload = async (file: File) => {
    // Validate
    const validation = imageService.validateImageFile(file);
    if (!validation.success) {
      alert(validation.error);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await imageService.uploadImage(file, (progress) => {
        setUploadProgress(progress);
      });

      // Update form data with uploaded image URL
      setFormData((prev) => ({
        ...prev,
        imageUrl: result.url,
      }));

      console.log('Image uploaded:', result);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imageUrl) {
      alert('Please upload an image');
      return;
    }

    // Submit product form with imageUrl
    console.log('Submitting product:', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          required
        />
      </div>

      <div>
        <label>Description:</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          required
        />
      </div>

      <div>
        <label>Price:</label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))
          }
          required
        />
      </div>

      <div>
        <label>Image:</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
          disabled={uploading}
        />
        {uploading && (
          <div>
            <progress value={uploadProgress} max={100} />
            <span>{uploadProgress}%</span>
          </div>
        )}
        {formData.imageUrl && (
          <img
            src={imageService.getOptimizedUrl(formData.imageUrl, {
              width: 200,
              height: 200,
            })}
            alt="Product preview"
            width={200}
          />
        )}
      </div>

      <button type="submit" disabled={uploading || !formData.imageUrl}>
        Create Product
      </button>
    </form>
  );
}

/**
 * Example 6: Image Dimensions Validation
 */
export function ImageUploadWithDimensionCheck() {
  const [error, setError] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    try {
      // Get image dimensions
      const dimensions = await imageService.getImageDimensions(file);

      // Validate dimensions (example: min 800x600)
      if (dimensions.width < 800 || dimensions.height < 600) {
        setError(
          `Image too small. Minimum size is 800x600px. Your image is ${dimensions.width}x${dimensions.height}px.`
        );
        return;
      }

      // Proceed with upload
      const result = await imageService.uploadImage(file);
      console.log('Upload successful:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
