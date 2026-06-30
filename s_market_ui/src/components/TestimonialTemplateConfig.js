import {
  CardClassic, CardBold, CardMinimal, CardBubble, CardSplit,
  LayoutSingle, LayoutMulti, LayoutFade, LayoutGrid, LayoutFullWidth,
} from './TestimonialTemplates';

const templateMeta = {
  classic: { name: 'Classic', Card: CardClassic, desc: 'Clean centered card with quote icon' },
  bold: { name: 'Bold', Card: CardBold, desc: 'Large avatar & product image hero' },
  minimal: { name: 'Minimal', Card: CardMinimal, desc: 'Compact card with stars & short text' },
  bubble: { name: 'Bubble', Card: CardBubble, desc: 'Speech bubble with accent gradient' },
  split: { name: 'Split', Card: CardSplit, desc: 'Two-column: profile & review side-by-side' },
};

const sliderMeta = {
  single: { name: 'Single', Layout: LayoutSingle, desc: 'One card centered with arrows' },
  multi: { name: 'Multi-Card', Layout: LayoutMulti, desc: '2-3 cards visible at once' },
  fade: { name: 'Fade', Layout: LayoutFade, desc: 'Crossfade transition' },
  grid: { name: 'Grid', Layout: LayoutGrid, desc: 'Static grid, no sliding' },
  fullwidth: { name: 'Full Width', Layout: LayoutFullWidth, desc: 'Full-bleed with overlay' },
};

export const CARD_TEMPLATES = Object.entries(templateMeta).map(([key, val]) => ({ key, ...val }));

export const getCardComponent = (key) => {
  const found = templateMeta[key];
  return found ? found.Card : CardClassic;
};

export const SLIDER_LAYOUTS = Object.entries(sliderMeta).map(([key, val]) => ({ key, ...val }));

export const getLayoutComponent = (key) => {
  const found = sliderMeta[key];
  return found ? found.Layout : LayoutSingle;
};

// Layout components re-exported for TestimonialCarousel
export { LayoutGrid, LayoutFullWidth };
