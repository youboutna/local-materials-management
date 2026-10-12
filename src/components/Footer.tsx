import { T } from '@/components/i18n/T';
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useNewsletterSubscribersHex } from '@/hooks/hexagonal/useNewsletterSubscribersHex';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();
  const { useSubscribe } = useNewsletterSubscribersHex();
  const [email, setEmail] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const subscribeMutation = useSubscribe();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast({ title: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }
    if (!consentGiven) {
      toast({ title: 'Please consent to receive newsletter emails', variant: 'destructive' });
      return;
    }

    try {
      await subscribeMutation.mutateAsync({ email, source: 'footer', consentGiven: true });
      setEmail('');
      setConsentGiven(false);
      toast({ title: 'Subscription requested', description: 'Check your email to confirm your subscription.' });
    } catch (error) {
      toast({
        title: 'Failed to subscribe',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const footerLinks = {
    quick: [
      { name: t("dashboard.title"), href: "/dashboard" },
      { name: t("projects.title"), href: "/projects" },
      { name: "News", href: "/news" },
      { name: t("materials.title"), href: "/materials" },
      { name: t("nav.users"), href: "/users" },
    ],
    legal: [
      { name: t("auth.terms"), href: "/terms" },
      { name: t("auth.privacy"), href: "/policy" },
      { name: t("contact.title"), href: "/contact" },
    ],
    contact: [
      { icon: Phone, text: "+222 41 43 89 08" },
      { icon: Mail, text: "contact@hadratech.com" },
      { icon: Building2, text: "HADRATECH SERVICES (BTP et Génie Civil)" },
      { icon: MapPin, text: "Adresse :Av ould meknass, TVZ, Nouakchott, Mauritanie" },
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
              <span className="text-xl font-bold"><T k="auto.footer.btp_manager" fallback="BTP Manager" /></span>
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
              <T k="auto.footer.restez_informe_des_dernieres_nouveautes" fallback="Restez informé des dernières nouveautés" />
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={t('auto.footer.votre_email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 py-2 bg-adrar-700 border border-adrar-600 rounded-lg text-white placeholder-adrar-300 text-sm focus:outline-none focus:border-terracotta-500"
                  disabled={subscribeMutation.isPending}
                  required
                />
                <button
                  type="submit"
                  disabled={subscribeMutation.isPending}
                  className="px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {subscribeMutation.isPending ? '...' : 'OK'}
                </button>
              </div>
              <label className="flex items-start gap-2 text-xs text-adrar-200">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(event) => setConsentGiven(event.target.checked)}
                  required
                  disabled={subscribeMutation.isPending}
                  className="mt-0.5"
                />
                <span>I agree to receive newsletter emails. I can unsubscribe at any time.</span>
              </label>
            </form>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="border-t border-adrar-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-3"
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-terracotta-500 to-adrar-600">
              <span className="text-white font-bold">A</span>
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white"><T k="auto.footer.hadratech_gpi" fallback="HadraTech-GPI" /></p>
              <p className="text-adrar-300 text-xs">
                © {currentYear} · {t("footer.rights")}
              </p>
            </div>
          </div>
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
