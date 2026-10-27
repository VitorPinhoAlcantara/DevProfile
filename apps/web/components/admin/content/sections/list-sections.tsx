'use client';

import type { PortfolioContent } from '@devprofile/shared';
import { Card, Checkbox, Notice } from '@/components/admin/ui';
import {
  emptyList,
  emptyText,
  ListEditor,
  LocalizedField,
  LocalizedLines,
  OptionalTextField,
  SelectField,
  SkillPicker,
  TextField,
  VisibilityFields,
} from '../fields';
import {
  contactKindLabels,
  cvProfileLabels,
  employmentTypeLabels,
  languageLevelLabels,
} from '../labels';
import type { SectionProps } from '../types';

/** Skills grouped by category, as the pickers show them. */
export function skillCatalog(content: PortfolioContent) {
  return content.skillCategories.map((category) => ({
    category: category.name.pt,
    skills: category.skills.map((skill) => skill.name),
  }));
}

const visibilityOf = (item: { showOnSite: boolean; showOnCv: boolean }) => ({
  showOnSite: item.showOnSite,
  showOnCv: item.showOnCv,
});

const hiddenMark = (item: { showOnSite: boolean; showOnCv: boolean }) =>
  [!item.showOnSite && 'fora do site', !item.showOnCv && 'fora do CV']
    .filter(Boolean)
    .join(' · ') || null;

export function ContactsSection({ content, update }: SectionProps) {
  return (
    <ListEditor
      items={content.contacts}
      onChange={(contacts) => update((d) => void (d.contacts = contacts))}
      itemTitle={(c) => `${contactKindLabels[c.kind]} · ${c.value}`}
      itemSubtitle={hiddenMark}
      addLabel="Adicionar contato"
      emptyLabel="Nenhum contato."
      createItem={() => ({
        kind: 'OTHER' as const,
        label: '',
        value: '',
        href: '',
        showOnSite: true,
        showOnCv: true,
      })}
      renderItem={(contact, set) => (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Tipo"
              value={contact.kind}
              options={contactKindLabels}
              onChange={(kind) => set({ ...contact, kind })}
            />
            <TextField
              label="Rótulo"
              value={contact.label}
              onChange={(label) => set({ ...contact, label })}
              placeholder="LinkedIn"
            />
            <TextField
              label="Texto exibido"
              value={contact.value}
              onChange={(value) => set({ ...contact, value })}
              placeholder="linkedin.com/in/usuario"
              hint="É o que aparece impresso no currículo."
            />
            <TextField
              label="Link"
              value={contact.href}
              onChange={(href) => set({ ...contact, href })}
              placeholder="https://… , mailto:… ou tel:…"
            />
          </div>
          <VisibilityFields
            value={visibilityOf(contact)}
            onChange={(v) => set({ ...contact, ...v })}
          />
        </>
      )}
    />
  );
}

export function SkillsSection({ content, update }: SectionProps) {
  return (
    <div className="space-y-4">
      <Notice tone="info">
        O nome em português é o identificador usado em experiências e projetos.
        O nome em inglês só é necessário quando muda (competências
        comportamentais, por exemplo).
      </Notice>
      <ListEditor
        items={content.skillCategories}
        onChange={(skillCategories) =>
          update((d) => void (d.skillCategories = skillCategories))
        }
        itemTitle={(c) => c.name.pt}
        itemSubtitle={(c) =>
          `${c.skills.length} itens${c.kind === 'SOFT' ? ' · comportamental' : ''}`
        }
        addLabel="Adicionar categoria"
        emptyLabel="Nenhuma categoria."
        createItem={() => ({
          key: `categoria-${Date.now().toString(36)}`,
          name: emptyText(),
          kind: 'TECHNICAL' as const,
          skills: [],
        })}
        renderItem={(category, set) => (
          <>
            <LocalizedField
              label="Nome da categoria"
              value={category.name}
              onChange={(name) => set({ ...category, name })}
            />
            <SelectField
              label="Tipo"
              value={category.kind}
              options={{
                TECHNICAL: 'Técnica — aparece como tecnologia',
                SOFT: 'Comportamental — aparece à parte',
              }}
              onChange={(kind) => set({ ...category, kind })}
              className="max-w-sm"
            />
            <ListEditor
              items={category.skills}
              onChange={(skills) => set({ ...category, skills })}
              itemTitle={(s) => s.name}
              itemSubtitle={(s) =>
                [s.nameEn && `EN: ${s.nameEn}`, hiddenMark(s)]
                  .filter(Boolean)
                  .join(' · ') || null
              }
              addLabel="Adicionar skill"
              emptyLabel="Nenhuma skill nesta categoria."
              createItem={() => ({
                name: '',
                nameEn: null,
                showOnSite: true,
                showOnCv: true,
              })}
              renderItem={(skill, setSkill) => (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label="Nome"
                      value={skill.name}
                      onChange={(name) => setSkill({ ...skill, name })}
                      hint="Use o nome oficial (Node.js, PostgreSQL), como as vagas escrevem."
                    />
                    <OptionalTextField
                      label="Nome em inglês (opcional)"
                      value={skill.nameEn}
                      onChange={(nameEn) => setSkill({ ...skill, nameEn })}
                    />
                  </div>
                  <VisibilityFields
                    value={visibilityOf(skill)}
                    onChange={(v) => setSkill({ ...skill, ...v })}
                  />
                </>
              )}
            />
          </>
        )}
      />
    </div>
  );
}

