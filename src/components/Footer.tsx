import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, Mail, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  const footerLinks = {
    quick: [
      { name: t("dashboard.title"), href: "/dashboard" },
      { name: t("projects.title"), href: "/projects" },
      { name: t("materials.title"), href: "/materials" },
      { name: t("nav.users"), href: "/users" },
    ],
    legal: [
      { name: t("auth.terms"), href: "/terms" },
      { name: t("auth.privacy"), href: "/policy" },
      { name: t("contact.title"), href: "/contact" },
    ],
    contact: [
      { icon: Phone, text: "+222 1234 5678" },
      { icon: Mail, text: "contact@hadratech.com" },
      { icon: MapPin, text: "Nouakchott, Mauritanie" },
    ],
    newsletter: "Newsletter",
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <footer className="mt-auto bg-gradient-to-br from-adrar-900 to-adrar-800 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:20px_20px]" />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          className="grid grid-cols-1 md:grid-cols-3 md:gap-4 lg:grid-cols-5 lg:gap-6"
        >
          {/* Company Info */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-terracotta-500 to-terracotta-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">BTP Manager</span>
            </div>
            <p className="text-adrar-200 mb-6 text-start leading-relaxed max-w-md">
              {t("footer.about_desc")}
            </p>
            <div className="space-y-2">
              {footerLinks.contact.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 text-adrar-200"
                >
                  <item.icon className="h-4 w-4 text-terracotta-400" />
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-terracotta-500 rounded-full" />
              {t("footer.quick_links")}
            </h3>
            <ul className="space-y-3">
              {footerLinks.quick.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-adrar-200 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <div className="w-1 h-1 bg-terracotta-400 rounded-full group-hover:scale-150 transition-transform" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal Links */}
          <motion.div variants={itemVariants}>
            <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-terracotta-500 rounded-full" />
              {t("footer.legal")}
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-adrar-200 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <div className="w-1 h-1 bg-terracotta-400 rounded-full group-hover:scale-150 transition-transform" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Newsletter */}
          <motion.div variants={itemVariants}>
            <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-terracotta-500 rounded-full" />
              {t("footer.newsletter") || "Newsletter"}
            </h3>
            <p className="text-adrar-200 text-sm mb-4">
              Restez informé des dernières nouveautés
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Votre email"
                className="flex-1 px-3 py-2 bg-adrar-700 border border-adrar-600 rounded-lg text-white placeholder-adrar-300 text-sm focus:outline-none focus:border-terracotta-500"
              />
              <button className="px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-lg transition-colors text-sm">
                OK
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="border-t border-adrar-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <p className="text-adrar-300 text-sm">
            © {currentYear} BTP Manager. {t("footer.rights")}
          </p>
          <Link
            to="https://hadratech.com/"
            className="text-adrar-300 hover:text-terracotta-400 transition-colors text-sm flex items-center gap-2 mt-2 md:mt-0"
          >
            <Building2 className="h-4 w-4" />
            {t("footer.by_hadratech")}
          </Link>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
