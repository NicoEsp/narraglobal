import React, { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

interface DossierImageProps {
  filename: string;
  className?: string;
  alt: string;
  decorative?: boolean;
  opacity?: string;
  fallback?: React.ReactNode;
}

const DossierImage: React.FC<DossierImageProps> = ({
  filename,
  className = "",
  alt,
  decorative = true,
  opacity = "opacity-20",
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
          .from("dossier-images")
          .getPublicUrl(filename);
        
        setImageUrl(data.publicUrl);
      } catch (e) {
        console.error(`Error loading dossier image ${filename}:`, e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [filename]);

  if (loading) {
    return <div className={`animate-pulse bg-muted/20 rounded ${className} ${opacity}`} />;
  }

  if (error || !imageUrl) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`object-contain ${className} ${opacity}`}
      onError={() => setError(true)}
      aria-hidden={decorative}
    />
  );
};

export default DossierImage;