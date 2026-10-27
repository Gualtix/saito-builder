import { TemplateRegistry } from '@saito/core';
import casualEateryV1 from './casual-eatery/v1.ts';
import corporateV1 from './corporate/v1.ts';
import eventV1 from './event/v1.ts';
import landingV1 from './landing/v1.ts';
import landingV2 from './landing/v2.ts';
import restaurantV1 from './restaurant/v1.ts';

export { themes } from './themes.ts';

/** Every template version available to sites. Add new templates or versions here. */
export const registry = new TemplateRegistry([landingV1, landingV2, corporateV1, restaurantV1, eventV1, casualEateryV1]);
