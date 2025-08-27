import { Check, Star, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PricingSection = () => {
  const openCalendly = () => {
    window.open("https://calendly.com/lisandro-bregant/30min", "_blank");
  };

  const openContactForm = () => {
    const element = document.getElementById("politica");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const plans = [
    {
      name: "Reporte",
      description: "Insights de tu vertical directo a tu cerebro",
      credits: "Reporte Top 5 mensual",
      features: [
        "Reporte mensual de las 5 empresas que mejor comunicaron en tu vertical",
        "Análisis de cómo copiar sus recursos o diferenciarte",
        "Envío de PDF 'Top 5' con recomendaciones",
        "Recomendaciones basadas en evidencia",
        "Listas para aplicar en tu empresa-marca"
      ],
      cta: "Comenzar",
      action: openContactForm,
      popular: false
    },
    {
      name: "Profesional",
      description: "Del insight al cambio narrativo en pocos minutos",
      credits: "Plan Reporte + Consultoría",
      features: [
        "Todo el Plan Reporte",
        "1 videollamada de 60min con Lisandro Bregant",
        "Estrategia y ordenamiento narrativo",
        "1 crédito a elección al mes:",
        "• Análisis de documentos, o",
        "• Encuentro de mentoría personal, o",
        "• Taller grupal"
      ],
      cta: "Agendar consulta",
      action: openCalendly,
      popular: true
    },
    {
      name: "Corporativo",
      description: "Menos ruptura, más lealtad",
      credits: "Plan Completo",
      features: [
        "Todo el Plan Reporte",
        "1 videollamada estratégica de 60min con Lisandro",
        "Plan de acción rápido basado en desafío organizacional",
        "3 créditos a elección en el mes:",
        "• 3 Talleres grupales, o",
        "• 3 Mentorías personales (virtuales), o",
        "• 3 Análisis de documentos"
      ],
      cta: "Contactar ventas",
      action: openContactForm,
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
            <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
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

              <CardContent className="space-y-4">
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
              onClick={openContactForm}
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