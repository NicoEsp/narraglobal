import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3 } from "lucide-react";
import DossierImage from "@/components/DossierImage";
const HeroSection = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
    }
  };
  const openSubstack = () => {
    window.open("https://narraglobal.substack.com/", "_blank");
  };
  return <section className="py-20 bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center mb-6">
          <DossierImage 
            filename="Copia de 20.png" 
            className="w-12 h-12 sm:w-16 sm:h-16" 
            alt="Dato mejora relato"
            fallback={<BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />}
          />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
          Dato mejora{" "}
          <span className="text-primary">relato</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">Metricas confiables hacen narrativas fuertes</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => scrollToSection("politica")} size="lg" className="text-lg px-8 py-3">
            Empezar ahora
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          
          <Button onClick={openSubstack} variant="outline" size="lg" className="text-lg px-8 py-3">
            Ver reportes
          </Button>
        </div>
      </div>
    </section>;
};
export default HeroSection;