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
const menuPhoto = (id: string, alt: string) => photo(id, alt, 600, 450);

const template = defineTemplate({
  id: 'family-kitchen',
  name: 'Cocina Familiar',
  version: '1.5.0',
  description:
    'Warm single-page site for family restaurants in Guatemala (GTQ, +502): daily lunch, photo menu, story, gallery, hours and ordering by WhatsApp.',
  websiteTypes: ['restaurant', 'landing-page'],
  tags: ['single-page', 'hospitality', 'menu', 'ordering', 'whatsapp', 'daily-specials', 'guatemala'],
  theme: {
    ...themes.citrus,
    colors: { ...themes.citrus.colors, accent2: '#e3793f', accent3: '#f1c964', scrim: '#140f0a9e' },
    radii: { button: 'full', card: 'xl', image: '2xl', panel: '3xl' },
    headingDecoration: 'bar',
    motion: { reveal: true },
  },
  // UNSUPPORTED header-logo-wordmark → the logo alone; the business name is not shown beside it
  navigation: {
    links: [linkAbout, linkMenu, linkVisit],
    cta: actionOrder,
    transparent: true,
    iconLinks: [
      { icon: 'email', href: '#visit' },
      { icon: 'facebook', href: 'https://www.facebook.com/' },
      { icon: 'instagram', href: 'https://www.instagram.com/' },
    ],
  },
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
  pages: [
    {
      // UNSUPPORTED home-page-title → the browser title is the site name alone
      slug: 'index',
      title: 'Inicio',
      description: 'Cocina casera de familia, a domicilio y para llevar. Pide tus platillos por WhatsApp.',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          layout: 'image-background',
          headingSize: 'display',
          heading: 'Cocina de familia',
          subheading: 'Auténtica cocina chapina, hecha en casa. A domicilio y para llevar · pedidos por WhatsApp.',
          primaryAction: actionOrder,
        },
        {
          // UNSUPPORTED button-variants → primary-colour button instead of the dark pill
          id: 'specials',
          type: 'specials',
          heading: '¡Almuerzos del día!',
          intro: 'Haz una pausa sabrosa con nuestro menú diario, de 11:00 a 15:00 h. Incluye bebida y postre del día:',
          price: 'Q65',
          priceNote: 'por plato',
          items: ['Pollo en crema', 'Pepián de pollo', 'Jocón con arroz', 'Churrasco chapín', 'Chiles rellenos'],
          images: [
            photo('1493770348161-369560ae357d', 'Mesa con platillos variados del almuerzo', 600, 700),
            photo('1547592180-85f173990554', 'Plato con ejotes, arroz y vegetales', 500, 330),
            photo('1546069901-ba9599a7e63c', 'Bowl con proteína y vegetales frescos', 500, 330),
          ],
          action: { label: 'Ver menú', href: '#menu' },
        },
        {
          // UNSUPPORTED section-spacing → normal section padding around the marquee
          id: 'featured-dishes',
          type: 'gallery',
          heading: 'Platillos destacados',
          layout: 'marquee',
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
          // UNSUPPORTED section-spacing → normal section padding around the values strip
          id: 'highlights',
          type: 'features',
          columns: 3,
          iconStyle: 'badge',
          dividers: true,
          items: [
            { icon: 'pot', title: 'Sabores auténticos', description: 'Recetas de abuela, con ingredientes frescos de mercados locales.' },
            { icon: 'heart', title: 'Hecho en casa', description: 'Todo se cocina cada mañana, despacio y con mucho cariño.' },
            { icon: 'family', title: 'Ambiente familiar', description: 'Una mesa grande donde todos son bienvenidos, como en casa.' },
          ],
        },
        {
          // UNSUPPORTED button-variants → primary-colour button instead of the dark pill
          id: 'about',
          type: 'richText',
          heading: 'Bienvenidos',
          doodle: 'leaf',
          image: photo('1555396273-367ea4eb4db5', 'Interior cálido del restaurante con mesas de madera', 900, 675),
          imagePosition: 'end',
          slab: 'accent',
          action: { label: 'Nuestra historia', href: '#about' },
          body: 'Cuenta aquí la historia de tu cocina: quién empezó, qué recetas de familia sirves y por qué cada plato se prepara con esmero e ingredientes frescos.\n\nAcompáñanos a celebrar la calidez de la familia, la riqueza de la cultura y el placer de la comida casera.',
        },
        {
          id: 'flavors',
          type: 'richText',
          heading: 'Sabores de casa',
          doodle: 'citrus',
          body: 'Describe tus platillos más representativos: caldos humeantes, carnes a las brasas, salsas de recado y tortillas recién hechas.\n\nVen a disfrutar estos sabores de siempre, servidos como se merecen.',
          image: photo('1555939594-58d7cb561ad1', 'Parrillada de carnes y verduras asadas', 900, 675),
          imagePosition: 'start',
          slab: 'accent3',
          action: { label: 'Ver menú', href: '#menu' },
        },
        {
          // Ordering needs integrations.commerce (provider whatsapp) in the site config.
          id: 'menu',
          type: 'menu',
          layout: 'cards',
          heading: 'Nuestro menú',
          intro: 'Elige tus platillos y envíanos tu pedido por WhatsApp. Pago y entrega se coordinan en el chat.',
          currency: 'GTQ',
          categories: [
            {
              name: 'Entradas',
              items: [
                { id: 'tostadas', name: 'Tostadas chapinas', description: 'Tres tostadas crujientes con guacamol, frijol volteado y salsa de tomate.', price: 35, orderable: true, image: menuPhoto('1498837167922-ddd27525d352', 'Tostadas chapinas'), ingredients: ['Guacamol', 'Frijol volteado', 'Salsa de tomate', 'Cebolla', 'Queso seco', 'Perejil'] },
                { id: 'ceviche', name: 'Ceviche de camarón', description: 'Camarón marinado en limón con tomate, cebolla, cilantro y aguacate.', price: 70, orderable: true, image: menuPhoto('1546069901-ba9599a7e63c', 'Ceviche de camarón'), ingredients: ['Tomate', 'Cebolla', 'Cilantro', 'Aguacate', 'Chile'] },
              ],
            },
            {
              name: 'Platos fuertes',
              items: [
                { id: 'pepian', name: 'Pepián de pollo', description: 'Recado tostado de semillas y chiles con pollo, güisquil y papa. Con arroz.', price: 85, orderable: true, image: menuPhoto('1547592180-85f173990554', 'Pepián de pollo'), ingredients: ['Güisquil', 'Papa', 'Ejotes', 'Arroz', 'Tortillas'] },
                { id: 'jocon', name: 'Jocón con arroz', description: 'Pollo en recado verde de miltomate y cilantro, servido con arroz.', price: 80, orderable: true, image: menuPhoto('1476224203421-9ac39bcb3327', 'Jocón con arroz'), ingredients: ['Cebolla', 'Cilantro', 'Arroz', 'Tortillas'] },
                { id: 'churrasco', name: 'Churrasco chapín', description: 'Carne a las brasas con chirmol, frijoles, guacamol y cebollín asado.', price: 110, orderable: true, image: menuPhoto('1600891964092-4316c288032e', 'Churrasco chapín'), ingredients: ['Chirmol', 'Frijoles', 'Guacamol', 'Cebollín', 'Chorizo', 'Tortillas'] },
                { id: 'costillas', name: 'Costillas BBQ', description: 'Costillas de cerdo glaseadas, con papas y ensalada de la casa.', price: 120, orderable: true, image: menuPhoto('1544025162-d76694265947', 'Costillas BBQ'), ingredients: ['Salsa BBQ', 'Papas', 'Ensalada', 'Cebolla morada'] },
              ],
            },
            {
              name: 'Postres',
              items: [
                { id: 'rellenitos', name: 'Rellenitos de plátano', description: 'Plátano maduro relleno de frijol dulce con chocolate y canela.', price: 30, orderable: true, image: menuPhoto('1567620905732-2d1ec7ab7445', 'Rellenitos de plátano'), ingredients: ['Azúcar', 'Canela'] },
                { id: 'pastel', name: 'Pastel de frutos rojos', description: 'Bizcocho suave con crema y frambuesas frescas.', price: 35, orderable: true, image: menuPhoto('1565958011703-44f9829ba187', 'Pastel de frutos rojos'), ingredients: ['Crema', 'Frambuesas'] },
              ],
            },
            {
              name: 'Bebidas',
              items: [{ id: 'horchata', name: 'Horchata', description: 'Bebida fría de arroz con canela, hecha en casa.', price: 18, orderable: true, image: menuPhoto('1544145945-f90425340c7e', 'Horchata'), ingredients: ['Hielo', 'Canela'] }],
            },
          ],
        },
        {
          // UNSUPPORTED table-reservation → WhatsApp button
          id: 'reserve',
          type: 'cta',
          background: 'dark',
          layout: 'photo-band',
          image: photo('1504674900247-0877df9cc836', '', 1600, 1067),
          heading: 'Reserva tu mesa',
          body: 'Escríbenos la fecha, la hora y cuántas personas vienen, y te confirmamos por WhatsApp.',
          primaryAction: { label: 'Reservar por WhatsApp', href: whatsapp },
        },
        {
          // UNSUPPORTED button-variants → primary-colour header button instead of the dark pill
          id: 'gallery',
          type: 'gallery',
          heading: 'Nuestros platillos',
          layout: 'masonry',
          columns: 3,
          action: { label: 'Ver Instagram', href: 'https://www.instagram.com/' },
          images: [
            photo('1519708227418-c8fd9a32b7a2', 'Salmón a la plancha', 600, 400),
            { ...photo('1432139555190-58524dae6a55', 'Cerdo asado con piña', 600, 800), span: 'tall' },
            photo('1476224203421-9ac39bcb3327', 'Pollo asado con ensalada', 600, 400),
            { ...photo('1555939594-58d7cb561ad1', 'Pinchos a la parrilla', 600, 800), span: 'tall' },
            photo('1529042410759-befb1204b468', 'Albóndigas con salsa', 600, 400),
            photo('1600891964092-4316c288032e', 'Churrasco con papas', 600, 400),
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
          id: 'order',
          type: 'cta',
          background: 'dark',
          layout: 'photo-band',
          image: photo('1600891964092-4316c288032e', '', 1600, 1067),
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
          id: 'visit',
          type: 'contact',
          heading: 'Visítanos',
          image: photo('1512621776951-a57141f2eefd', 'Ensalada colorida con aguacate y garbanzos', 900, 675),
          imagePosition: 'start',
          slab: 'accent2',
          action: actionOrder,
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
  changelog: [
    { version: '1.0.0', notes: 'Initial release.' },
    { version: '1.1.0', notes: 'Theme: accent2 (burnt orange), accent3 (mustard), photo scrim, per-role radii (pill buttons, 20px cards, 30px images, 40px panels).' },
    { version: '1.2.0', notes: 'specials section type with price badge; marquee and masonry galleries with a header action; icon badges with dividers; photo beside text with offset slabs on about, flavors and visit; photo bands on reserve and order.' },
    { version: '1.3.0', notes: 'Menu as photo cards; items carry a photo and removable ingredients for the WhatsApp cart (the site enables integrations.commerce).' },
    { version: '1.4.0', notes: 'Transparent header over the hero with email and social icon links; display-size hero wordmark; accent bar under section headings; line doodles on about and flavors; scroll reveal.' },
    { version: '1.5.0', notes: 'Installable app and offline page are supported; the site opts in with brand.pwa and supplies the files listed under assets.' },
  ],
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
    'header-logo-wordmark': {
      affects: ['header'],
      purpose: 'Show the brand mark and the business name together in the header.',
      expectedBehavior: 'Logo mark (32px) followed by the business name in the script heading font, as one home link.',
      requirements: ['brand option to render the logo and logoText together (schema, Header.astro, docs)'],
      fallback: 'the logo alone (the name is lost when brand.logo is set)',
    },
    'home-page-title': {
      affects: ['site'],
      purpose: 'A descriptive browser and share title for the home page.',
      expectedBehavior: 'Home page <title> and og:title read "Date El Gusto — Cocina chapina de familia" style: name plus tagline.',
      requirements: ['seo or page option for the home page title (schema, Head.astro, docs)'],
      fallback: 'the site name alone',
    },
    'button-variants': {
      affects: ['specials', 'about', 'gallery'],
      purpose: 'Contrast secondary actions with the primary call to order.',
      expectedBehavior: 'Dark (ink) pill buttons with white text on specials, about and the gallery header; the primary orange pill stays for ordering.',
      requirements: ['link/action option variant: primary | dark (schema, Button.astro, docs)'],
      fallback: 'every button in the primary colour',
    },
    'section-spacing': {
      affects: ['highlights', 'featured-dishes'],
      purpose: 'Keep compact strips (values, dish marquee) visually tied to their neighbours.',
      expectedBehavior: 'The values strip uses about 40px vertical padding and the marquee about 28px top and 8px bottom, against the 64–120px of normal sections.',
      requirements: ['section option spacing: default | compact (schema, Section.astro, docs)'],
      fallback: 'the normal section padding',
    },
    'table-reservation': {
      affects: ['reserve'],
      purpose: 'Secondary conversion: book a table.',
      expectedBehavior: 'White card over a darkened photo with date, time and party-size inputs and "Buscar mesa" (a front-end demo in the source, no booking backend).',
      requirements: ['a booking integration (provider and URL) or a forms endpoint', 'section type reservation, or a cta variant that opens the booking flow'],
      fallback: 'WhatsApp button',
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
  },
  // Design tokens the theme cannot hold (DTCG). Radii, accent2/3 and the scrim moved to the theme in 1.1.0.
  tokens: {
    colorAccents: {
      sageDark: { $type: 'color', $value: '#5f8446' },
      ordering: { $type: 'color', $value: '#0d7a4a' }, // WhatsApp green on order actions
    },
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
      'installable app (the site sets brand.pwa; templates cannot ship files): public/manifest.webmanifest, sw.js, offline.html (self-contained), app icons 192×192 and 512×512 plus maskable variants, apple-touch icon',
      'iOS splash screens, one per device size, listed in brand.pwa.splash',
      'app screenshots, narrow and wide, referenced from the manifest',
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
