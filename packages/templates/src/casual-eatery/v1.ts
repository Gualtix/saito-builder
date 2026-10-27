import { defineTemplate, type Link } from '@saito/core';
import { themes } from '../themes.ts';

/**
 * Casual Eatery: single-page site for casual food spots (burgers, pizza, cafés, food trucks)
 * that sell with a daily deal and convert to ordering.
 * Extracted from live-sketching/eatery-cafe/organic/organic-web-site/index.html on 2026-10-26.
 * Sections (index): hero, special, menu, favorites, offers, about, gallery, reviews, reserve, visit, order.
 */

const actionOrder = { label: 'Ordenar ahora', href: '#order' } satisfies Link;
const linkMenu = { label: 'Menú', href: '#menu' } satisfies Link;
const linkReserve = { label: 'Reservar', href: '#reserve' } satisfies Link;
const linkAbout = { label: 'Nosotros', href: '#about' } satisfies Link;
const linkPhone = { label: '+502 0000 0000', href: 'tel:+50200000000' } satisfies Link;
const linkWhatsApp = { label: 'Pedir por WhatsApp', href: 'https://wa.me/50200000000' } satisfies Link;

const galleryImage = (id: string, alt: string) => ({
  src: `https://images.unsplash.com/photo-${id}?w=600&h=600&q=75&auto=format&fit=crop`,
  alt,
  width: 600,
  height: 600,
});

