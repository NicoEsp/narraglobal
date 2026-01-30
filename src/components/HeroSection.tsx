import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3 } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const HeroSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
    }
  };

  const openReports = () => {
    window.open("https://drive.google.com/file/d/1WP8-hfyL8yENtQRCxH85H5X56PElVu-j/view?usp=drivesdk", "_blank");
  };

  return (
    <section 
      ref={ref}
      className="py-24 md:py-32 bg-gradient-to-br from-background to-muted/20"
    >
      <div 
        className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-700 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="flex justify-center mb-6">
          <BarChart3 className="w-16 h-16 text-primary" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
          Dato mejora{" "}
          <span className="text-primary">relato</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Métricas confiables hacen narrativas fuertes
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => scrollToSection("politica")} 
            size="lg" 
            className="text-lg px-8 py-3 transition-all duration-300 hover:scale-105"
          >
            Empezar ahora
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          
          <Button 
            onClick={openReports} 
            variant="outline" 
            size="lg" 
            className="text-lg px-8 py-3 transition-all duration-300 hover:scale-105"
          >
            Ver reportes
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;