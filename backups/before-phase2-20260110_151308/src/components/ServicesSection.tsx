import { Code, Smartphone, Globe, Database, Shield, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

const ServicesSection = () => {
  const services = [
    {
      icon: <Code className="h-10 w-10 text-accent" />,
      title: "Веб-разработка",
      description: "Современные веб-приложения и сайты с использованием передовых технологий и фреймворков.",
      features: ["React/Vue.js", "Node.js", "TypeScript", "Responsive дизайн"]
    },
    {
      icon: <Smartphone className="h-10 w-10 text-accent" />,
      title: "Мобильные приложения",
      description: "Нативные и кросс-платформенные мобильные приложения для iOS и Android.",
      features: ["React Native", "Flutter", "Swift/Kotlin", "API интеграция"]
    },
    {
      icon: <Database className="h-10 w-10 text-accent" />,
      title: "Backend решения",
      description: "Масштабируемые серверные решения и архитектура для высоконагруженных систем.",
      features: ["Микросервисы", "API Gateway", "Базы данных", "Облачные решения"]
    },
    {
      icon: <Shield className="h-10 w-10 text-accent" />,
      title: "Кибербезопасность",
      description: "Комплексная защита данных и систем от современных киберугроз.",
      features: ["Аудит безопасности", "Пентестинг", "SIEM системы", "Compliance"]
    },
    {
      icon: <Globe className="h-10 w-10 text-accent" />,
      title: "DevOps & CI/CD",
      description: "Автоматизация процессов разработки, тестирования и развертывания приложений.",
      features: ["Docker/Kubernetes", "CI/CD Pipeline", "Monitoring", "Infrastructure as Code"]
    },
    {
      icon: <Zap className="h-10 w-10 text-accent" />,
      title: "AI & Machine Learning",
      description: "Интеграция искусственного интеллекта и машинного обучения в бизнес-процессы.",
      features: ["Data Science", "Computer Vision", "NLP", "Predictive Analytics"]
    }
  ];

  return (
    <section id="services" className="py-20 bg-gradient-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Наши
            <span className="bg-gradient-primary bg-clip-text text-transparent"> услуги</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Полный спектр IT-услуг от концепции до внедрения. Мы поможем реализовать 
            любую техническую задачу с использованием современных технологий.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="bg-background border-border hover:shadow-tech transition-all duration-300 hover:scale-105 group"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-center w-16 h-16 bg-accent/10 rounded-xl mb-4 group-hover:bg-accent/20 transition-colors duration-300">
                  {service.icon}
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
                <div className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="bg-gradient-night rounded-2xl p-8 shadow-tech">
            <h3 className="text-2xl font-bold text-primary-foreground mb-4">
              Готовы начать проект?
            </h3>
            <p className="text-primary-foreground/80 mb-6 max-w-2xl mx-auto">
              Свяжитесь с нами, чтобы обсудить ваши идеи и получить персональное предложение
            </p>
            <Button 
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 text-lg font-semibold shadow-glow hover:shadow-tech transition-all duration-300"
            >
              Получить консультацию
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;