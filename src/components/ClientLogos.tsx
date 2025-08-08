
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
        console.groupCollapsed("[Storage] Listando logos de clientes");
        const { data, error } = await supabase.storage.from("client-logos").list("", {
          limit: 200,
          sortBy: { column: "name", order: "asc" },
        });
        if (error) throw error;

        const files = (data ?? []).filter((f) => !f.name.startsWith("."));
        const urls: Logo[] = files.map((f) => {
          const { data: urlData } = supabase.storage
            .from("client-logos")
            .getPublicUrl(f.name);
          return { name: f.name, url: urlData.publicUrl };
        });

        console.log(`Encontrados ${urls.length} logos`);
        setLogos(urls);
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
      {Array.from({ length: 12 }).map((_, i) => (
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
      {!loading && logos.length === 0 && <PlaceholderGrid />}
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
