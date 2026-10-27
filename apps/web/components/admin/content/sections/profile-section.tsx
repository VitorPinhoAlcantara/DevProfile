'use client';

import { type PortfolioContent, workModes } from '@devprofile/shared';
import { ImageField } from '@/components/admin/media-library';
import { Card, Checkbox } from '@/components/admin/ui';
import { LocalizedField, SelectField, TextField } from '../fields';
import { workModeLabels } from '../labels';
import type { Update } from '../types';

export function ProfileSection({
  content,
  update,
}: {
  content: PortfolioContent;
  update: Update;
}) {
  const profile = content.profile;
  const set = <K extends keyof typeof profile>(
    key: K,
    value: (typeof profile)[K],
  ) =>
    update((draft) => {
      draft.profile[key] = value;
    });

  return (
    <div className="space-y-5">
      <Card className="space-y-5">
        <h2 className="font-medium text-fg">Identidade</h2>
        <ImageField
          label="Foto do perfil"
          value={profile.photo}
          onChange={(photo) => set('photo', photo)}
          hint="Aparece só no site. O currículo não leva foto."
        />
        <TextField
          label="Nome completo"
          value={profile.fullName}
          onChange={(v) => set('fullName', v)}
        />
        <LocalizedField
          label="Cargo"
          value={profile.headline}
          onChange={(v) => set('headline', v)}
        />
        <LocalizedField
          label="Localização"
          value={profile.location}
          onChange={(v) => set('location', v)}
          hint='No CV em português use "Cidade – UF, Brasil"; em inglês, "Cidade, Brazil".'
        />
      </Card>

      <Card className="space-y-5">
        <h2 className="font-medium text-fg">Disponibilidade</h2>
        <SelectField
          label="Situação"
          value={profile.availability}
          options={{
            OPEN_TO_WORK: 'Disponível para trabalhar',
            NOT_LOOKING: 'Não estou buscando',
          }}
          onChange={(v) => set('availability', v)}
          className="max-w-xs"
        />
        <fieldset>
          <legend className="mb-1.5 text-sm text-muted">
            Modelos de trabalho
          </legend>
          <div className="flex flex-wrap gap-5">
            {workModes.map((mode) => (
              <Checkbox
                key={mode}
                label={workModeLabels[mode]}
                checked={profile.workModes.includes(mode)}
                onChange={(checked) =>
                  set(
                    'workModes',
                    checked
                      ? workModes.filter(
                          (m) => m === mode || profile.workModes.includes(m),
                        )
                      : profile.workModes.filter((m) => m !== mode),
                  )
                }
              />
            ))}
          </div>
        </fieldset>
        <LocalizedField
          label="Nota de disponibilidade"
          value={profile.availabilityNote}
          onChange={(v) => set('availabilityNote', v)}
          multiline
          rows={2}
        />
      </Card>

      <Card className="space-y-5">
        <h2 className="font-medium text-fg">Textos</h2>
        <LocalizedField
          label="Resumo do site"
          value={profile.summary}
          onChange={(v) => set('summary', v)}
          multiline
          rows={6}
        />
        <LocalizedField
          label="Resumo do currículo"
          value={profile.cvSummary}
          onChange={(v) => set('cvSummary', v)}
          multiline
          rows={3}
          hint="Perfil Júnior. 2 a 3 linhas, até ~50 palavras: cargo-alvo e stack principal."
        />
        <LocalizedField
          label="Objetivo do currículo"
          value={profile.cvObjective}
          onChange={(v) => set('cvObjective', v)}
          hint='Perfil Estágio. Uma linha, por exemplo "Estágio em Desenvolvimento Back-end".'
        />
      </Card>
    </div>
  );
}
