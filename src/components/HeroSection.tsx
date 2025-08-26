import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3 } from "lucide-react";

const HeroSection = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const openSubstack = () => {
    window.open("https://narraglobal.substack.com/", "_blank");
  };

  return (
    <section className="py-20 bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center mb-6">
          <BarChart3 className="w-16 h-16 text-primary" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
          Datos para decisores de{" "}
          <span className="text-primary">comunicación</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Consultoría especializada en comunicación y narrativa. Análisis narrativo basado en evidencias 
          para decisores de comunicación.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => scrollToSection("politica")} 
            size="lg"
            className="text-lg px-8 py-3"
          >
            Empezar ahora
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          
          <Button 
            onClick={openSubstack} 
            variant="outline" 
            size="lg"
            className="text-lg px-8 py-3"
          >
            Ver reportes
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;