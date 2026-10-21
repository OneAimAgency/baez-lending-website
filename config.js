/* ------------------------------------------------------------------
   Site settings for The Baez Lending Team.
   Fill these in when Oscar supplies them. Leave a value as "" and the
   site falls back to an honest alternative (see INTEGRATIONS.md).
   Never put private keys or passwords here: this file is public.
------------------------------------------------------------------- */
window.BAEZ_CONFIG = {
  // Oscar's secure mortgage application (Capstone / ARIVE). Paste his personal ARIVE link here.
  // Every "Apply Now" and application button uses it. Empty = buttons fall back to "Call to apply".
  applyUrl: "https://capstonemortgage.my1003app.com/958051/register",

  // Booking calendar (Calendly or similar). Paste the public booking link here.
  // Every "Book a consultation" button opens it. Empty = opens the contact form set to "Book a consultation".
  bookingUrl: "https://calendly.com/baezlendingteam/mortgage-consultation",

  // Email delivery for the contact form (no CRM). Web3Forms: create a free access key with Oscar's
  // email at web3forms.com and paste it below. The key is public by design, so it is safe here.
  // Empty = the visitor's own email app (or WhatsApp) sends the message; nothing is faked as "sent".
  formEndpoint: "https://api.web3forms.com/submit",
  formAccessKey: "60f663cb-63ab-4836-8b3a-9b0352c8bc41",   // Web3Forms key for info@thebaezlendingteam.com (2026-10-15)

  // Loan programs: confirmed by Oscar (A&D Mortgage line-up, 2026-10-13). "off" removes one.
  // "pending" programs are shown ONLY while reviewMode is true (preview), and hidden automatically at launch.
  programs: {
    conventional: "on", firsttime: "on", jumbo: "on", fha: "on", va: "on", refinance: "on", second: "on",
    bankstatement: "on", pl: "on", asset: "on", fulldoc: "on", itin: "on", dscr: "on", foreign: "on"
  },
  // Other services shown in the menu, same rule as programs. Refinance confirmed (A&D refinance programs).
  services: { refinance: "on" },
  // true = preview for One Aim / Oscar review (shows pending programs with a note). Set to false at launch.
  reviewMode: false,

  // Client reviews band (under the top of the homepage). Use ONLY real numbers from the real review pages.
  // Leave rating "" to hide a source; the whole band stays hidden until at least one is filled in.
  reviews: {
    testimonialTree: { rating: "5.0", count: "69", url: "https://directory.testimonialtree.com/profiles/oscar-baez-441172" },   // checked 2026-10-21
    google: { rating: "5.0", count: "5", url: "https://share.google/cyqDxcv9TyItP6JHw" }   // checked 2026-10-15
  },

  phone: "+13053029291",
  phoneDisplay: "(305) 302-9291",
  // Inbox for website inquiries (confirmed by Oscar).
  email: "info@thebaezlendingteam.com",
  // WhatsApp for inquiries, digits only with country code: (305) 302-9291 (confirmed by Oscar).
  whatsapp: "13053029291",
  // Main domain at launch (canonical links, sitemap, schema).
  domain: "thebaezlendingteam.com",
  instagram: "https://www.instagram.com/thebaezlendingteam/",
  nmlsIndividual: "958051",
  nmlsCompany: "1973764",
  licensedSince: "2012-10-08"
};
