
import React, { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

type Logo = {
  name: string;
  url: string;
};

const formatAlt = (name: string) =>
  name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();

const ClientLogos: React.FC = () => {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabase();
      try {
        console.groupCollapsed("[Storage] Cargando logos de clientes");
        const BUCKETS = ["client-logo", "client-logos"] as const;
        let selectedBucket: string | null = null;
        let files: { name: string }[] = [];

        for (const bucket of BUCKETS) {
          const { data, error } = await supabase.storage.from(bucket).list("", {
            limit: 200,
            sortBy: { column: "name", order: "asc" },
          });
          if (error) {
            console.warn(`Error listando bucket ${bucket}:`, error);
            continue;
          }

          const candidates = (data ?? [])
            .filter((f) => !f.name.startsWith("."))
            .filter((f) => /\.(png|jpe?g|svg|webp|gif)$/i.test(f.name))
            .filter((f) => !["Copia de 20.png", "Copia de 23.png", "Copia de 26.png"].includes(f.name));

          if (candidates.length > 0) {
            selectedBucket = bucket;
            files = candidates;
            break;
          }
        }

        if (!selectedBucket) {
          console.warn("No se encontraron logos en ninguno de los buckets:", BUCKETS);
          setLogos([]);
        } else {
          const urls: Logo[] = files.map((f) => {
            const { data: urlData } = supabase.storage
              .from(selectedBucket!)
              .getPublicUrl(f.name);
            return { name: f.name, url: urlData.publicUrl };
          });

          console.log(`Bucket seleccionado: ${selectedBucket}. Logos encontrados: ${urls.length}`);
          setLogos(urls);
        }
      } catch (e) {
        console.error("No se pudieron cargar los logos:", e);
        setLogos([]);
      } finally {
        setLoading(false);
        console.groupEnd();
      }
    };

    load();
  }, []);

  const PlaceholderGrid = () => (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="w-44 h-32 sm:w-52 sm:h-36 md:w-56 md:h-40 rounded-lg flex items-center justify-center border-2 border-dashed border-border bg-muted/30"
        >
          <span className="text-muted-foreground text-sm">Logo {i + 1}</span>
        </div>
      ))}
    </>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 sm:gap-x-6 sm:gap-y-3 md:gap-x-8 md:gap-y-4 items-center justify-items-center">
      {loading && <PlaceholderGrid />}
      
      {!loading &&
        logos.length > 0 &&
        logos.slice(0, 8).map((logo) => (
          <div
            key={logo.name}
            className="w-44 h-32 sm:w-52 sm:h-36 md:w-56 md:h-40 rounded-lg flex items-center justify-center border border-border bg-muted/30 shadow-sm p-3 sm:p-4"
            title={formatAlt(logo.name)}
          >
            <img
              src={logo.url}
              alt={formatAlt(logo.name)}
              className="max-w-full max-h-full object-contain"
              loading="lazy"
            />
          </div>
        ))}
    </div>
  );
};

export default ClientLogos;
