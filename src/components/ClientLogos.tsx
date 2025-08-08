
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
            .filter((f) => /\.(png|jpe?g|svg|webp|gif)$/i.test(f.name));

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
          className="w-32 h-20 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300"
        >
          <span className="text-slate-400 text-sm">Logo {i + 1}</span>
        </div>
      ))}
    </>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
      {loading && <PlaceholderGrid />}
      
      {!loading &&
        logos.length > 0 &&
        logos.map((logo) => (
          <div
            key={logo.name}
            className="w-32 h-20 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm p-2"
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
