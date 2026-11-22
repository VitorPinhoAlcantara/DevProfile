'use client';

import { Check, Copy, Download, Pencil, Trash2 } from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  type ShortLink,
  type ShortLinkInput,
  linkMediums,
  shortLinkSchema,
} from '@devprofile/shared';
import { AdminShell } from '@/components/admin/admin-shell';
import {
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Notice,
  PageHeader,
  Select,
  TextInput,
} from '@/components/admin/ui';
import { AdminApiError, adminFetch } from '@/lib/admin-api';

const mediumLabels: Record<(typeof linkMediums)[number], string> = {
  curriculo: 'Currículo enviado',
  social: 'Rede social',
  email: 'E-mail',
  mensagem: 'Mensagem (WhatsApp, DM)',
  evento: 'Evento ou palestra',
  outro: 'Outro',
};

const toSlug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const emptyForm = {
  slug: '',
  source: '',
  medium: 'curriculo',
  campaign: '',
  destination: '/',
  note: '',
};
type Form = typeof emptyForm;

const toInput = (form: Form): ShortLinkInput => ({
  slug: toSlug(form.slug),
  source: toSlug(form.source),
  medium: toSlug(form.medium),
  campaign: toSlug(form.campaign) || null,
  destination: form.destination.trim() || '/',
  note: form.note.trim() || null,
});

export default function LinksPage() {
  return (
    <AdminShell>
      <LinksView />
    </AdminShell>
  );
}

