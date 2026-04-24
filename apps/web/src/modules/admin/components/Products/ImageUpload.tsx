'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ImageUploadProps {
  imageUrl: string;
  onChange: (url: string) => void;
  onUploadStateChange?: (hasError: boolean) => void;
}

const BUCKET = 'product-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB — matches storage bucket policy

export function ImageUpload({ imageUrl, onChange, onUploadStateChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const setError = (msg: string | null) => {
    setUploadError(msg);
    onUploadStateChange?.(msg !== null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('File must be at most 5 MB');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false });

      if (uploadErr) throw new Error(uploadErr.message);

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(urlData.publicUrl);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange('');
    setError(null);
  };

  return (
    <div className="space-y-3">
      {imageUrl && (
        <div className="relative group inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Product image"
            className="w-32 h-32 object-cover rounded border"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove image"
          >
            ×
          </button>
        </div>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          id="image-file-input"
        />
        <label
          htmlFor="image-file-input"
          className={`inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-400 rounded-lg cursor-pointer text-sm text-gray-600 hover:bg-gray-50 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? 'Uploading...' : imageUrl ? 'Change image' : 'Upload image'}
        </label>
        {uploadError && (
          <p className="text-xs text-red-600 mt-1">{uploadError}</p>
        )}
      </div>

      {imageUrl && (
        <p className="text-xs text-gray-400 truncate max-w-xs" title={imageUrl}>
          {imageUrl}
        </p>
      )}
    </div>
  );
}
