import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Users, Building2, Zap, ExternalLink, Calendar, Check, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSupabase } from "@/lib/supabaseClient";
import ClientLogos from "@/components/ClientLogos";
const Index = () => {
  // Form for political section
  const [politicalFormData, setPoliticalFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    hp: ''
  });

  // Form for industry subscription
  const [industryFormData, setIndustryFormData] = useState({
    email: '',
    hp: ''
  });
  const {
    toast
  } = useToast();
  const [savingPolitical, setSavingPolitical] = useState(false);
  const [savingIndustry, setSavingIndustry] = useState(false);

  // Supabase setup verification (non-mutating)
  useEffect(() => {
    const run = async () => {
      try {
        const supabase = getSupabase();
        const check = async (table: string) => {
          const {
            error
          } = await supabase.from(table).select('*', {
            head: true,
            count: 'exact'
          });
          if (!error) return {
            table,
            status: 'exists_select_allowed' as const
          };
          const text = `${(error as any).code ?? ''} ${(error as any).message ?? ''}`.toLowerCase();
          if (text.includes('not found') || text.includes('does not exist') || text.includes('42p01')) {
            return {
              table,
              status: 'missing' as const,
              error
            };
          }
          if (text.includes('permission') || text.includes('select') || text.includes('anonymous') || text.includes('rls')) {
            return {
              table,
              status: 'exists_select_forbidden' as const,
              error
            };
          }
          return {
            table,
            status: 'unknown' as const,
            error
          };
        };
        const results = await Promise.all([check('political_contacts'), check('industry_subscriptions')]);
        console.groupCollapsed('[Supabase] Verificación de tablas');
        (results as any[]).forEach((r: any) => {
          console.log(`${r.table}: ${r.status}`, r.error ? {
            code: r.error.code,
            message: r.error.message
          } : '');
        });
        console.groupEnd();
      } catch (e) {
        console.error('[Supabase] Verificación fallida', e);
      }
    };
    run();
  }, []);
  const handlePoliticalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value
    } = e.target;
    setPoliticalFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleIndustryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value
    } = e.target;
    setIndustryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handlePoliticalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPolitical(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.rpc('submit_political_contact', {
        _name: politicalFormData.name,
        _email: politicalFormData.email,
        _phone: politicalFormData.phone,
        _organization: politicalFormData.organization,
        _source: 'web',
        _honeypot: politicalFormData.hp || null,
      });
      if (error) {
        if ((error as any).code === 'P0001') {
          throw new Error((error as any).message || 'Validación fallida');
        }
        throw error;
      }
      toast({
        title: "Solicitud enviada",
        description: "Te contactaremos pronto para coordinar una call."
      });
      setPoliticalFormData({
        name: '',
        email: '',
        phone: '',
        organization: '',
        hp: '',
      });
    } catch (err: any) {
      console.error('Political form error:', err);
      toast({
        title: "No se pudo enviar",
        description: err?.message || "Intentalo nuevamente en unos minutos.",
        variant: "destructive"
      } as any);
    } finally {
      setSavingPolitical(false);
    }
  };
  const handleIndustrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingIndustry(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.rpc('submit_industry_subscription', {
        _email: industryFormData.email,
        _source: 'web',
        _honeypot: industryFormData.hp || null,
      });
      if (error) {
        if ((error as any).code === '23505') {
          toast({
            title: "Ya estás suscripto",
            description: "Ese email ya está en nuestra lista."
          });
        } else if ((error as any).code === 'P0001') {
          throw new Error((error as any).message || 'Validación fallida');
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Suscripción confirmada",
          description: "Serás el primero en conocer nuestros reportes de industria."
        });
        setIndustryFormData({ email: '', hp: '' });
      }
    } catch (err: any) {
      console.error('Industry subscription error:', err);
      toast({
        title: "No se pudo suscribir",
        description: err?.message || "Intentalo nuevamente en unos minutos.",
        variant: "destructive"
      } as any);
    } finally {
      setSavingIndustry(false);
    }
  };
  const openCalendly = () => {
    window.open('https://calendly.com/narraglobal', '_blank');
  };
  const openSubstack = () => {
    window.open('https://drive.google.com/file/d/1ZINMjFAW6WQucYvk25ek1hcrXAY8_2YS/view', '_blank', 'noopener,noreferrer');
  };
  const openEmergencyWhatsApp = () => {
    window.open('https://wa.link/zslnkf', '_blank', 'noopener,noreferrer');
  };
  return <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="https://aydtxqhtkcyytsamervs.supabase.co/storage/v1/object/public/client-logos/id_simpleazul.png" alt="NarraGlobal logo" className="h-8 md:h-10 w-auto" loading="eager" decoding="async" />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#clientes" className="text-slate-700 hover:text-primary transition-colors">Clientes</a>
              <a href="#politica" className="text-slate-700 hover:text-primary transition-colors">Política</a>
              <a href="#industrias" className="text-slate-700 hover:text-primary transition-colors">Newsletter</a>
              <a href="#pricing" className="text-slate-700 hover:text-primary transition-colors">Planes</a>
              <a href="#emergencia" className="text-slate-700 hover:text-primary transition-colors">Emergencia</a>
              <Button onClick={openSubstack}>
                Reportes
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="md:hidden">
              <Button onClick={openSubstack} aria-label="Abrir Reportes">
                Reportes
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Menos ruido. Más impacto */}
       <section className="pt-20 pb-32 bg-gradient-to-br from-slate-50 to-[hsl(var(--primary)/0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-8 leading-tight">
              Menos ruido.
              <span className="text-primary block">Más impacto</span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Detectamos y limpiamos el ruido que hay actualmente en su narrativa pública para que sus mensajes lleguen claros y confiables al cerebro de sus audiencias.
            </p>
          </div>
        </div>
      </section>

      {/* Clientes Section */}
      <section id="clientes" className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Clientes</h2>
            <p className="text-xl text-primary-foreground/80">Acompañamos a estos clientes en su Comunicación y sus Narrativas</p>
          </div>

          {/* Logos desde Supabase Storage */}
          <ClientLogos />
        </div>
      </section>

      {/* Menos ruido en política Section */}
      <section id="politica" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center justify-center w-20 h-20 bg-[hsl(var(--primary)/0.1)] rounded-lg mb-6">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Menos ruido en Política</h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">Con nuestros reportes basados en evidencia ayudamos a bajar errores no forzados de comunicación en candidatos, intendentes, gobernadores y presidentes de toda latinoamérica.</p>
              <p className="text-lg text-slate-700 font-medium">Completá los datos y en una call breve te contaremos cómo podemos colaborar</p>
            </div>
            
            <div>
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">Contacto político</h3>
                  <form onSubmit={handlePoliticalSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="political-name" className="text-slate-700">Nombre completo</Label>
                      <Input id="political-name" name="name" value={politicalFormData.name} onChange={handlePoliticalChange} className="mt-1" required />
                    </div>
                    
                    <div>
                      <Label htmlFor="political-email" className="text-slate-700">Email</Label>
                      <Input id="political-email" name="email" type="email" value={politicalFormData.email} onChange={handlePoliticalChange} className="mt-1" required />
                    </div>
                    
                    <div>
                      <Label htmlFor="political-phone" className="text-slate-700">Teléfono</Label>
                      <Input id="political-phone" name="phone" value={politicalFormData.phone} onChange={handlePoliticalChange} className="mt-1" required />
                    </div>

                    <div>
                      <Label htmlFor="political-organization" className="text-slate-700">Organización</Label>
                      <Input id="political-organization" name="organization" value={politicalFormData.organization} onChange={handlePoliticalChange} className="mt-1" required />
                    </div>
                    
                    {/* Honeypot anti-bot */}
                    <input
                      type="text"
                      name="hp"
                      value={politicalFormData.hp}
                      onChange={handlePoliticalChange}
                      className="hidden"
                      autoComplete="off"
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    
                    <Button type="submit" disabled={savingPolitical} className="w-full py-3">{savingPolitical ? 'Enviando…' : 'Solicitar llamada'}</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Más impacto en industrias Section */}
      <section id="industrias" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-lg mb-6 mx-auto">
              <Building2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-6">Más impacto en Industrias</h2>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              Medimos la calidad narrativa en industrias competitivas como agro, ciencia, minería, fintech, 
              entretenimiento, deportes de alto rendimiento, juicio por jurados, y más.
            </p>
            <p className="text-base sm:text-lg text-slate-700 mt-6 font-medium max-w-2xl mx-auto px-4 text-center">
              Suscribite para ser el primero en conocer quiénes son las empresas, campañas y figuras públicas 
              que generan más impacto en su vertical.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">Suscripción a Reportes de Industria</h3>
                <form onSubmit={handleIndustrySubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="industry-email" className="text-slate-700">Email</Label>
                    <Input id="industry-email" name="email" type="email" value={industryFormData.email} onChange={handleIndustryChange} className="mt-1" placeholder="tu@email.com" required />
                  </div>
                  
                  {/* Honeypot anti-bot */}
                  <input
                    type="text"
                    name="hp"
                    value={industryFormData.hp}
                    onChange={handleIndustryChange}
                    className="hidden"
                    autoComplete="off"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                  
                  <Button type="submit" disabled={savingIndustry} className="w-full bg-green-600 hover:bg-green-700 text-white py-3">{savingIndustry ? 'Enviando…' : 'Suscribirme'}</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Planes y Precios</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Elige el plan que mejor se adapte a tus necesidades de análisis narrativo y comunicación
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plan Reporte */}
            <Card className="border-0 shadow-xl bg-white relative">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Reporte</h3>
                  <div className="text-4xl font-bold text-primary mb-2">$99</div>
                  <div className="text-slate-600">por mes</div>
                </div>
                
                <div className="mb-6">
                  <div className="text-center text-slate-700 font-medium mb-4">10 análisis mensuales</div>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Reportes básicos de narrativa</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Análisis de ruido comunicacional</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Dashboard básico</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Soporte por email</span>
                  </li>
                </ul>

                <Button className="w-full" variant="outline">
                  Comenzar
                </Button>
              </CardContent>
            </Card>

            {/* Plan Profesional */}
            <Card className="border-0 shadow-xl bg-white relative border-2 border-primary">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  Más Popular
                </div>
              </div>
              
              <CardContent className="p-8 pt-12">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Profesional</h3>
                  <div className="text-4xl font-bold text-primary mb-2">$299</div>
                  <div className="text-slate-600">por mes</div>
                </div>
                
                <div className="mb-6">
                  <div className="text-center text-slate-700 font-medium mb-4">50 análisis mensuales</div>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Todo lo del Plan Reporte</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Análisis político avanzado</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Reportes de industria personalizados</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Consultoría mensual (2 horas)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Soporte prioritario</span>
                  </li>
                </ul>

                <Button className="w-full">
                  Comenzar
                </Button>
              </CardContent>
            </Card>

            {/* Plan Corporativo */}
            <Card className="border-0 shadow-xl bg-white relative">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Corporativo</h3>
                  <div className="text-4xl font-bold text-primary mb-2">$899</div>
                  <div className="text-slate-600">por mes</div>
                </div>
                
                <div className="mb-6">
                  <div className="text-center text-slate-700 font-medium mb-4">Análisis ilimitados</div>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Todo lo del Plan Profesional</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Método NarraNoise completo</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Triage de crisis incluido</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Consultoría semanal dedicada</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Acceso directo a Lisandro Bregant</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">SLA garantizado</span>
                  </li>
                </ul>

                <Button className="w-full" variant="outline">
                  Contactar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Emergency Section */}
      <section id="emergencia" className="py-20 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-lg mb-8 mx-auto">
            <Zap className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            "No hay tiempo. El Presidente quiere verte el sábado"
          </h2>
          <p className="text-xl text-slate-600 mb-12 leading-relaxed">Tenemos un método de triage para situaciones de alta complejidad pública.
        </p>
          
          <Button onClick={openEmergencyWhatsApp} size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg">
            <Calendar className="mr-2 h-5 w-5" />
            Agendar reunión de emergencia
          </Button>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">NarraGlobal</h3>
              <p className="text-slate-300 leading-relaxed">Consultoría especializada en Comunicación y Narrativa. Detectamos y limpiamos el ruido en su narrativa pública para que sus mensajes lleguen claros y confiables.</p>
              <p className="text-slate-400 mt-4">Por Lisandro Bregant</p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2 text-slate-300">
                <li>Método NarraNoise</li>
                <li>Comunicación política</li>
                <li>Análisis de industrias</li>
                <li>Triage de crisis</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-12 pt-8 text-center text-slate-400">
            <p>© 2025 NarraGlobal. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;