function LinksView() {
  const [links, setLinks] = useState<ShortLink[] | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLinks(await adminFetch('/links', shortLinkSchema.array()));
    } catch (err) {
      setNotice({ tone: 'error', text: (err as Error).message });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  const reset = () => {
    setForm(emptyForm);
    setEditing(null);
    setSlugTouched(false);
    setErrors({});
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setNotice(null);
    try {
      const saved = await adminFetch(
        editing ? `/links/${editing}` : '/links',
        shortLinkSchema,
        { method: editing ? 'PUT' : 'POST', body: toInput(form) },
      );
      setNotice({
        tone: 'success',
        text: `Link ${editing ? 'atualizado' : 'criado'}: ${saved.url}`,
      });
      reset();
      await load();
    } catch (err) {
      if (err instanceof AdminApiError && err.details.length) {
        setErrors(
          Object.fromEntries(err.details.map((d) => [d.path, d.message])),
        );
      } else {
        setNotice({ tone: 'error', text: (err as Error).message });
      }
    } finally {
      setSaving(false);
    }
  };

  const edit = (link: ShortLink) => {
    setEditing(link.id);
    setSlugTouched(true);
    setErrors({});
    setForm({
      slug: link.slug,
      source: link.source,
      medium: link.medium,
      campaign: link.campaign ?? '',
      destination: link.destination,
      note: link.note ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (link: ShortLink) => {
    if (
      !window.confirm(
        `Apagar ${link.url}? Quem já tem esse link vai cair na página inicial, sem UTM.`,
      )
    )
      return;
    try {
      await adminFetch(`/links/${link.id}`, undefined, { method: 'DELETE' });
      if (editing === link.id) reset();
      await load();
    } catch (err) {
      setNotice({ tone: 'error', text: (err as Error).message });
    }
  };

  const copy = async (link: ShortLink) => {
    await navigator.clipboard.writeText(link.url);
    setCopied(link.id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <>
      <PageHeader
        title="Links"
        method="POST"
        endpoint="/api/admin/links"
        description="Links curtos que levam ao site com UTM, para o Umami mostrar de onde veio cada visita. Um link do tipo currículo também gera um currículo próprio: todos os links do PDF passam por ele."
      />

      {notice && (
        <div className="mb-4">
          <Notice tone={notice.tone}>{notice.text}</Notice>
        </div>
      )}

      <Card className="mb-6">
        <form onSubmit={(e) => void save(e)} className="space-y-4">
          <h2 className="font-medium text-fg">
            {editing ? 'Editar link' : 'Novo link'}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="De onde vem (fonte)"
              hint="A empresa, a rede ou o lugar onde o link vai aparecer. Vira utm_source."
              error={errors.source}
            >
              {(id) => (
                <TextInput
                  id={id}
                  required
                  value={form.source}
                  placeholder="empresa-x"
                  onChange={(e) => {
                    const source = e.target.value;
                    set({
                      source,
                      ...(slugTouched ? {} : { slug: toSlug(source) }),
                    });
                  }}
                />
              )}
            </Field>
            <Field
              label="Tipo"
              hint="Vira utm_medium. Currículo enviado libera o PDF personalizado."
              error={errors.medium}
            >
              {(id) => (
                <Select
                  id={id}
                  value={form.medium}
                  onChange={(e) => set({ medium: e.target.value })}
                >
                  {linkMediums.map((medium) => (
                    <option key={medium} value={medium}>
                      {mediumLabels[medium]}
                    </option>
                  ))}
                  {!(linkMediums as readonly string[]).includes(
                    form.medium,
                  ) && <option value={form.medium}>{form.medium}</option>}
                </Select>
              )}
            </Field>
            <Field
              label="Campanha (opcional)"
              hint="Para separar envios da mesma fonte, como a vaga. Vira utm_campaign."
              error={errors.campaign}
            >
              {(id) => (
                <TextInput
                  id={id}
                  value={form.campaign}
                  placeholder="vaga-backend"
                  onChange={(e) => set({ campaign: e.target.value })}
                />
              )}
            </Field>
            <Field
              label="Endereço"
              hint={`O link fica /r/${form.slug || '…'} no seu domínio.`}
              error={errors.slug}
            >
              {(id) => (
                <TextInput
                  id={id}
                  required
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set({ slug: toSlug(e.target.value) });
                  }}
                />
              )}
            </Field>
            <Field
              label="Página de destino"
              hint="Caminho no site: / para o início, /projects/streeturban para um projeto."
              error={errors.destination}
            >
              {(id) => (
                <TextInput
                  id={id}
                  value={form.destination}
                  onChange={(e) => set({ destination: e.target.value })}
                />
              )}
            </Field>
            <Field label="Nota (opcional)" error={errors.note}>
              {(id) => (
                <TextInput
                  id={id}
                  value={form.note}
                  placeholder="Para quem foi, quando…"
                  onChange={(e) => set({ note: e.target.value })}
                />
              )}
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Salvando…' : editing ? 'Salvar' : 'Criar link'}
            </Button>
            {editing && (
              <Button variant="ghost" onClick={reset}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      {!links ? (
        <p className="font-mono text-sm text-soft">Carregando…</p>
      ) : links.length === 0 ? (
        <EmptyState>Nenhum link ainda. Crie o primeiro acima.</EmptyState>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-panel">
          {links.map((link) => (
            <li key={link.id} className="space-y-2 px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <code className="font-mono text-sm text-fg">
                  /r/{link.slug}
                </code>
                <span className="text-sm text-muted">
                  {[
                    link.source,
                    mediumLabels[link.medium as keyof typeof mediumLabels] ??
                      link.medium,
                    link.campaign,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                <span className="ml-auto font-mono text-xs text-soft">
                  {link.clicks} {link.clicks === 1 ? 'clique' : 'cliques'}
                </span>
                <IconButton
                  label={copied === link.id ? 'Copiado' : 'Copiar link'}
                  onClick={() => void copy(link)}
                >
                  {copied === link.id ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    <Copy className="size-4" aria-hidden />
                  )}
                </IconButton>
                <IconButton label="Editar" onClick={() => edit(link)}>
                  <Pencil className="size-4" aria-hidden />
                </IconButton>
                <IconButton
                  label="Apagar"
                  onClick={() => void remove(link)}
                  className="hover:text-del"
                >
                  <Trash2 className="size-4" aria-hidden />
                </IconButton>
              </div>
              {(link.note || link.destination !== '/') && (
                <p className="text-xs text-soft">
                  {[
                    link.destination !== '/' && `Destino: ${link.destination}`,
                    link.note,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              {link.medium === 'curriculo' && (
                <div className="flex flex-wrap gap-2">
                  {(['pt-BR', 'en'] as const).flatMap((lang) =>
                    (['pdf', 'docx'] as const).map((format) => (
                      <a
                        key={`${lang}-${format}`}
                        href={`/api/v1/cv?lang=${lang}&format=${format}&link=${link.slug}`}
                        download
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs text-muted transition hover:border-line-strong hover:text-fg pointer-coarse:h-11"
                      >
                        <Download className="size-3.5" aria-hidden />
                        {format === 'pdf' ? 'PDF' : 'Word'}{' '}
                        {lang === 'en' ? 'EN' : 'PT'}
                      </a>
                    )),
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
