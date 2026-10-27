import { getTranslations } from 'next-intl/server';
import type { PublicSkillCategory } from '@devprofile/shared';
import { ChipList } from '@/components/ui/chip';
import { Section } from '@/components/ui/section';
import { sections } from '@/lib/sections';

/**
 * One row per category (label, then its skills), like the "Linguagens: …" lines
 * on a CV. Rows stay easy to scan no matter how many skills a category gets.
 */
export async function SkillsSection({
  categories,
}: {
  categories: PublicSkillCategory[];
}) {
  const tNav = await getTranslations('nav');

  return (
    <Section section={sections[3]} title={tNav('skills')}>
      <dl className="divide-y divide-line overflow-hidden rounded-lg border border-line">
        {categories.map((category) => (
          <div
            key={category.key}
            className="grid gap-2 px-4 py-3.5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6"
          >
            <dt className="text-sm font-medium text-fg sm:pt-0.5">
              {category.name}
            </dt>
            <dd>
              <ChipList items={category.skills} />
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
