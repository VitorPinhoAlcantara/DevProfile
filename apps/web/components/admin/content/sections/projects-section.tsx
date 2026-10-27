'use client';

import { Plus, Trash2 } from 'lucide-react';
import { ImageField } from '@/components/admin/media-library';
import { Button, Checkbox, IconButton } from '@/components/admin/ui';
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
import { linkKindLabels } from '../labels';
import { MarkdownEditor } from '../markdown-editor';
import type { SectionProps } from '../types';
import { skillCatalog } from './list-sections';

const toSlug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function ProjectsSection({ content, update }: SectionProps) {
  const catalog = skillCatalog(content);

  return (
    <ListEditor
      items={content.projects}
      onChange={(projects) => update((d) => void (d.projects = projects))}
      itemTitle={(p) => p.name}
      itemSubtitle={(p) =>
        [
          `/projects/${p.slug}`,
          p.featured && 'destaque',
          !p.body && 'sem página',
          !p.showOnSite && 'fora do site',
          !p.showOnCv && 'fora do CV',
        ]
          .filter(Boolean)
          .join(' · ')
      }
      addLabel="Adicionar projeto"
      emptyLabel="Nenhum projeto."
      createItem={() => ({
        slug: `projeto-${Date.now().toString(36)}`,
        name: '',
        tagline: emptyText(),
        summary: emptyText(),
        cvBullets: emptyList(),
        period: null,
        featured: false,
        body: null,
        cover: null,
        links: [],
        skills: [],
        showOnSite: true,
        showOnCv: true,
      })}
      renderItem={(project, set) => (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Nome"
              value={project.name}
              onChange={(name) =>
                // New projects follow the name until the slug is edited by hand.
                set({
                  ...project,
                  name,
                  slug:
                    project.slug.startsWith('projeto-') ||
                    project.slug === toSlug(project.name)
                      ? toSlug(name) || project.slug
                      : project.slug,
                })
              }
            />
            <TextField
              label="Endereço (slug)"
              value={project.slug}
              onChange={(slug) => set({ ...project, slug: toSlug(slug) })}
              hint={`Página: /projects/${project.slug}`}
            />
            <TextField
              label="Início (opcional)"
              type="month"
              value={project.period?.start ?? ''}
              onChange={(start) =>
                set({
                  ...project,
                  period: start
                    ? { start, end: project.period?.end ?? null }
                    : null,
                })
              }
            />
            {project.period && (
              <OptionalTextField
                label="Fim"
                type="month"
                value={project.period.end}
                onChange={(end) =>
                  set({
                    ...project,
                    period: { start: project.period!.start, end },
                  })
                }
                hint="Vazio = em andamento."
              />
            )}
          </div>

          <Checkbox
            label="Projeto em destaque"
            checked={project.featured}
            onChange={(featured) => set({ ...project, featured })}
          />

          <ImageField
            label="Capa"
            value={project.cover}
            onChange={(cover) => set({ ...project, cover })}
            hint="Aparece no card e no topo da página do projeto. Um print de 16:9 funciona melhor."
          />

          <LocalizedField
            label="Frase curta"
            value={project.tagline}
            onChange={(tagline) => set({ ...project, tagline })}
          />
          <LocalizedField
            label="Resumo"
            value={project.summary}
            onChange={(summary) => set({ ...project, summary })}
            multiline
            rows={3}
            hint="Usado quando o projeto não tem página própria."
          />

          <MarkdownEditor
            value={project.body}
            onChange={(body) => set({ ...project, body })}
          />

          <fieldset>
            <legend className="mb-1.5 text-sm text-muted">Links</legend>
            <div className="space-y-2">
              {project.links.map((link, index) => {
                const setLink = (next: typeof link) =>
                  set({
                    ...project,
                    links: project.links.map((l, i) =>
                      i === index ? next : l,
                    ),
                  });
                return (
                  <div
                    key={index}
                    className="grid items-end gap-2 md:grid-cols-[10rem_10rem_minmax(0,1fr)_auto]"
                  >
                    <SelectField
                      label="Tipo"
                      value={link.kind}
                      options={linkKindLabels}
                      onChange={(kind) => setLink({ ...link, kind })}
                    />
                    <TextField
                      label="Rótulo"
                      value={link.label}
                      onChange={(label) => setLink({ ...link, label })}
                    />
                    <TextField
                      label="URL"
                      type="url"
                      value={link.href}
                      onChange={(href) => setLink({ ...link, href })}
                    />
                    <IconButton
                      label="Remover link"
                      className="mb-0.5 hover:text-del"
                      onClick={() =>
                        set({
                          ...project,
                          links: project.links.filter((_, i) => i !== index),
                        })
                      }
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </IconButton>
                  </div>
                );
              })}
              <Button
                onClick={() =>
                  set({
                    ...project,
                    links: [
                      ...project.links,
                      {
                        kind: 'REPOSITORY' as const,
                        label: 'GitHub',
                        href: '',
                      },
                    ],
                  })
                }
              >
                <Plus className="size-4" aria-hidden />
                Adicionar link
              </Button>
            </div>
          </fieldset>

          <LocalizedLines
            label="Bullets do currículo"
            value={project.cvBullets}
            onChange={(cvBullets) => set({ ...project, cvBullets })}
            hint="1 a 3 por projeto: o que foi feito, com qual stack e qual resultado."
          />
          <SkillPicker
            catalog={catalog}
            value={project.skills}
            onChange={(skills) => set({ ...project, skills })}
          />
          <VisibilityFields
            value={{
              showOnSite: project.showOnSite,
              showOnCv: project.showOnCv,
            }}
            onChange={(v) => set({ ...project, ...v })}
          />
        </>
      )}
    />
  );
}