export function ExperiencesSection({ content, update }: SectionProps) {
  const catalog = skillCatalog(content);
  return (
    <ListEditor
      items={content.experiences}
      onChange={(experiences) =>
        update((d) => void (d.experiences = experiences))
      }
      itemTitle={(e) => `${e.role.pt} · ${e.company}`}
      itemSubtitle={(e) =>
        [
          `${e.period.start} → ${e.period.end ?? 'atual'}`,
          employmentTypeLabels[e.employmentType],
          hiddenMark(e),
        ]
          .filter(Boolean)
          .join(' · ')
      }
      addLabel="Adicionar experiência"
      emptyLabel="Nenhuma experiência."
      createItem={() => ({
        company: '',
        companyUrl: null,
        role: emptyText(),
        employmentType: 'INTERNSHIP' as const,
        location: null,
        workMode: null,
        period: { start: new Date().toISOString().slice(0, 7), end: null },
        summary: emptyText(),
        cvBullets: emptyList(),
        skills: [],
        showOnSite: true,
        showOnCv: true,
      })}
      renderItem={(exp, set) => (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Empresa / organização"
              value={exp.company}
              onChange={(company) => set({ ...exp, company })}
            />
            <OptionalTextField
              label="Site da empresa"
              value={exp.companyUrl}
              onChange={(companyUrl) => set({ ...exp, companyUrl })}
              type="url"
            />
            <SelectField
              label="Tipo"
              value={exp.employmentType}
              options={employmentTypeLabels}
              onChange={(employmentType) => set({ ...exp, employmentType })}
            />
            <OptionalTextField
              label="Local (opcional)"
              value={exp.location}
              onChange={(location) => set({ ...exp, location })}
            />
            <TextField
              label="Início"
              type="month"
              value={exp.period.start}
              onChange={(start) =>
                set({ ...exp, period: { ...exp.period, start } })
              }
            />
            <div>
              <OptionalTextField
                label="Fim"
                type="month"
                value={exp.period.end}
                onChange={(end) =>
                  set({ ...exp, period: { ...exp.period, end } })
                }
                hint="Vazio = trabalho atual."
              />
            </div>
          </div>
          <LocalizedField
            label="Cargo"
            value={exp.role}
            onChange={(role) => set({ ...exp, role })}
          />
          <LocalizedField
            label="Descrição no site"
            value={exp.summary}
            onChange={(summary) => set({ ...exp, summary })}
            multiline
          />
          <LocalizedLines
            label="Bullets do currículo"
            value={exp.cvBullets}
            onChange={(cvBullets) => set({ ...exp, cvBullets })}
            hint="3 a 5 por experiência, 1 a 2 linhas cada. Comece com verbo e traga um número quando puder."
          />
          <SkillPicker
            catalog={catalog}
            value={exp.skills}
            onChange={(skills) => set({ ...exp, skills })}
          />
          <VisibilityFields
            value={visibilityOf(exp)}
            onChange={(v) => set({ ...exp, ...v })}
          />
        </>
      )}
    />
  );
}

export function EducationSection({ content, update }: SectionProps) {
  return (
    <ListEditor
      items={content.education}
      onChange={(education) => update((d) => void (d.education = education))}
      itemTitle={(e) => e.degree.pt}
      itemSubtitle={(e) => e.institutionShort ?? e.institution}
      addLabel="Adicionar formação"
      emptyLabel="Nenhuma formação."
      createItem={() => ({
        institution: '',
        institutionShort: null,
        degree: emptyText(),
        period: { start: new Date().toISOString().slice(0, 7), end: null },
        endIsExpected: true,
        summary: emptyText(),
        showOnSite: true,
        showOnCv: true,
      })}
      renderItem={(edu, set) => (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Instituição"
              value={edu.institution}
              onChange={(institution) => set({ ...edu, institution })}
            />
            <OptionalTextField
              label="Sigla"
              value={edu.institutionShort}
              onChange={(institutionShort) => set({ ...edu, institutionShort })}
            />
            <TextField
              label="Início"
              type="month"
              value={edu.period.start}
              onChange={(start) =>
                set({ ...edu, period: { ...edu.period, start } })
              }
            />
            <OptionalTextField
              label="Conclusão"
              type="month"
              value={edu.period.end}
              onChange={(end) =>
                set({ ...edu, period: { ...edu.period, end } })
              }
            />
          </div>
          <Checkbox
            label="A conclusão é uma previsão"
            checked={edu.endIsExpected}
            onChange={(endIsExpected) => set({ ...edu, endIsExpected })}
          />
          <LocalizedField
            label="Curso"
            value={edu.degree}
            onChange={(degree) => set({ ...edu, degree })}
          />
          <LocalizedField
            label="Descrição"
            value={edu.summary}
            onChange={(summary) => set({ ...edu, summary })}
            multiline
            rows={3}
          />
          <VisibilityFields
            value={visibilityOf(edu)}
            onChange={(v) => set({ ...edu, ...v })}
          />
        </>
      )}
    />
  );
}

