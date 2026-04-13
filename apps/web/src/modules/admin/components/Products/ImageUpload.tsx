'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ImageUploadProps {
  /** Current list of image URLs */
  images: string[];
  onChange: (images: string[]) => void;
}

const BUCKET = 'product-images';

/**
 * Handles both file upload (Supabase Storage) and manual URL entry.
 * Uploaded files are stored in the `product-images` bucket.
 */
export function ImageUpload({ images, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    try {
      const supabase = createClient();
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: false });

        if (uploadErr) throw new Error(uploadErr.message);

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      onChange([...images, ...uploadedUrls]);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset input so same file can be selected again
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const urls = e.target.value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    onChange(urls);
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Product image ${i + 1}`}
                className="w-20 h-20 object-cover rounded border"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File upload */}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id="image-file-input"
        />
        <label
          htmlFor="image-file-input"
          className={`inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-400 rounded-lg cursor-pointer text-sm text-gray-600 hover:bg-gray-50 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? 'Uploading...' : 'Upload images'}
        </label>
        {uploadError && (
          <p className="text-xs text-red-600 mt-1">{uploadError}</p>
        )}
      </div>

      {/* Manual URL fallback */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Or paste URLs (comma-separated)
        </label>
        <input
          type="text"
          value={images.join(', ')}
          onChange={handleUrlChange}
          className="w-full px-3 py-2 border rounded-lg text-sm"
          placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
        />
      </div>
    </div>
  );
}
