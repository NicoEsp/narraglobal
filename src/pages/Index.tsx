import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Users, Building2, Zap, ExternalLink, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  // Form for political section
  const [politicalFormData, setPoliticalFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: ''
  });

  // Form for industry subscription
  const [industryFormData, setIndustryFormData] = useState({
    email: ''
  });

  const { toast } = useToast();

  const handlePoliticalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPoliticalFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleIndustryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setIndustryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePoliticalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Political form submitted:', politicalFormData);
    toast({
      title: "Solicitud enviada",
      description: "Te contactaremos pronto para coordinar una call."
    });
    setPoliticalFormData({
      name: '',
      email: '',
      phone: '',
      organization: ''
    });
  };

  const handleIndustrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Industry subscription submitted:', industryFormData);
    toast({
      title: "Suscripción confirmada",
      description: "Serás el primero en conocer nuestros reportes de industria."
    });
    setIndustryFormData({
      email: ''
    });
  };

  const openCalendly = () => {
    window.open('https://calendly.com/narraglobal', '_blank');
  };

  const openSubstack = () => {
    window.open('https://lisandrobregant.substack.com/', '_blank');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-slate-900">NarraGlobal</h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#clientes" className="text-slate-700 hover:text-blue-600 transition-colors">Clientes</a>
              <a href="#politica" className="text-slate-700 hover:text-blue-600 transition-colors">Política</a>
              <a href="#industrias" className="text-slate-700 hover:text-blue-600 transition-colors">Industrias</a>
              <a href="#emergencia" className="text-slate-700 hover:text-blue-600 transition-colors">Emergencia</a>
              <Button 
                onClick={openSubstack}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Reportes
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Menos ruido. Más impacto */}
      <section className="pt-20 pb-32 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-8 leading-tight">
              Menos ruido.
              <span className="text-blue-600 block">Más impacto</span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Con nuestro método NarraNoise detectamos y limpiamos el ruido que hay actualmente en su narrativa pública. 
              Ayudando a que sus mensajes lleguen claros y confiables al cerebro de sus audiencias. 
              Ah, y también le ayudamos a dejar de invertir tiempo y dinero en comunicación basura.
            </p>
          </div>
        </div>
      </section>

      {/* Clientes Section */}
      <section id="clientes" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Clientes</h2>
            <p className="text-xl text-slate-600">Testimoniales</p>
          </div>
          
          {/* Imagen de clientes / testimoniales */}
          <div className="max-w-4xl mx-auto">
            <img
              src="/lovable-uploads/81d0c622-2277-4a73-bec8-0eda27dde7f7.png"
              alt="Clientes de NarraGlobal – testimoniales y logos de empresas"
              loading="lazy"
              className="w-full h-auto rounded-lg shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Menos ruido en política Section */}
      <section id="politica" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-lg mb-6">
                <Shield className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Menos ruido en política</h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Ayudamos con nuestros reportes basados en evidencia a bajar los errores no forzados de comunicación 
                en candidatos, intendentes, gobernadores y presidentes de toda latinoamérica.
              </p>
              <p className="text-lg text-slate-700 font-medium">
                Completá los datos y en una call breve te contaremos nuestros planes de trabajo
              </p>
            </div>
            
            <div>
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">Contacto político</h3>
                  <form onSubmit={handlePoliticalSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="political-name" className="text-slate-700">Nombre completo</Label>
                      <Input 
                        id="political-name" 
                        name="name" 
                        value={politicalFormData.name} 
                        onChange={handlePoliticalChange} 
                        className="mt-1" 
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="political-email" className="text-slate-700">Email</Label>
                      <Input 
                        id="political-email" 
                        name="email" 
                        type="email" 
                        value={politicalFormData.email} 
                        onChange={handlePoliticalChange} 
                        className="mt-1" 
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="political-phone" className="text-slate-700">Teléfono</Label>
                      <Input 
                        id="political-phone" 
                        name="phone" 
                        value={politicalFormData.phone} 
                        onChange={handlePoliticalChange} 
                        className="mt-1" 
                        required 
                      />
                    </div>

                    <div>
                      <Label htmlFor="political-organization" className="text-slate-700">Organización</Label>
                      <Input 
                        id="political-organization" 
                        name="organization" 
                        value={politicalFormData.organization} 
                        onChange={handlePoliticalChange} 
                        className="mt-1" 
                        required 
                      />
                    </div>
                    
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3">
                      Solicitar call
                    </Button>
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
            <h2 className="text-4xl font-bold text-slate-900 mb-6">Más impacto en industrias</h2>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              Medimos la calidad narrativa en industrias competitivas como agro, ciencia, minería, fintech, 
              entretenimiento, deportes de alto rendimiento, juicio por jurados, y más.
            </p>
            <p className="text-lg text-slate-700 mt-6 font-medium">
              Suscribite para ser el primero en conocer quiénes son las empresas, campañas y figuras públicas 
              que generan más impacto en su vertical.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">Suscripción a reportes de industria</h3>
                <form onSubmit={handleIndustrySubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="industry-email" className="text-slate-700">Email</Label>
                    <Input 
                      id="industry-email" 
                      name="email" 
                      type="email" 
                      value={industryFormData.email} 
                      onChange={handleIndustryChange} 
                      className="mt-1" 
                      placeholder="tu@email.com"
                      required 
                    />
                  </div>
                  
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3">
                    Suscribirme
                  </Button>
                </form>
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
          <p className="text-xl text-slate-600 mb-12 leading-relaxed">
            Tenemos un método de triage para situaciones de alta complejidad pública.
          </p>
          
          <Button 
            onClick={openCalendly}
            size="lg" 
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg"
          >
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
              <p className="text-slate-300 leading-relaxed">
                Consultoría especializada en comunicación y narrativa. Detectamos y limpiamos el ruido 
                en su narrativa pública para que sus mensajes lleguen claros y confiables.
              </p>
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
    </div>
  );
};

export default Index;