const template = defineTemplate({
  id: 'casual-eatery',
  name: 'Casual Eatery',
  version: '1.0.0',
  description:
    'Playful single-page site for casual eateries and cafés: daily special, menu, house favorites, offers, reviews and ordering.',
  websiteTypes: ['restaurant', 'landing-page'],
  tags: ['single-page', 'hospitality', 'menu', 'promotions', 'ordering'],
  theme: themes.apricot,
  navigation: {
    links: [{ label: 'Inicio', href: '#hero' }, linkMenu, linkReserve, linkAbout],
    cta: actionOrder,
  },
  footer: {
    tagline: 'Comida y café para cuando el hambre aprieta.',
    columns: [
      { title: 'Explora', links: [linkMenu, linkReserve, linkAbout] },
      { title: 'Contacto', links: [linkPhone, linkWhatsApp] },
    ],
    social: [
      { platform: 'facebook', href: 'https://www.facebook.com/' },
      { platform: 'instagram', href: 'https://www.instagram.com/' },
      { platform: 'tiktok', href: 'https://www.tiktok.com/' },
    ],
    legal: 'Todos los derechos reservados. Precios con impuestos incluidos.',
  },
  seo: { schemaType: 'Restaurant' },
  pages: [
    {
      slug: 'index',
      title: 'Inicio',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          layout: 'split',
          heading: 'La mejor comida cuando tienes hambre',
          subheading: 'Abiertos todos los días. Hamburguesas, pizzas y café hechos al momento.',
          primaryAction: actionOrder,
          secondaryAction: linkMenu,
        },
        {
          id: 'special',
          type: 'cta',
          background: 'surface',
          heading: 'Especial de hoy: pizza de la casa a mitad de precio',
          body: 'Masa de fermentación lenta, salsa de tomate de la casa y albahaca fresca. Válido solo en pedidos de hoy.',
          primaryAction: actionOrder,
        },
        {
          id: 'menu',
          type: 'menu',
          heading: 'Menú',
          intro: 'Todo se prepara al momento. Precios con impuestos incluidos.',
          currency: 'GTQ',
          categories: [
            {
              name: 'Entradas',
              items: [
                { id: 'papas-rusticas', name: 'Papas rústicas', description: 'Con piel, romero y salsa de la casa.', price: 30 },
                { id: 'aros-de-cebolla', name: 'Aros de cebolla', description: 'Crujientes, con dip de la casa.', price: 35 },
                { id: 'alitas', name: 'Alitas (6)', description: 'Glaseadas con salsa BBQ.', price: 60 },
              ],
            },
            {
              name: 'Platos fuertes',
              items: [
                { id: 'hamburguesa-clasica', name: 'Hamburguesa clásica', description: 'Carne de res, queso cheddar y papas.', price: 65 },
                { id: 'pizza-de-la-casa', name: 'Pizza de la casa', description: 'Tomate, mozzarella y albahaca fresca.', price: 85 },
                { id: 'pollo-frito', name: 'Pollo frito', description: 'Tres piezas con ensalada de repollo.', price: 70 },
              ],
            },
            {
              name: 'Postres',
              items: [
                { id: 'brownie', name: 'Brownie con helado', description: 'Tibio, con helado de vainilla.', price: 35 },
                { id: 'panqueques', name: 'Panqueques con miel', description: 'Torre de tres con frutos rojos.', price: 40 },
              ],
            },
            {
              name: 'Bebidas',
              items: [
                { id: 'cafe-americano', name: 'Café americano', description: 'De tueste local.', price: 18 },
                { id: 'licuado', name: 'Licuado de fresa', description: 'Con leche o con agua, bien frío.', price: 25 },
                { id: 'limonada', name: 'Limonada natural', description: 'Limón recién exprimido.', price: 20 },
              ],
            },
          ],
        },
        {
          id: 'favorites',
          type: 'products',
          heading: 'Los favoritos de la casa',
          intro: 'Los que más se piden. Si no sabes qué escoger, empieza por aquí.',
          currency: 'GTQ',
          items: [
            { id: 'fav-pizza', name: 'Pizza de la casa', description: 'Masa artesanal, mozzarella y albahaca.', price: 85 },
            { id: 'fav-hamburguesa', name: 'Hamburguesa clásica', description: 'La que todos piden, bien servida.', price: 65 },
            { id: 'fav-alitas', name: 'Alitas BBQ', description: 'Seis piezas con salsa de la casa.', price: 60 },
            { id: 'fav-desayuno', name: 'Desayuno de la casa', description: 'Huevos, pan tostado y café.', price: 45 },
          ],
        },
        {
          id: 'offers',
          type: 'features',
          heading: 'Ofertas que dan hambre',
          intro: 'Cada día hay un motivo para pedir algo rico.',
          columns: 3,
          items: [
            { icon: '🍔', title: '2x1: compra uno, lleva otro', description: 'Un día a la semana, en hamburguesas clásicas.' },
            { icon: '🥤', title: 'Bebida y snack gratis', description: 'En pedidos desde un monto mínimo, a domicilio o en el local.' },
            { icon: '🍕', title: '-30% en combos familiares', description: 'Cada fin de semana, combos para compartir con descuento.' },
          ],
        },
        {
          id: 'about',
          type: 'richText',
          heading: 'Una cocina de barrio con mucho antojo',
          body: 'Cuenta aquí cómo empezó tu cocina, qué la hace diferente y de dónde vienen tus ingredientes.\n\n**Todos los días**, de 8:00 a. m. a 10:00 p. m.\n\n**Entrega a domicilio** en tu zona en menos de 40 minutos.',
        },
        {
          id: 'gallery',
          type: 'gallery',
          heading: 'Así se ve el antojo',
          columns: 3,
          images: [
            galleryImage('1576107232684-1279f390859f', 'Bandeja de papas fritas recién salidas'),
            galleryImage('1509042239860-f550ce710b93', 'Cafés con arte latte sobre la barra'),
            galleryImage('1587314168485-3236d6710814', 'Crepas con crema batida y fresas'),
            galleryImage('1525351484163-7529414344d8', 'Pan tostado con huevo estrellado'),
            galleryImage('1593560708920-61dd98c46a4e', 'Pizza de espinaca y queso de cabra'),
            galleryImage('1504754524776-8f4f37790ca0', 'Mesa de desayuno con waffles, fruta y jugos'),
          ],
        },
        {
          id: 'reviews',
          type: 'testimonials',
          heading: 'Lo dicen los que ya probaron',
          items: [
            { quote: 'Pedí a la oficina y llegó calientito en menos de media hora.', author: 'María L.', role: 'Cliente frecuente' },
            { quote: 'Los fines de semana venimos en familia por el combo de pizzas.', author: 'Carlos R.', role: 'Cliente frecuente' },
            { quote: 'Buen café y el desayuno sale rapidísimo. Mi parada antes del trabajo.', author: 'Daniela S.', role: 'Cliente frecuente' },
          ],
        },
        {
          id: 'reserve',
          type: 'cta',
          background: 'surface',
          heading: 'Reserva tu mesa',
          body: 'Para cumpleaños, reuniones o para asegurar tu lugar el fin de semana. Llámanos y te confirmamos.',
          primaryAction: { label: 'Llamar para reservar', href: 'tel:+50200000000' },
        },
        {
          id: 'visit',
          type: 'contact',
          heading: 'Visítanos',
          address: 'Calle Principal 0-00, Zona 1, Ciudad',
          phone: '+502 0000 0000',
          hours: [{ days: 'Lunes a domingo', hours: '8:00 a. m. – 10:00 p. m.' }],
          form: { enabled: false },
        },
        {
          id: 'order',
          type: 'cta',
          background: 'primary',
          heading: '¿Se te antojó? Pide ahora',
          body: 'Entrega a domicilio en tu zona o pasa a recoger tu pedido.',
          primaryAction: linkWhatsApp,
          secondaryAction: { label: 'Llamar', href: 'tel:+50200000000' },
        },
      ],
    },
  ],
  changelog: [{ version: '1.0.0', notes: 'Initial release.' }],
});

