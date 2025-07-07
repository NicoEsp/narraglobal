import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BarChart3, Eye, Shield, TrendingUp, Mail, Phone, MapPin, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });

  const [reportFormData, setReportFormData] = useState({
    name: '',
    email: '',
    company: '',
    interest: '',
    message: ''
  });

  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReportInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReportFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    toast({
      title: "Mensaje enviado",
      description: "Nos pondremos en contacto contigo pronto."
    });
    setFormData({
      name: '',
      email: '',
      company: '',
      message: ''
    });
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Report form submitted:', reportFormData);
    toast({
      title: "Suscripción confirmada",
      description: "Te notificaremos cuando los reportes estén disponibles."
    });
    setReportFormData({
      name: '',
      email: '',
      company: '',
      interest: '',
      message: ''
    });
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
            <div className="hidden md:flex space-x-8">
              <a href="#servicios" className="text-slate-700 hover:text-blue-600 transition-colors">Servicios</a>
              <a href="#metodologia" className="text-slate-700 hover:text-blue-600 transition-colors">Metodología</a>
              <a href="#reportes" className="text-slate-700 hover:text-blue-600 transition-colors">Reportes</a>
              <a href="#temporada" className="text-slate-700 hover:text-blue-600 transition-colors">Temporada</a>
              <a href="#contacto" className="text-slate-700 hover:text-blue-600 transition-colors">Contacto</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Datos para decisores de
              <span className="text-blue-600 block">comunicación</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Consultoría especializada en comunicación y narrativa. Transformamos datos en insights estratégicos 
              para optimizar tu comunicación corporativa y política.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                Conocer servicios
              </Button>
              <Button variant="outline" size="lg" className="border-slate-300 text-slate-700 px-8 py-3 text-lg">
                Ver metodología
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">2019</div>
              <p className="text-slate-600">Perfeccionando nuestra metodología para ofrecer el mejor servicio</p>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">+100</div>
              <p className="text-slate-600">Clientes validados</p>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">3</div>
              <p className="text-slate-600">Familias de marcadores utilizados en nuestros metodos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Nuestros servicios</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Ofrecemos soluciones integrales para optimizar tu estrategia de comunicación
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Monitoreo */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-6">
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Monitoreamos por vos</h3>
                <p className="text-slate-600 leading-relaxed">
                  Todos nuestros informes tienen un resumen de las narrativas instaladas en tu vertical de trabajo 
                  y en tu organización. Te ahorramos tiempo y costo cognitivo en vos y en tus colaboradores.
                </p>
              </CardContent>
            </Card>

            {/* Análisis */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mb-6">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Análisis narrativo basado en evidencias</h3>
                <p className="text-slate-600 leading-relaxed">Desde el 2019 perfeccionamos una metodología para la medición de efectividad en narrativas basadas en tres familias de marcadores: Atención, Credibilidad e Interés.
Validada en más +100 clientes de verticales como Ciencia, Agro, Fintech, Streaming y Política, entre otros.</p>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-lg mb-6">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Insights profundos para decisores</h3>
                <p className="text-slate-600 leading-relaxed">Nuestros informes están pensados para los que deciden el rumbo de la comunicación pública en organizaciones y negocios. Entregamos lecturas expertas sobre las narrativas que están operando, ayudando a bajar el riesgo de esas decisiones.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Metodología Section */}
      <section id="metodologia" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Nuestra metodología</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Tres familias de marcadores para medir la efectividad narrativa
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Atención</h3>
              <p className="text-slate-600">Medimos el nivel de atención que generan tus narrativas en tu audiencia objetivo</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Credibilidad</h3>
              <p className="text-slate-600">Evaluamos la credibilidad y confianza que transmiten tus mensajes</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Interés</h3>
              <p className="text-slate-600">Analizamos el nivel de interés y engagement que generan tus comunicaciones</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reportes Section */}
      <section id="reportes" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Reportes especializados</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Próximamente publicaremos reportes especializados sobre comunicación y narrativas en diferentes sectores
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-lg mb-6">
                <FileText className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Reportes en desarrollo</h3>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Estamos preparando reportes detallados sobre tendencias narrativas, análisis sectoriales y mejores prácticas en comunicación. Suscríbete para ser el primero en recibir estos insights exclusivos.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <p className="text-slate-600">Análisis de tendencias narrativas por sector</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <p className="text-slate-600">Estudios de efectividad comunicacional</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <p className="text-slate-600">Mejores prácticas y casos de éxito</p>
                </div>
              </div>
            </div>
            
            <div>
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">Suscríbete a nuestros reportes</h3>
                  <form onSubmit={handleReportSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="report-name" className="text-slate-700">Nombre completo</Label>
                      <Input 
                        id="report-name" 
                        name="name" 
                        value={reportFormData.name} 
                        onChange={handleReportInputChange} 
                        className="mt-1" 
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="report-email" className="text-slate-700">Email</Label>
                      <Input 
                        id="report-email" 
                        name="email" 
                        type="email" 
                        value={reportFormData.email} 
                        onChange={handleReportInputChange} 
                        className="mt-1" 
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="report-company" className="text-slate-700">Empresa u organización</Label>
                      <Input 
                        id="report-company" 
                        name="company" 
                        value={reportFormData.company} 
                        onChange={handleReportInputChange} 
                        className="mt-1" 
                        required 
                      />
                    </div>

                    <div>
                      <Label htmlFor="report-interest" className="text-slate-700">Área de interés</Label>
                      <Input 
                        id="report-interest" 
                        name="interest" 
                        value={reportFormData.interest} 
                        onChange={handleReportInputChange} 
                        className="mt-1" 
                        placeholder="Ej: Fintech, Política, Ciencia, etc."
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="report-message" className="text-slate-700">Mensaje (opcional)</Label>
                      <Textarea 
                        id="report-message" 
                        name="message" 
                        value={reportFormData.message} 
                        onChange={handleReportInputChange} 
                        rows={4} 
                        className="mt-1" 
                        placeholder="¿Hay algún tema específico que te interese?"
                      />
                    </div>
                    
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3">
                      Suscribirme a reportes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Temporada Section */}
      <section id="temporada" className="py-20 bg-gradient-to-br from-blue-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Temporada</h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">c para el monitoreo continuo de calidad e impacto de la comunicación de tu empresa o persona política. Un acompañamiento estratégico que te permite tomar decisiones informadas en tiempo real.</p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <p className="text-slate-600">Monitoreo continuo de narrativas</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <p className="text-slate-600">Reportes periódicos personalizados</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <p className="text-slate-600">Alertas en tiempo real</p>
                </div>
              </div>
            </div>
            
            <div>
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">Solicitar información sobre Temporada</h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-slate-700">Nombre completo</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="mt-1" required />
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="text-slate-700">Email corporativo</Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} className="mt-1" required />
                    </div>
                    
                    <div>
                      <Label htmlFor="company" className="text-slate-700">Empresa u organización</Label>
                      <Input id="company" name="company" value={formData.company} onChange={handleInputChange} className="mt-1" required />
                    </div>
                    
                    <div>
                      <Label htmlFor="message" className="text-slate-700">Mensaje</Label>
                      <Textarea id="message" name="message" value={formData.message} onChange={handleInputChange} rows={4} className="mt-1" placeholder="Cuéntanos sobre tus necesidades de comunicación..." />
                    </div>
                    
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3">
                      Enviar solicitud
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">NarraGlobal</h3>
              <p className="text-slate-300 leading-relaxed">Consultoría especializada en comunicación y narrativa. Datos para decisores de comunicación.
Por Lisandro Bregant</p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2 text-slate-300">
                <li>Monitoreo de narrativas</li>
                <li>Análisis basado en evidencias</li>
                <li>Insights estratégicos</li>
                <li>Temporada - Servicio continuo</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contacto</h4>
              <div className="space-y-3 text-slate-300">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5" />
                  <span>contacto@narraglobal.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5" />
                  <span>+54 11 1234-5678</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5" />
                  <span>Buenos Aires, Argentina</span>
                </div>
              </div>
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
