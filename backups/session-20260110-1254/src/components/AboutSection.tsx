import { Target, Users, Lightbulb, Rocket } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const AboutSection = () => {
  const values = [
    {
      icon: <Target className="h-8 w-8 text-accent" />,
      title: "Точность решений",
      description: "Каждый проект выполняется с максимальной точностью и вниманием к деталям"
    },
    {
      icon: <Users className="h-8 w-8 text-accent" />,
      title: "Командная работа",
      description: "Сильная команда профессионалов, объединенная общими целями"
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-accent" />,
      title: "Инновации",
      description: "Постоянный поиск новых технологических решений и подходов"
    },
    {
      icon: <Rocket className="h-8 w-8 text-accent" />,
      title: "Быстрое развитие",
      description: "Стремительный рост и адаптация к изменениям рынка"
    }
  ];

  return (
    <section id="about" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            О компании
            <span className="bg-gradient-primary bg-clip-text text-transparent"> InoGuru</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Мы — команда энтузиастов, которая превращает сложные технологические задачи 
            в элегантные и эффективные решения для бизнеса любого масштаба.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-foreground">
              Наша миссия
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Создавать инновационные IT-решения, которые помогают бизнесу достигать 
              новых высот в цифровой эпохе. Мы верим, что технологии должны быть 
              доступными, понятными и максимально эффективными.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Наш подход основан на глубоком понимании потребностей клиентов и 
              применении самых современных технологических решений для достижения 
              их бизнес-целей.
            </p>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-card rounded-2xl p-8 shadow-card">
              <div className="text-center space-y-4">
                <div className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  2019
                </div>
                <p className="text-lg font-medium text-foreground">
                  Год основания компании
                </p>
                <p className="text-muted-foreground">
                  С первых дней мы фокусируемся на качестве и инновациях
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <Card key={index} className="bg-gradient-card border-none shadow-card hover:shadow-tech transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  {value.icon}
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-3">
                  {value.title}
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {value.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;