export default template;

// Not read by the renderer; used by generators and the extraction skills.
export const templateExtensions = {
  source: 'live-sketching/eatery-cafe/organic/organic-web-site/index.html',
  taxonomy: {
    industries: ['food-and-beverage', 'casual-eatery', 'cafe'],
    visualStyle: {
      primary: 'organic',
      secondary: ['playful-illustrated', 'soft-rounded-modern'],
      notStyles: ['corporate', 'luxury', 'brutalist', 'editorial', 'dark-moody'],
    },
    tone: ['warm', 'cheerful', 'appetizing', 'casual'],
    conversion: { primary: 'order-online', secondary: ['promotional-offer', 'reserve-table', 'view-menu'] },
    positioning: 'budget',
  },
  patterns: [
    'daily-specials',
    'promo-badge',
    'menu-category-tabs',
    'menu-search',
    'menu-dot-leaders',
    'section-header-action',
    'media-text-split',
    'review-rating',
    'table-reservation',
    'location-card',
    'organic-blobs',
    'line-doodles',
    'plate-photo-frame',
    'vertical-side-label',
    'transparent-header',
    'scroll-reveal',
  ],
  assets: {
    required: ['logo (SVG wordmark)', 'cut-out top-down food photos, square, transparent or plain background'],
    optional: ['hero dish photo 1000×1000', 'favorite dish photos 500×500'],
    placeholderImages: [
      'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&h=600&q=75&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=600&q=75&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&h=600&q=75&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&h=600&q=75&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&h=600&q=75&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600&h=600&q=75&auto=format&fit=crop',
    ],
  },
  requiredContent: [
    'pages.index.sections.hero.subheading',
    'pages.index.sections.special',
    'pages.index.sections.menu.categories',
    'pages.index.sections.favorites.items',
    'pages.index.sections.offers.items',
    'pages.index.sections.about.body',
    'pages.index.sections.gallery.images',
    'pages.index.sections.reviews.items',
    'pages.index.sections.reserve.primaryAction',
    'pages.index.sections.visit',
    'pages.index.sections.order.primaryAction',
    'pages.index.sections.order.secondaryAction',
    'footer.columns',
    'footer.social',
  ],
} as const;
