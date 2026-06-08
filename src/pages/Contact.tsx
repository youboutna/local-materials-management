import React, { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubmitContactMessageHex } from "@/hooks/hexagonal/useContactMessagesHex";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  senderName: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(100, "Le nom doit faire moins de 100 caractères."),
  senderEmail: z
    .string()
    .trim()
    .email("Adresse e-mail invalide.")
    .max(255, "L'e-mail doit faire moins de 255 caractères."),
  senderPhone: z
    .string()
    .trim()
    .max(30, "Le téléphone doit faire moins de 30 caractères.")
    .optional()
    .or(z.literal("")),
  subject: z
    .string()
    .trim()
    .min(3, "L'objet doit contenir au moins 3 caractères.")
    .max(200, "L'objet doit faire moins de 200 caractères."),
  message: z
    .string()
    .trim()
    .min(10, "Le message doit contenir au moins 10 caractères.")
    .max(2000, "Le message doit faire moins de 2000 caractères."),
});

type ContactForm = z.infer<typeof contactSchema>;
type FieldErrors = Partial<Record<keyof ContactForm, string>>;

const initialForm: ContactForm = {
  senderName: "",
  senderEmail: "",
  senderPhone: "",
  subject: "",
  message: "",
};

const Contact: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const submitMutation = useSubmitContactMessageHex();

  const [formData, setFormData] = useState<ContactForm>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});

  const setField = <K extends keyof ContactForm>(field: K, value: ContactForm[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof ContactForm;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      toast({
        title: "Formulaire invalide",
        description: "Veuillez corriger les champs en erreur.",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate(
      {
        senderName: parsed.data.senderName,
        senderEmail: parsed.data.senderEmail,
        senderPhone: parsed.data.senderPhone || undefined,
        subject: parsed.data.subject,
        message: parsed.data.message,
      },
      {
        onSuccess: () => {
          setFormData(initialForm);
          setErrors({});
        },
      }
    );
  };

  const isSubmitting = submitMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-grow py-12" id="main-content">
        <div className="container mx-auto px-4 max-w-6xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              {t("contact.title") || "Contactez-nous"}
            </h1>
            <p className="text-muted-foreground mt-2">
              Envoyez-nous un message, notre équipe vous répondra rapidement.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t("contact.form.title") || "Nouveau message"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  aria-label="Formulaire de contact"
                  noValidate
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">
                        Nom complet <span aria-hidden="true">*</span>
                      </Label>
                      <Input
                        id="contact-name"
                        value={formData.senderName}
                        onChange={(e) => setField("senderName", e.target.value)}
                        placeholder="Votre nom"
                        aria-required="true"
                        aria-invalid={!!errors.senderName}
                        aria-describedby={errors.senderName ? "contact-name-error" : undefined}
                        autoComplete="name"
                        required
                      />
                      {errors.senderName && (
                        <p id="contact-name-error" role="alert" className="text-sm text-destructive">
                          {errors.senderName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">
                        E-mail <span aria-hidden="true">*</span>
                      </Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={formData.senderEmail}
                        onChange={(e) => setField("senderEmail", e.target.value)}
                        placeholder="votre@email.com"
                        aria-required="true"
                        aria-invalid={!!errors.senderEmail}
                        aria-describedby={errors.senderEmail ? "contact-email-error" : undefined}
                        autoComplete="email"
                        required
                      />
                      {errors.senderEmail && (
                        <p id="contact-email-error" role="alert" className="text-sm text-destructive">
                          {errors.senderEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Téléphone</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        value={formData.senderPhone}
                        onChange={(e) => setField("senderPhone", e.target.value)}
                        placeholder="+222 ..."
                        aria-invalid={!!errors.senderPhone}
                        aria-describedby={errors.senderPhone ? "contact-phone-error" : undefined}
                        autoComplete="tel"
                      />
                      {errors.senderPhone && (
                        <p id="contact-phone-error" role="alert" className="text-sm text-destructive">
                          {errors.senderPhone}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-subject">
                        Objet <span aria-hidden="true">*</span>
                      </Label>
                      <Input
                        id="contact-subject"
                        value={formData.subject}
                        onChange={(e) => setField("subject", e.target.value)}
                        placeholder="Objet du message"
                        aria-required="true"
                        aria-invalid={!!errors.subject}
                        aria-describedby={errors.subject ? "contact-subject-error" : undefined}
                        required
                      />
                      {errors.subject && (
                        <p id="contact-subject-error" role="alert" className="text-sm text-destructive">
                          {errors.subject}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-message">
                      Message <span aria-hidden="true">*</span>
                    </Label>
                    <Textarea
                      id="contact-message"
                      value={formData.message}
                      onChange={(e) => setField("message", e.target.value)}
                      placeholder="Décrivez votre demande..."
                      rows={6}
                      aria-required="true"
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? "contact-message-error" : "contact-message-hint"}
                      required
                      maxLength={2000}
                    />
                    {errors.message ? (
                      <p id="contact-message-error" role="alert" className="text-sm text-destructive">
                        {errors.message}
                      </p>
                    ) : (
                      <p id="contact-message-hint" className="text-xs text-muted-foreground">
                        {formData.message.length}/2000 caractères
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    <Send className="h-4 w-4 mr-2" aria-hidden="true" />
                    {isSubmitting ? "Envoi en cours…" : "Envoyer le message"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("contact.info.title") || "Coordonnées"}</CardTitle>
              </CardHeader>
              <CardContent>
                <address className="not-italic space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-medium">{t("contact.info.address") || "Adresse"}</p>
                      <p className="text-muted-foreground">
                        {t("contact.info.address_value") || "Nouakchott, Mauritanie"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-medium">{t("contact.info.phone") || "Téléphone"}</p>
                      <a
                        href="tel:+22245000000"
                        className="text-muted-foreground hover:text-primary"
                      >
                        {t("contact.info.phone_value") || "+222 45 00 00 00"}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-medium">{t("contact.info.email") || "E-mail"}</p>
                      <a
                        href="mailto:contact@hadratech.com"
                        className="text-muted-foreground hover:text-primary break-all"
                      >
                        {t("contact.info.email_value") || "contact@hadratech.com"}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-medium">{t("contact.info.hours") || "Horaires"}</p>
                      <p className="text-muted-foreground">
                        {t("contact.info.hours_value") || "Lun – Ven · 08h00 – 17h00"}
                      </p>
                    </div>
                  </div>
                </address>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
