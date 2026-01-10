import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

const ContactSection = () => {
  const contactInfo = [
    {
      icon: <Mail className="h-6 w-6 text-accent" />,
      title: "Email",
      details: "info@innoguru.ru",
      description: "Ответим в течение 24 часов"
    },
    {
      icon: <Phone className="h-6 w-6 text-accent" />,
      title: "Телефон",
      details: "+7 (495) 123-45-67",
      description: "Пн-Пт, 9:00-18:00 МСК"
    },
    {
      icon: <MapPin className="h-6 w-6 text-accent" />,
      title: "Офис",
      details: "Москва, ул. Инновационная, 1",
      description: "БЦ \"Технопарк\", 12 этаж"
    }
  ];

  return (
    <section id="contact" className="py-20 bg-gradient-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Свяжитесь
            <span className="bg-gradient-primary bg-clip-text text-transparent"> с нами</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Готовы обсудить ваш проект? Напишите нам, и мы ответим в ближайшее время
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-foreground mb-6">
                Контактная информация
              </h3>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                      {info.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{info.title}</h4>
                      <p className="text-lg text-accent font-medium">{info.details}</p>
                      <p className="text-sm text-muted-foreground">{info.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-night rounded-2xl p-6 shadow-tech">
              <h4 className="text-xl font-semibold text-primary-foreground mb-4">
                Карьерные возможности
              </h4>
              <p className="text-primary-foreground/80 mb-4">
                Ищете работу в сфере IT? Присоединяйтесь к нашей команде!
              </p>
              <Button 
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Открытые вакансии
              </Button>
            </div>
          </div>

          {/* Contact Form */}
          <Card className="bg-background border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-foreground">
                Отправить сообщение
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Имя *
                  </label>
                  <Input 
                    id="name"
                    placeholder="Ваше имя"
                    className="border-border focus:ring-accent"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                    Компания
                  </label>
                  <Input 
                    id="company"
                    placeholder="Название компании"
                    className="border-border focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email *
                </label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="border-border focus:ring-accent"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  Телефон
                </label>
                <Input 
                  id="phone"
                  type="tel"
                  placeholder="+7 (xxx) xxx-xx-xx"
                  className="border-border focus:ring-accent"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Сообщение *
                </label>
                <Textarea 
                  id="message"
                  placeholder="Расскажите о вашем проекте..."
                  rows={5}
                  className="border-border focus:ring-accent resize-none"
                />
              </div>

              <Button 
                size="lg"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 text-lg font-semibold shadow-glow hover:shadow-tech transition-all duration-300"
              >
                Отправить сообщение
                <Send className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                * Обязательные поля. Мы гарантируем конфиденциальность ваших данных.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;