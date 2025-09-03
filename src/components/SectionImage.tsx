import React, { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

interface SectionImageProps {
  filename: string;
  className?: string;
  alt: string;
  fallback?: React.ReactNode;
}

const SectionImage: React.FC<SectionImageProps> = ({
  filename,
  className = "",
  alt,
  fallback
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const supabase = getSupabase();
        const { data } = supabase.storage
          .from("client-logos")
          .getPublicUrl(filename);
        
        setImageUrl(data.publicUrl);
      } catch (e) {
        console.error(`Error loading image ${filename}:`, e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [filename]);

  if (loading) {
    return <div className={`animate-pulse bg-muted rounded ${className}`} />;
  }

  if (error || !imageUrl) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`object-contain ${className}`}
      onError={() => setError(true)}
    />
  );
};

export default SectionImage;