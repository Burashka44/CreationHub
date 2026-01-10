import { Calendar, ArrowRight, Tag } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";

const NewsSection = () => {
  const news = [
    {
      id: 1,
      title: "Запуск нового AI-решения для автоматизации бизнес-процессов",
      excerpt: "Представляем революционную платформу на базе искусственного интеллекта, которая поможет компаниям оптимизировать рабочие процессы.",
      date: "15 сентября 2025",
      category: "Искусственный интеллект",
      readTime: "5 мин чтения"
    },
    {
      id: 2,
      title: "Партнерство с ведущими облачными провайдерами",
      excerpt: "Объявляем о стратегическом партнерстве с крупнейшими поставщиками облачных услуг для расширения наших возможностей.",
      date: "10 сентября 2025",
      category: "Партнерство",
      readTime: "3 мин чтения"
    },
    {
      id: 3,
      title: "Новые возможности кибербезопасности в 2025 году",
      excerpt: "Обзор трендов и инноваций в области информационной безопасности, которые изменят подход к защите данных.",
      date: "5 сентября 2025",
      category: "Безопасность",
      readTime: "7 мин чтения"
    }
  ];

  return (
    <section id="news" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Последние
            <span className="bg-gradient-primary bg-clip-text text-transparent"> новости</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Следите за актуальными событиями в мире технологий и развитием нашей компании
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {news.map((article, index) => (
            <Card 
              key={article.id} 
              className="bg-gradient-card border-border hover:shadow-tech transition-all duration-300 hover:scale-105 group cursor-pointer"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {article.date}
                  </div>
                  <span className="text-xs">{article.readTime}</span>
                </div>
                
                <div className="flex items-center mb-3">
                  <Tag className="h-4 w-4 text-accent mr-2" />
                  <span className="text-sm text-accent font-medium">{article.category}</span>
                </div>

                <h3 className="text-xl font-semibold text-foreground group-hover:text-accent transition-colors duration-300 leading-tight">
                  {article.title}
                </h3>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {article.excerpt}
                </p>
                
                <div className="flex items-center text-accent font-medium text-sm group-hover:text-accent/80 transition-colors duration-300">
                  <span>Читать далее</span>
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg"
            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground px-8 py-4 text-lg font-semibold transition-all duration-300"
          >
            Все новости
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="mt-16 bg-gradient-night rounded-2xl p-8 shadow-tech">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-primary-foreground mb-4">
              Подпишитесь на RSS-ленту
            </h3>
            <p className="text-primary-foreground/80 mb-6 max-w-2xl mx-auto">
              Получайте последние новости и обновления прямо в ваш RSS-ридер
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Ваш email для уведомлений"
                className="flex-1 px-4 py-3 rounded-lg border border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground placeholder-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent backdrop-blur-sm"
              />
              <Button 
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 font-semibold shadow-glow"
              >
                Подписаться
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;