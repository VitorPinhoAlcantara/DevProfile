import type { PortfolioContent } from '@devprofile/shared';

/** Mutates a copy of the draft; the editor swaps it in as the new state. */
export type Update = (recipe: (draft: PortfolioContent) => void) => void;

export type SectionProps = {
  content: PortfolioContent;
  update: Update;
};
