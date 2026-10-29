import { defineTemplate, type Link } from '@saito/core';
import { themes } from '../themes.ts';

/**
 * Family Kitchen: single-page site for family restaurants and home-style kitchens that sell takeout and
 * delivery, with a daily lunch offer, a photo-led menu and ordering by WhatsApp.
 * Extracted from the web directory live-sketching/eatery-cafe/tangerine/tangerine-web-site/ on 2026-10-29.
 * Sections (index): hero, specials, featured-dishes, highlights, about, flavors, menu, reserve, gallery,
 * reviews, order, catering, visit. reserve, reviews and catering are optional (hidden in the source).
 */

const whatsapp = 'https://wa.me/50200000000';
const actionOrder = { label: 'Pedir por WhatsApp', href: '#menu' } satisfies Link;
const linkAbout = { label: 'Nosotros', href: '#about' } satisfies Link;
const linkMenu = { label: 'Menú', href: '#menu' } satisfies Link;
const linkVisit = { label: 'Contacto', href: '#visit' } satisfies Link;

const photo = (id: string, alt: string, width: number, height: number, caption?: string) => ({
  src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&h=${height}&q=70`,
  alt,
  width,
  height,
  ...(caption ? { caption } : {}),
});
const dish = (id: string, caption: string, alt: string) => photo(id, alt, 300, 220, caption);
const lunch = (id: string, name: string) => ({ id, name, price: 65 });

const template = defineTemplate({
  id: 'family-kitchen',
  name: 'Cocina Familiar',
  version: '1.0.0',
  description:
    'Warm single-page site for family restaurants in Guatemala (GTQ, +502): daily lunch, photo menu, story, gallery, hours and ordering by WhatsApp.',
  websiteTypes: ['restaurant', 'landing-page'],
  tags: ['single-page', 'hospitality', 'menu', 'ordering', 'whatsapp', 'daily-specials', 'guatemala'],
  theme: themes.citrus,
  // UNSUPPORTED header-icon-links → email and social icons only in the footer
  // UNSUPPORTED localized-ui-labels → the mobile menu button reads "Menu"
  navigation: { links: [linkAbout, linkMenu, linkVisit], cta: actionOrder },
  footer: {
    tagline: 'Calle Principal 0-00, Zona 1, Ciudad · +502 0000 0000',
    columns: [{ title: 'Explora', links: [linkAbout, linkMenu, linkVisit, { label: 'Pedir en línea', href: '#order' }] }],
    social: [
      { platform: 'facebook', href: 'https://www.facebook.com/' },
      { platform: 'instagram', href: 'https://www.instagram.com/' },
    ],
    legal: 'Restaurante familiar. Todos los derechos reservados.',
  },
  seo: { schemaType: 'Restaurant' },
  // UNSUPPORTED heading-accent-bar, scroll-reveal → omitted on every section
  // UNSUPPORTED installable-app, offline-page → plain web page, no install or offline support
  pages: [
    {
      slug: 'index',
      title: 'Inicio',
      description: 'Cocina casera de familia, a domicilio y para llevar. Pide tus platillos por WhatsApp.',
      sections: [
        {
          // UNSUPPORTED hero-wordmark → heading at the normal hero size
          // UNSUPPORTED transparent-header → solid header above the hero
          id: 'hero',
          type: 'hero',
          layout: 'image-background',
          heading: 'Cocina de familia',
          subheading: 'Auténtica cocina chapina, hecha en casa. A domicilio y para llevar · pedidos por WhatsApp.',
          primaryAction: actionOrder,
        },
        {
          // UNSUPPORTED daily-specials → menu with one category at the offer price
          // UNSUPPORTED promo-badge → price shown on each item
          id: 'specials',
          type: 'menu',
          background: 'surface',
          heading: '¡Almuerzos del día!',
          intro: 'Haz una pausa sabrosa con nuestro menú diario, de 11:00 a 15:00 h. Incluye bebida y postre del día.',
          currency: 'GTQ',
          categories: [
            {
              name: 'Elige tu plato',
              items: [
                lunch('pollo-en-crema', 'Pollo en crema'),
                lunch('pepian-de-pollo', 'Pepián de pollo'),
                lunch('jocon-con-arroz', 'Jocón con arroz'),
                lunch('churrasco', 'Churrasco chapín'),
                lunch('chiles-rellenos', 'Chiles rellenos'),
              ],
            },
          ],
        },
        {
          // UNSUPPORTED image-marquee → static 4-column gallery
          id: 'featured-dishes',
          type: 'gallery',
          heading: 'Platillos destacados',
          columns: 4,
          images: [
            dish('1529042410759-befb1204b468', 'Albóndigas en salsa', 'Albóndigas en salsa sobre hojas verdes'),
            dish('1544025162-d76694265947', 'Costillas BBQ', 'Costillas BBQ con vegetales'),
            dish('1555939594-58d7cb561ad1', 'Pinchos mixtos', 'Pinchos mixtos a la parrilla'),
            dish('1600891964092-4316c288032e', 'Churrasco', 'Churrasco con papas fritas'),
            dish('1432139555190-58524dae6a55', 'Cerdo con piña', 'Lomo de cerdo con piña'),
            dish('1519708227418-c8fd9a32b7a2', 'Salmón al limón', 'Filete de salmón con limón'),
            dish('1512621776951-a57141f2eefd', 'Ensalada de la casa', 'Ensalada fresca con aguacate'),
            dish('1565958011703-44f9829ba187', 'Pastel de frutos rojos', 'Pastel de frambuesa'),
          ],
        },
        {
          // UNSUPPORTED svg-icon-badges → emoji icons in small squares
          id: 'highlights',
          type: 'features',
          columns: 3,
          items: [
            { icon: '🍲', title: 'Sabores auténticos', description: 'Recetas de abuela, con ingredientes frescos de mercados locales.' },
            { icon: '🏠', title: 'Hecho en casa', description: 'Todo se cocina cada mañana, despacio y con mucho cariño.' },
            { icon: '👨‍👩‍👧', title: 'Ambiente familiar', description: 'Una mesa grande donde todos son bienvenidos, como en casa.' },
          ],
        },
        {
          // UNSUPPORTED media-text-split → text only, photo lost
          // UNSUPPORTED offset-color-slab → omitted
          // UNSUPPORTED line-doodles → omitted
          id: 'about',
          type: 'richText',
          heading: 'Bienvenidos',
          body: 'Cuenta aquí la historia de tu cocina: quién empezó, qué recetas de familia sirves y por qué cada plato se prepara con esmero e ingredientes frescos.\n\nAcompáñanos a celebrar la calidez de la familia, la riqueza de la cultura y el placer de la comida casera.',
        },
        {
          // UNSUPPORTED media-text-split → text only, photo lost; the button is an inline link
          // UNSUPPORTED offset-color-slab → omitted
          // UNSUPPORTED line-doodles → omitted
          id: 'flavors',
          type: 'richText',
          heading: 'Sabores de casa',
          body: 'Describe tus platillos más representativos: caldos humeantes, carnes a las brasas, salsas de recado y tortillas recién hechas.\n\nVen a disfrutar estos sabores de siempre, servidos como se merecen. [Ver menú](#menu)',
        },
        {
          // UNSUPPORTED menu-item-photos → text rows
          // UNSUPPORTED product-options-dialog → no customisation
          // UNSUPPORTED messaging-app-checkout → no cart; orderable items wait for it
          // UNSUPPORTED delivery-location-pin → omitted
          id: 'menu',
          type: 'menu',
          heading: 'Nuestro menú',
          intro: 'Elige tus platillos y envíanos tu pedido por WhatsApp. Pago y entrega se coordinan en el chat.',
          currency: 'GTQ',
          categories: [
            {
              name: 'Entradas',
              items: [
                { id: 'tostadas', name: 'Tostadas chapinas', description: 'Tres tostadas crujientes con guacamol, frijol volteado y salsa de tomate.', price: 35, orderable: true },
                { id: 'ceviche', name: 'Ceviche de camarón', description: 'Camarón marinado en limón con tomate, cebolla, cilantro y aguacate.', price: 70, orderable: true },
              ],
            },
            {
              name: 'Platos fuertes',
              items: [
                { id: 'pepian', name: 'Pepián de pollo', description: 'Recado tostado de semillas y chiles con pollo, güisquil y papa. Con arroz.', price: 85, orderable: true },
                { id: 'jocon', name: 'Jocón con arroz', description: 'Pollo en recado verde de miltomate y cilantro, servido con arroz.', price: 80, orderable: true },
                { id: 'churrasco', name: 'Churrasco chapín', description: 'Carne a las brasas con chirmol, frijoles, guacamol y cebollín asado.', price: 110, orderable: true },
                { id: 'costillas', name: 'Costillas BBQ', description: 'Costillas de cerdo glaseadas, con papas y ensalada de la casa.', price: 120, orderable: true },
              ],
            },
            {
              name: 'Postres',
              items: [
                { id: 'rellenitos', name: 'Rellenitos de plátano', description: 'Plátano maduro relleno de frijol dulce con chocolate y canela.', price: 30, orderable: true },
                { id: 'pastel', name: 'Pastel de frutos rojos', description: 'Bizcocho suave con crema y frambuesas frescas.', price: 35, orderable: true },
              ],
            },
            {
              name: 'Bebidas',
              items: [{ id: 'horchata', name: 'Horchata', description: 'Bebida fría de arroz con canela, hecha en casa.', price: 18, orderable: true }],
            },
          ],
        },
        {
          // UNSUPPORTED table-reservation → WhatsApp button
          // UNSUPPORTED photo-band-card → dark band without the photo
          id: 'reserve',
          type: 'cta',
          background: 'dark',
          heading: 'Reserva tu mesa',
          body: 'Escríbenos la fecha, la hora y cuántas personas vienen, y te confirmamos por WhatsApp.',
          primaryAction: { label: 'Reservar por WhatsApp', href: whatsapp },
        },
        {
          // UNSUPPORTED masonry-gallery → uniform 3-column grid
          // UNSUPPORTED section-header-action → "Ver Instagram" button lost
          id: 'gallery',
          type: 'gallery',
          heading: 'Nuestros platillos',
          columns: 3,
          images: [
            photo('1519708227418-c8fd9a32b7a2', 'Salmón a la plancha', 600, 450),
            photo('1432139555190-58524dae6a55', 'Cerdo asado con piña', 600, 450),
            photo('1476224203421-9ac39bcb3327', 'Pollo asado con ensalada', 600, 450),
            photo('1555939594-58d7cb561ad1', 'Pinchos a la parrilla', 600, 450),
            photo('1529042410759-befb1204b468', 'Albóndigas con salsa', 600, 450),
            photo('1600891964092-4316c288032e', 'Churrasco con papas', 600, 450),
          ],
        },
        {
          // UNSUPPORTED carousel → static grid
          // UNSUPPORTED review-rating → source in role, stars lost
          id: 'reviews',
          type: 'testimonials',
          heading: 'Testimonios',
          items: [
            { quote: 'Sabor increíble y de verdad casero. Me recordó a la cocina de mi abuela.', author: 'Patricia M.', role: 'Reseña de Google' },
            { quote: 'Aquí me sentí como en casa. ¡Los volveré a visitar!', author: 'Ana C.', role: 'Reseña de Google' },
            { quote: 'Mi lugar favorito para almorzar con mis compañeros. Porciones generosas y buen precio.', author: 'Carlos T.', role: 'Reseña de Google' },
            { quote: 'Pedimos catering para un cumpleaños y todos quedaron felices. Puntuales y todo riquísimo.', author: 'Lucía R.', role: 'Reseña de Facebook' },
          ],
        },
        {
          // UNSUPPORTED photo-band-card → dark band without the photo
          id: 'order',
          type: 'cta',
          background: 'dark',
          heading: 'Pide por WhatsApp',
          body: 'Elige tus platillos, personalízalos y envíanos tu pedido por WhatsApp. Ahí coordinamos pago y entrega.',
          primaryAction: { label: 'Elegir platillos', href: '#menu' },
        },
        {
          // UNSUPPORTED category-tiles → gallery with captions; intro and contact link lost
          id: 'catering',
          type: 'gallery',
          heading: 'Servicio de catering',
          columns: 4,
          images: [
            photo('1528605248644-14dd04022da1', 'Equipo almorzando en una mesa grande', 500, 625, 'Empresariales'),
            photo('1565958011703-44f9829ba187', 'Rebanada de pastel con frambuesas', 500, 625, 'Cumpleaños'),
            photo('1511795409834-ef04bbd61622', 'Mesa decorada con flores y copas', 500, 625, 'Bodas'),
            photo('1530062845289-9109b2c9c868', 'Mesa de tapas al aire libre', 500, 625, 'Reuniones'),
          ],
        },
        {
          // UNSUPPORTED media-text-split → photo lost
          // UNSUPPORTED offset-color-slab → omitted
          // UNSUPPORTED localized-ui-labels → English contact labels
          id: 'visit',
          type: 'contact',
          heading: 'Visítanos',
          address: 'Calle Principal 0-00, Zona 1, Ciudad',
          phone: '+502 0000 0000',
          hours: [
            { days: 'Lunes', hours: 'Cerrado' },
            { days: 'Martes a jueves', hours: '11:00 - 21:00' },
            { days: 'Viernes y sábado', hours: '11:00 - 22:00' },
            { days: 'Domingo', hours: '11:00 - 20:00' },
          ],
          form: { enabled: false },
        },
      ],
    },
  ],
  changelog: [{ version: '1.0.0', notes: 'Initial release.' }],
});

export default template;

// Not read by the renderer; used by generators and the extraction skills.
export const templateExtensions = {
  source: 'live-sketching/eatery-cafe/tangerine/tangerine-web-site/',
  taxonomy: {
    industries: ['food-and-beverage', 'family-restaurant'],
    visualStyle: {
      primary: 'warm-food-photography',
      secondary: ['friendly-script-casual', 'soft-rounded-modern'],
      notStyles: ['luxury', 'modern-minimal', 'corporate', 'brutalist', 'editorial', 'dark-moody'],
    },
    tone: ['warm', 'homey', 'cheerful', 'appetizing'],
    conversion: { primary: 'order-online', secondary: ['view-menu', 'reserve-table', 'catering-inquiry'] },
    positioning: 'mid-market',
  },
  // What the source does that the platform cannot render yet, keyed by x-patterns key. Each entry is a
  // platform requirement: why the design has it, how it behaves in the source, and what the platform must add.
  // The template renders the fallback today; `// UNSUPPORTED` comments mark where. Registry: template.example.ts.
  unsupportedCapabilities: {
    'transparent-header': {
      affects: ['header', 'hero'],
      purpose: 'Let the hero photo fill the first screen while the header stays readable on scroll.',
      expectedBehavior: 'Transparent header with white text over the hero; solid white with ink text after 60px of scroll or while the mobile menu is open.',
      requirements: ['navigation option transparentOverHero (schema, Studio, docs)', 'Header.astro variant plus a small scroll script', 'only applies when the first section is a hero with an image background'],
      fallback: 'solid header',
    },
    'header-icon-links': {
      affects: ['header'],
      purpose: 'Quick access to email and social profiles from the top bar.',
      expectedBehavior: 'Circular outlined icon buttons (email, Facebook, Instagram) after the nav links on wide screens; hidden on narrow ones.',
      requirements: ['navigation.iconLinks: { platform | email, href }[]', 'a shared SVG icon set in packages/components'],
      fallback: 'footer.social',
    },
    'localized-ui-labels': {
      affects: ['header', 'visit'],
      purpose: 'Every visible label in the site language.',
      expectedBehavior: 'Component chrome in Spanish: the mobile menu button ("Menú"), contact labels ("Dirección", "Horario de atención"), cart and dialog copy.',
      requirements: ['one locale-keyed strings dictionary in packages/components, chosen by site.locale', 'the components read labels from it instead of literals'],
      fallback: 'English labels',
    },
    'hero-wordmark': {
      affects: ['hero'],
      purpose: 'Make the business name the hero, set in the script display font.',
      expectedBehavior: 'Heading in the heading font at display scale (about 230px on desktop, fluid down to phones), with the tagline and a delivery note below.',
      requirements: ['hero option headingSize: display (schema, Hero.astro, Studio)', 'a fluid display font-size token'],
      fallback: 'heading at the normal hero size',
    },
    'daily-specials': {
      affects: ['specials'],
      purpose: 'Price-led urgency for the lunch crowd.',
      expectedBehavior: 'Light-grey rounded panel: heading, hours note, bullet list of dishes, a price badge, a three-photo collage and a "Ver menú" button.',
      requirements: ['section type specials { heading, intro, price, priceNote, items[], images[], action } (schema, component, Studio, seed, docs)'],
      fallback: 'menu with one category at the offer price',
    },
    'promo-badge': {
      affects: ['specials'],
      purpose: 'Draw the eye to the offer price.',
      expectedBehavior: 'Rotated star polygon in the primary colour holding the price ("Q65") and a small note ("por plato"), overlapping the panel edge.',
      requirements: ['badge { text, note } on specials and cta sections', 'CSS clip-path shape in the shared styles'],
      fallback: 'price shown on each item',
    },
    'image-marquee': {
      affects: ['featured-dishes'],
      purpose: 'Show many dishes in little space and add motion to the page.',
      expectedBehavior: 'One row of captioned rounded photos scrolling left in a seamless loop; pauses on hover; static under prefers-reduced-motion.',
      requirements: ['gallery layout: marquee (schema, Gallery.astro, Studio)', 'CSS keyframes; script only to duplicate the track'],
      fallback: 'static 4-column gallery',
    },
    'svg-icon-badges': {
      affects: ['highlights'],
      purpose: 'Give each value a recognisable icon in the brand colours.',
      expectedBehavior: 'SVG icon in a circular badge, each badge a different accent (tangerine, sage, mustard); thin vertical dividers between columns on desktop.',
      requirements: ['features item icon as a name from a shared SVG set, plus badgeColor', 'accent colour tokens in the theme', 'features divider variant'],
      fallback: 'emoji icons in small squares',
    },
    'media-text-split': {
      affects: ['about', 'flavors', 'visit'],
      purpose: 'Pair each story with a large photo, zig-zagging down the page.',
      expectedBehavior: 'Text beside a rounded photo; about puts the text first, flavors and visit the photo first; stacked below 821px; a black pill button under the text.',
      requirements: ['richText (and contact) fields image, imagePosition: start | end, action (schema, components, Studio, seed, docs)'],
      fallback: 'text only; the button becomes an inline link',
    },
    'offset-color-slab': {
      affects: ['about', 'flavors', 'visit'],
      purpose: 'Depth without shadows, and a block of brand colour per section.',
      expectedBehavior: 'Flat accent block (sage, mustard or burnt orange) with one 40px rounded corner, offset about 24px behind the photo; smaller offset on phones.',
      requirements: ['media decoration option slab: <accent token>', 'accent colour and slab radius tokens in the theme'],
      fallback: 'omitted',
    },
    'heading-accent-bar': {
      affects: ['site'],
      purpose: 'A consistent brand mark under every section heading.',
      expectedBehavior: 'Short sage-green bar under each section heading.',
      requirements: ['theme option headingDecoration: bar, with its colour token', 'one shared section-heading component'],
      fallback: 'omitted',
    },
    'line-doodles': {
      affects: ['about', 'flavors'],
      purpose: 'Quiet hand-drawn charm in the margins.',
      expectedBehavior: 'Light-grey line drawings (a leaf, a citrus slice) beside headings at low opacity, never over text; hidden on small screens.',
      requirements: ['decoration slot per section taking an SVG asset', 'a doodle set the template can reference'],
      fallback: 'omitted',
    },
    'menu-item-photos': {
      affects: ['menu'],
      purpose: 'Sell dishes with photos; the menu is the ordering surface.',
      expectedBehavior: 'Card grid (min 300px per card; horizontal cards with a 104px photo on phones): 4:3 photo, uppercase category label, name, two-line description, price, "Ordenar ahora" button, with an ordering notice above.',
      requirements: ['menu item image field (schema, Studio, seed round trip)', 'Menu.astro layout: cards'],
      fallback: 'text rows',
    },
    'product-options-dialog': {
      affects: ['menu'],
      purpose: 'Let customers adjust a dish before ordering.',
      expectedBehavior: 'Modal (bottom sheet on phones) with photo, description, one checkbox per removable ingredient (checked = included), quantity stepper up to 20 and "Agregar"; reopens to edit a cart line.',
      requirements: ['menu item ingredients: string[] (schema, Studio, seed)', 'web component on the native dialog element', 'strings from localized-ui-labels'],
      fallback: 'items are ordered as listed',
    },
    'messaging-app-checkout': {
      affects: ['menu', 'order'],
      purpose: 'The primary conversion: order without a backend, payment and delivery arranged in chat.',
      expectedBehavior: 'Sticky cart bar with count and total; cart sheet with editable lines and removed ingredients; checkout with name, address and notes (remembered for next time); "Pedir por WhatsApp" builds a message headed "Pedido: <PREFIX>-YYMMDD-XXXXX" and opens wa.me/<digits>?text=…; "Seguir Comprando" returns to the menu. Nothing reaches a server; cart and profile live in localStorage namespaced by site.',
      requirements: ['integrations.commerce provider whatsapp { phone, currency, orderIdPrefix, maxQty } (schema, docs)', 'web component porting the store, message builder, wa.me URL and order id, with vitest coverage', 'Menu.astro: canOrder for whatsapp and product data via jsonForScript', 'strings from localized-ui-labels'],
      fallback: 'no cart; the order band links to the menu',
    },
    'delivery-location-pin': {
      affects: ['menu'],
      purpose: 'Exact delivery point without typing a full address.',
      expectedBehavior: 'Optional "Compartir ubicación" in checkout: a map centred on the configured point, device location on request, drag the pin or tap the map; the order message gets a maps link.',
      requirements: ['commerce.location { enabled, center, zoom }', 'Leaflet 1.9.4 loaded lazily with SRI; OpenStreetMap tiles with attribution', 'build: Permissions-Policy geolocation=(self) only when location is enabled'],
      fallback: 'address text only',
    },
    'table-reservation': {
      affects: ['reserve'],
      purpose: 'Secondary conversion: book a table.',
      expectedBehavior: 'White card over a darkened photo with date, time and party-size inputs and "Buscar mesa" (a front-end demo in the source, no booking backend).',
      requirements: ['a booking integration (provider and URL) or a forms endpoint', 'section type reservation, or a cta variant that opens the booking flow'],
      fallback: 'WhatsApp button',
    },
    'photo-band-card': {
      affects: ['reserve', 'order'],
      purpose: 'Full-width appetite appeal behind a call to action.',
      expectedBehavior: 'Full-bleed food photo under a dark scrim, with a centred white card holding the heading, text and button.',
      requirements: ['cta fields backgroundImage and layout: image-band (schema, Cta.astro, Studio)', 'overlay scrim token'],
      fallback: 'dark band without the photo',
    },
    'masonry-gallery': {
      affects: ['gallery'],
      purpose: 'A lively photo wall rather than a uniform grid.',
      expectedBehavior: '3 columns on desktop and 2 below 821px; tall tiles span two rows; 20px radius; slight zoom on hover.',
      requirements: ['gallery layout: masonry and per-image span: tall | wide (schema, Gallery.astro, Studio)'],
      fallback: 'uniform 3-column grid',
    },
    'section-header-action': {
      affects: ['gallery'],
      purpose: 'Send visitors on to the full photo feed.',
      expectedBehavior: '"Ver Instagram" pill button aligned with the section heading.',
      requirements: ['optional headerAction: link on sections without an action field'],
      fallback: 'button lost',
    },
    carousel: {
      affects: ['reviews'],
      purpose: 'Show many reviews without a long page.',
      expectedBehavior: 'Scroll-snap row: 3 cards per view, 2 below 981px, 88% width below 561px; previous and next buttons; keyboard scrollable.',
      requirements: ['testimonials layout: carousel (schema, Testimonials.astro)', 'small web component for the buttons'],
      fallback: 'static grid',
    },
    'review-rating': {
      affects: ['reviews'],
      purpose: 'Social proof with recognisable sources.',
      expectedBehavior: 'Star rating with an accessible label ("5 de 5 estrellas"), an initials avatar, and the source ("Reseña de Google").',
      requirements: ['testimonial fields rating: 1–5 and source (schema, Studio, seed)'],
      fallback: 'source in role; stars lost',
    },
    'category-tiles': {
      affects: ['catering'],
      purpose: 'Present event types and lead to a quote request.',
      expectedBehavior: 'Intro line with a contact link; 4 portrait photo tiles (4:5) with a title over a dark gradient; 4 columns from 981px, 2 below.',
      requirements: ['section type tiles { heading, intro, tiles[{ image, title, href? }], action }, or a gallery layout with intro and action'],
      fallback: 'gallery with captions; intro and contact link lost',
    },
    'scroll-reveal': {
      affects: ['site'],
      purpose: 'Gentle motion as the page scrolls.',
      expectedBehavior: 'Blocks fade in and rise 24px over 700ms as they enter the viewport; shown immediately under prefers-reduced-motion.',
      requirements: ['theme motion option reveal (schema, docs)', 'one IntersectionObserver script in SiteLayout and shared CSS'],
      fallback: 'content shown without motion',
    },
    'installable-app': {
      affects: ['site'],
      purpose: 'Customers keep the restaurant on their home screen.',
      expectedBehavior: 'Web manifest (standalone, theme colour), icons and maskable icons, iOS splash screens; an "Instalar App" button on phones and tablets only: the Chromium install prompt, or a two-step instructions sheet on iOS, snoozed for 30 days when dismissed.',
      requirements: ['brand.pwa { manifest, themeColor, appleTouchIcon, splash[] } (schema, Head.astro)', 'install web component', 'service-worker registration', 'site public/ assets'],
      fallback: 'plain web page',
    },
    'offline-page': {
      affects: ['site'],
      purpose: 'A branded message instead of a browser error when the connection drops.',
      expectedBehavior: 'The service worker precaches a self-contained offline page and serves it when a page load fails; a full-screen notice appears when an order action needs the network; the page reloads when the connection returns.',
      requirements: ['service worker per site (generated or from public/)', '_headers: Cache-Control no-cache for /sw.js', 'strings from localized-ui-labels'],
      fallback: "the browser's own offline error",
    },
  },
  // Design tokens the theme cannot hold (DTCG). theme.radius follows the cards.
  tokens: {
    radius: {
      card: { $type: 'dimension', $value: '20px' },
      frame: { $type: 'dimension', $value: '30px' },
      slab: { $type: 'dimension', $value: '40px' },
      button: { $type: 'dimension', $value: '9999px' },
    },
    colorAccents: {
      burnt: { $type: 'color', $value: '#e3793f' },
      mustard: { $type: 'color', $value: '#f1c964' },
      sageDark: { $type: 'color', $value: '#5f8446' },
      ordering: { $type: 'color', $value: '#0d7a4a' }, // WhatsApp green on order actions
    },
    overlay: { scrim: { $type: 'color', $value: '#140f0a9e' } }, // over full-bleed photo bands
    spacing: {
      section: { $type: 'dimension', $value: 'clamp(64px, 9vw, 120px)' },
      gutter: { $type: 'dimension', $value: 'clamp(16px, 4vw, 48px)' },
    },
    breakpoint: {
      xs: { $type: 'dimension', $value: '420px' },
      phone: { $type: 'dimension', $value: '561px' },
      nav: { $type: 'dimension', $value: '821px' },
      wide: { $type: 'dimension', $value: '981px' },
    },
    motion: { reveal: { $type: 'duration', $value: '700ms' } },
  },
  assets: {
    required: ['logo mark (SVG)', 'hero food photo 1800 wide, darkened by the scrim', 'share card 1200×630'],
    optional: [
      'dish photos 600×450 (menu items, once menu-item-photos is supported)',
      'app icons 192×192 and 512×512 plus maskable variants, apple-touch icon, favicons 16/32 and SVG (installable-app)',
      'iOS splash screens, one per device size (installable-app)',
      'app screenshots, narrow and wide (installable-app)',
    ],
    placeholderImages: 'Unsplash stock URLs in featured-dishes, gallery and catering',
  },
  // Settings a site supplies to unsupported capabilities once the platform builds them.
  integrationSettings: {
    'messaging-app-checkout': ['WhatsApp number', 'currency', 'order-id prefix', 'maximum quantity per line', 'UI copy in the site language'],
    'delivery-location-pin': ['map centre (lat, lng)', 'zoom'],
  },
  requiredContent: [
    'pages.index.sections.hero.heading',
    'pages.index.sections.hero.subheading',
    'pages.index.sections.hero.image',
    'pages.index.sections.specials',
    'pages.index.sections.featured-dishes.images',
    'pages.index.sections.about.body',
    'pages.index.sections.flavors.body',
    'pages.index.sections.menu.categories',
    'pages.index.sections.reserve.primaryAction',
    'pages.index.sections.gallery.images',
    'pages.index.sections.reviews.items',
    'pages.index.sections.catering.images',
    'pages.index.sections.visit',
    'footer.tagline',
    'footer.social',
  ],
  // Hidden in the source; a site that does not offer them sets sections.<id>: false.
  optionalSections: ['reserve', 'reviews', 'catering'],
} as const;
