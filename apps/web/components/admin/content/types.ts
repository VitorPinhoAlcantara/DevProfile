import type { PortfolioContent } from '@devprofile/shared';

export type Update = (recipe: (draft: PortfolioContent) => void) => void;

export type SectionProps = {
  content: PortfolioContent;
  update: Update;
};
