// UI chrome the renderer writes itself (not site content), keyed by language.
const en = {
  skipToContent: 'Skip to content',
  menu: 'Menu',
  cart: 'Cart',
  navMain: 'Main',
  navMobile: 'Mobile',
  address: 'Address',
  contact: 'Contact',
  openingHours: 'Opening hours',
  map: 'Map',
  formName: 'Name',
  formEmail: 'Email',
  formMessage: 'Message',
  formSubmit: 'Send message',
  formSending: 'Sending…',
  formSuccess: 'Thanks! We will get back to you shortly.',
  formError: 'Sorry, something went wrong. Please try again later.',
  countdownDays: 'Days',
  countdownHours: 'Hours',
  countdownMinutes: 'Minutes',
  countdownSeconds: 'Seconds',
  countdownExpired: 'It has started!',
  buy: 'Buy',
  addToOrder: 'Add to order',
};

const es: Record<keyof typeof en, string> = {
  skipToContent: 'Saltar al contenido',
  menu: 'Menú',
  cart: 'Carrito',
  navMain: 'Principal',
  navMobile: 'Móvil',
  address: 'Dirección',
  contact: 'Contacto',
  openingHours: 'Horario de atención',
  map: 'Mapa',
  formName: 'Nombre',
  formEmail: 'Correo electrónico',
  formMessage: 'Mensaje',
  formSubmit: 'Enviar mensaje',
  formSending: 'Enviando…',
  formSuccess: '¡Gracias! Te responderemos pronto.',
  formError: 'Lo sentimos, algo salió mal. Por favor, inténtalo de nuevo más tarde.',
  countdownDays: 'Días',
  countdownHours: 'Horas',
  countdownMinutes: 'Minutos',
  countdownSeconds: 'Segundos',
  countdownExpired: '¡Ya comenzó!',
  buy: 'Comprar',
  addToOrder: 'Agregar al pedido',
};

const byLanguage = { en, es };

/** UI copy for a BCP 47 locale ("es-GT" → es); unknown languages fall back to English. */
export function strings(locale: string) {
  return byLanguage[locale.split('-')[0].toLowerCase() as keyof typeof byLanguage] ?? en;
}