export function CertificationsSection({ content, update }: SectionProps) {
  return (
    <ListEditor
      items={content.certifications}
      onChange={(certifications) =>
        update((d) => void (d.certifications = certifications))
      }
      itemTitle={(c) => c.name}
      itemSubtitle={(c) => c.issuer}
      addLabel="Adicionar certificação"
      emptyLabel="Nenhuma certificação."
      createItem={() => ({
        name: '',
        issuer: '',
        issuedAt: String(new Date().getFullYear()),
        expiresAt: null,
        credentialUrl: null,
        note: emptyText(),
        showOnSite: true,
        showOnCv: true,
      })}
      renderItem={(cert, set) => (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Nome oficial"
              value={cert.name}
              onChange={(name) => set({ ...cert, name })}
            />
            <TextField
              label="Emissor"
              value={cert.issuer}
              onChange={(issuer) => set({ ...cert, issuer })}
            />
            <TextField
              label="Emitida em"
              value={cert.issuedAt}
              onChange={(issuedAt) => set({ ...cert, issuedAt })}
              placeholder="2025-02"
              hint="AAAA-MM, ou só AAAA se não souber o mês."
            />
            <OptionalTextField
              label="Válida até"
              value={cert.expiresAt}
              onChange={(expiresAt) => set({ ...cert, expiresAt })}
              placeholder="2028-02"
            />
            <OptionalTextField
              label="Link de verificação"
              value={cert.credentialUrl}
              onChange={(credentialUrl) => set({ ...cert, credentialUrl })}
              type="url"
              className="md:col-span-2"
            />
          </div>
          <LocalizedField
            label="Observação"
            value={cert.note}
            onChange={(note) => set({ ...cert, note })}
            multiline
            rows={2}
          />
          <VisibilityFields
            value={visibilityOf(cert)}
            onChange={(v) => set({ ...cert, ...v })}
          />
        </>
      )}
    />
  );
}

export function LanguagesSection({ content, update }: SectionProps) {
  return (
    <ListEditor
      items={content.languages}
      onChange={(languages) => update((d) => void (d.languages = languages))}
      itemTitle={(l) => `${l.name.pt} · ${languageLevelLabels[l.level]}`}
      addLabel="Adicionar idioma"
      emptyLabel="Nenhum idioma."
      createItem={() => ({
        name: emptyText(),
        level: 'BASIC' as const,
        showOnSite: true,
        showOnCv: true,
      })}
      renderItem={(lang, set) => (
        <>
          <LocalizedField
            label="Idioma"
            value={lang.name}
            onChange={(name) => set({ ...lang, name })}
          />
          <SelectField
            label="Nível"
            value={lang.level}
            options={languageLevelLabels}
            onChange={(level) => set({ ...lang, level })}
            className="max-w-xs"
          />
          <VisibilityFields
            value={visibilityOf(lang)}
            onChange={(v) => set({ ...lang, ...v })}
          />
        </>
      )}
    />
  );
}

export function SettingsSection({ content, update }: SectionProps) {
  return (
    <Card className="space-y-4">
      <SelectField
        label="Modelo do currículo"
        value={content.settings.cvProfile}
        options={cvProfileLabels}
        onChange={(cvProfile) =>
          update((d) => void (d.settings.cvProfile = cvProfile))
        }
        className="max-w-md"
      />
      <SelectField
        label="Fonte do currículo"
        value={content.settings.cvFont}
        options={{
          SANS: 'Source Sans 3 — sem serifa, leitura rápida na tela',
          SERIF: 'New Computer Modern — serifada, estilo LaTeX/Jake’s Resume',
        }}
        onChange={(cvFont) => update((d) => void (d.settings.cvFont = cvFont))}
        className="max-w-md"
      />
      <p className="text-sm text-soft">
        O modelo define a ordem das seções no PDF gerado. Use Júnior para vagas
        júnior/trainee e Estágio para programas de estágio, que filtram pela
        formação.
      </p>
    </Card>
  );
}
