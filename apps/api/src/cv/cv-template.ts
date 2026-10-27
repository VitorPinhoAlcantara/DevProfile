// Typst source for the CV. Data comes in through `sys.inputs.data` as JSON and is
// only ever placed as text, never evaluated as markup.
//
// Layout follows docs/research/modelos-de-curriculo/relatorio.md: one column, no
// photo or icons, real-text headings, dates on the job-title line, one font family
// and ligatures off (safer for ATS text extraction). On top of that, a visual
// hierarchy for the ~7-second first scan: colored section headings, bold job
// titles and companies, and dates set apart on the right.
//
// `sys.inputs.density` sets the spacing between airy (0) and compact (1).
export const CV_TEMPLATE = String.raw`
#let data = json(bytes(sys.inputs.data))
// 0 = airiest spacing, 1 = most compact; the renderer searches for the airiest
// value that still fits the page.
#let t = float(sys.inputs.density)
#let mix(airy, compact) = airy + (compact - airy) * t

#let accent = rgb("#1f3b63")
#let muted = rgb("#4a5361")

#let spacing = (
  size: mix(11pt, 10.5pt),
  leading: mix(0.66em, 0.52em),
  par: mix(0.75em, 0.55em),
  bullet: mix(0.5em, 0.36em),
  section: mix(1.05em, 0.65em),
  item: mix(0.7em, 0.4em),
  mx: mix(1.8cm, 1.4cm),
  my: mix(1.5cm, 1.15cm),
)

#let fonts = (
  sans: "Source Sans 3",
  serif: "New Computer Modern",
)

#set document(title: data.title, author: data.name)
#set page(paper: "a4", margin: (x: spacing.mx, y: spacing.my))
#set text(
  font: fonts.at(data.font),
  size: spacing.size,
  lang: data.lang,
  ligatures: false,
  hyphenate: false,
)
#set par(justify: false, leading: spacing.leading, spacing: spacing.par)
#set list(marker: [•], indent: 0.3em, body-indent: 0.55em, spacing: spacing.bullet)
#show link: it => underline(offset: 2pt, stroke: 0.4pt + muted, it)

#let maybe-link(item) = if item.url == none { item.text } else { link(item.url, item.text) }

// Section headings are what the eye jumps between, so they get color and size.
#let section(title) = {
  v(spacing.section)
  block(
    below: 0.3em,
    text(size: spacing.size + 1.6pt, weight: "bold", fill: accent, tracking: 0.04em, upper(title)),
  )
  line(length: 100%, stroke: 0.8pt + accent)
  v(0.2em)
}

// Title on the left, date on the right, on the same line.
#let headline(title, date) = grid(
  columns: (1fr, auto),
  column-gutter: 1em,
  title, align(right, text(fill: muted, date)),
)

#let bullets(items) = if items.len() > 0 {
  v(0.05em)
  list(..items.map(b => [#b]))
}

#let company(name) = text(weight: "semibold", fill: accent, name)

// ---------------------------------------------------------------- header
#align(center)[
  #text(size: 22pt, weight: "bold", fill: accent, data.name)
  #v(-0.2em)
  #text(size: spacing.size - 1pt, fill: muted, data.contacts.map(c => box(maybe-link(c))).join([ #h(0.15em)·#h(0.15em) ]))
]

// ---------------------------------------------------------------- sections
#let render(key) = {
  let title = data.headings.at(key)
  if key == "intro" and data.intro != "" {
    section(title)
    data.intro
  } else if key == "skills" and data.skills.len() > 0 {
    section(title)
    for line in data.skills [
      #text(weight: "bold", line.label + ":") #line.items \
    ]
  } else if key == "experience" and data.experience.len() > 0 {
    section(title)
    for (i, job) in data.experience.enumerate() {
      if i > 0 { v(spacing.item) }
      headline(
        [#text(weight: "bold", job.role) #h(0.2em)·#h(0.2em) #company(job.company)#if job.detail != none [ #text(fill: muted, "(" + job.detail + ")")]],
        job.period,
      )
      bullets(job.bullets)
    }
  } else if key == "projects" and data.projects.len() > 0 {
    section(title)
    for (i, project) in data.projects.enumerate() {
      if i > 0 { v(spacing.item) }
      headline(
        [#company(project.name)#if project.stack != none [ #h(0.2em)·#h(0.2em) #text(fill: muted, style: "italic", project.stack)]#if project.link != none [ #h(0.2em)·#h(0.2em) #maybe-link(project.link)]],
        if project.period != none { project.period } else { [] },
      )
      bullets(project.bullets)
    }
  } else if key == "education" and data.education.len() > 0 {
    section(title)
    for (i, edu) in data.education.enumerate() {
      if i > 0 { v(spacing.item) }
      headline(text(weight: "bold", edu.degree), edu.period)
      company(edu.institution)
    }
  } else if key == "certifications" and data.certifications.len() > 0 {
    section(title)
    for cert in data.certifications {
      headline(
        [#text(weight: "bold", cert.name) #h(0.2em)·#h(0.2em) #cert.issuer#if cert.link != none [ (#maybe-link(cert.link))]],
        cert.date,
      )
    }
  } else if key == "languages" and data.languages.len() > 0 {
    section(title)
    data.languages.join("  ·  ")
  }
}

#for key in data.order { render(key) }
`;
