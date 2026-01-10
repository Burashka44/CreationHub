import { Mail, Phone, MapPin, Github, Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  const socialLinks = [
    { icon: <Github className="h-5 w-5" />, href: "#", label: "GitHub" },
    { icon: <Linkedin className="h-5 w-5" />, href: "#", label: "LinkedIn" },
    { icon: <Twitter className="h-5 w-5" />, href: "#", label: "Twitter" },
  ];

  const footerSections = [
    {
      title: "Услуги",
      links: [
        { name: "Веб-разработка", href: "#services" },
        { name: "Мобильные приложения", href: "#services" },
        { name: "Backend решения", href: "#services" },
        { name: "Кибербезопасность", href: "#services" },
      ]
    },
    {
      title: "Компания",
      links: [
        { name: "О нас", href: "#about" },
        { name: "Команда", href: "#about" },
        { name: "Карьера", href: "#careers" },
        { name: "Партнерство", href: "#contact" },
      ]
    },
    {
      title: "Ресурсы",
      links: [
        { name: "Блог", href: "#news" },
        { name: "Кейсы", href: "#" },
        { name: "Документация", href: "#" },
        { name: "API", href: "#" },
      ]
    }
  ];

  return (
    <footer className="bg-gradient-night text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              InoGuru
            </h3>
            <p className="text-primary-foreground/80 mb-6 leading-relaxed">
              Создаем инновационные IT-решения, которые помогают бизнесу достигать 
              новых высот в цифровой эпохе.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-3 text-accent" />
                <span>info@innoguru.ru</span>
              </div>
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-3 text-accent" />
                <span>+7 (495) 123-45-67</span>
              </div>
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-3 text-accent" />
                <span>Москва, ул. Инновационная, 1</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold text-primary-foreground mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-primary-foreground/70 hover:text-accent transition-colors duration-300 text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-primary-foreground/60 mb-4 md:mb-0">
              © 2025 InoGuru. Все права защищены.
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className="text-primary-foreground/60 hover:text-accent transition-colors duration-300 hover:scale-110 transform"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
              
              <div className="hidden md:flex space-x-6 text-sm">
                <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors duration-300">
                  Политика конфиденциальности
                </a>
                <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors duration-300">
                  Условия использования
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;