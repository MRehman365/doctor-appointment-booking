/**
 * Clinic contact details (UK). Used as the default on every public page.
 * Values saved in Admin → Settings take priority where a page reads them.
 */
export const CONTACT = {
  phone: "+44 20 7946 0958",
  phoneHref: "tel:+442079460958",
  email: "hello@medicalcomplex.co.uk",
  address: "45 Harley Street, London W1G 8QR, United Kingdom",
  mapEmbedUrl: "https://www.google.com/maps?q=45+Harley+Street,+London+W1G+8QR&output=embed",

  /** WhatsApp number in international format, digits only (no +) */
  whatsappNumber: "447700900123",
  whatsappLabel: "+44 7700 900123",
  whatsappMessage: "Hello Medical Complex, I would like some help with an appointment.",

  /** Facebook page username used for m.me links */
  messengerUsername: "medicalcomplex",

  /** Social profiles (demo URLs, replace with the real ones) */
  social: {
    facebook: "https://www.facebook.com/medicalcomplex",
    instagram: "https://www.instagram.com/medicalcomplex",
    x: "https://x.com/medicalcomplex",
    linkedin: "https://www.linkedin.com/company/medicalcomplex",
    youtube: "https://www.youtube.com/@medicalcomplex",
  },
} as const;

export const whatsappHref = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(
  CONTACT.whatsappMessage,
)}`;

export const messengerHref = `https://m.me/${CONTACT.messengerUsername}`;
