import type { SectionType } from '@saito/core';
import Contact from './sections/Contact.astro';
import Countdown from './sections/Countdown.astro';
import Cta from './sections/Cta.astro';
import Faq from './sections/Faq.astro';
import Features from './sections/Features.astro';
import Gallery from './sections/Gallery.astro';
import Hero from './sections/Hero.astro';
import LogoCloud from './sections/LogoCloud.astro';
import Menu from './sections/Menu.astro';
import Pricing from './sections/Pricing.astro';
import Products from './sections/Products.astro';
import RichText from './sections/RichText.astro';
import Schedule from './sections/Schedule.astro';
import Stats from './sections/Stats.astro';
import Team from './sections/Team.astro';
import Testimonials from './sections/Testimonials.astro';

export { default as SiteLayout } from './layout/SiteLayout.astro';

/**
 * Section type → component. Every section type in the core schema must have an entry;
 * the `Record<SectionType, …>` type makes a missing component a compile error.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sectionComponents: Record<SectionType, (props: any) => any> = {
  hero: Hero,
  features: Features,
  stats: Stats,
  logoCloud: LogoCloud,
  testimonials: Testimonials,
  pricing: Pricing,
  faq: Faq,
  cta: Cta,
  richText: RichText,
  gallery: Gallery,
  team: Team,
  menu: Menu,
  products: Products,
  contact: Contact,
  schedule: Schedule,
  countdown: Countdown,
};
