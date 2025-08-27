import { Check, Star, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PricingSection = () => {
  const openWhatsApp = () => {
    window.open("https://wa.me/5491130731011?text=Quiero%20saber%20más%20del%20plan%20Reporte%20Mensual", "_blank", "noopener,noreferrer");
  };

  const openProfessionalCalendar = () => {
    window.open("https://calendar.app.google/uZRAFWUtt2A9zGyM7", "_blank");
  };

  const openCorporateCalendar = () => {
    window.open("https://calendar.app.google/a3VFH7YVh7Qkskf48", "_blank");
  };

  const plans = [
    {
      name: "Reporte Mensual",
      description: "Data fresca para mejorar tu narrativa",
      credits: "Los que lideran tu sector",
      features: [
        "Ponemos tu vertical bajo la lupa",
        "Te contamos quiénes lideran la comunicación este mes",
        "Te damos claves para superarlos o sumarte a su lógica"
      ],
      cta: "Quiero",
      action: openWhatsApp,
      popular: false
    },
    {
      name: "Profesional",
      description: "Del dato a tu narrativa estratégica",
      credits: "Reunión estratégica al mes",
      features: [
        "Plan Reporte Mensual",
        "Sesión virtual 1:1 con Lisandro Bregant (Director de Narraglobal)",
        "1 crédito virtual para elegir entre: mentoría personal, taller grupal o análisis de documentos"
      ],
      cta: "Agendar consulta",
      action: openProfessionalCalendar,
      popular: true
    },
    {
      name: "Corporativo",
      description: "Alinear, controlar y blindar tu narrativa",
      credits: "Socio mensual de comunicación",
      features: [
        "Plan Reporte Mensual",
        "Sesión virtual 1:1 con Lisandro Bregant (Director de Narraglobal)",
        "3 créditos virtuales para elegir entre: mentoría personal para líderes, taller grupal para entrenar colaboradores o análisis de documentos/mensajes claves",
        "Roadmap trimestral de la narrativa (hacia dónde va, priorizaciones, riesgos a prevenir)",
        "Línea directa a Lisandro para validar en momentos de crisis o lanzamientos"
      ],
      cta: "Contactar ventas",
      action: openCorporateCalendar,
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-16 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Planes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades de análisis narrativo y comunicacional
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative flex flex-col h-full ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  <Star className="w-3 h-3 mr-1" />
                  Más Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-foreground">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 flex-1">
                <div className="text-center">
                  <Badge variant="outline" className="text-xs">
                    {plan.credits}
                  </Badge>
                </div>
                
                <ul className="space-y-2">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-4 h-4 text-primary mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button 
                  onClick={plan.action}
                  className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            ¿Necesitas algo personalizado? 
            <button 
              onClick={openWhatsApp}
              className="text-primary hover:underline ml-1"
            >
              Contáctanos
            </button>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;