import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "./ui/button";

const HeroSection = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-hero opacity-90"></div>
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-accent mr-3 animate-glow-pulse" />
            <span className="text-lg font-medium text-accent-foreground bg-accent/20 px-4 py-2 rounded-full">
              Инновационные технологии будущего
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-primary-foreground mb-8 leading-tight">
            Создаем
            <span className="bg-gradient-primary bg-clip-text text-transparent block">
              цифровое будущее
            </span>
            вместе с вами
          </h1>

          <p className="text-xl sm:text-2xl text-primary-foreground/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            InoGuru — ваш надежный партнер в мире передовых IT-решений. 
            Мы превращаем смелые идеи в технологические прорывы.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 text-lg font-semibold shadow-glow transition-all duration-300 hover:shadow-tech hover:scale-105"
            >
              Начать проект
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-8 py-4 text-lg font-semibold backdrop-blur-sm"
            >
              Узнать больше
            </Button>
          </div>
        </div>

        <div className="mt-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-foreground mb-2">200+</div>
              <div className="text-primary-foreground/70">Успешных проектов</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-foreground mb-2">50+</div>
              <div className="text-primary-foreground/70">Экспертов команды</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-foreground mb-2">5+</div>
              <div className="text-primary-foreground/70">Лет инноваций</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary-foreground/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary-foreground/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;