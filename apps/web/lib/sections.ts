/**
 * The page's sections, in order. Each one maps to the API endpoint that feeds it,
 * which the sidebar labels and the dev panel calls.
 */
export const sections = [
  { id: 'about', method: 'GET', endpoint: '/api/v1/profile' },
  { id: 'experience', method: 'GET', endpoint: '/api/v1/experience' },
  { id: 'projects', method: 'GET', endpoint: '/api/v1/projects' },
  { id: 'skills', method: 'GET', endpoint: '/api/v1/skills' },
  { id: 'education', method: 'GET', endpoint: '/api/v1/education' },
  { id: 'contact', method: 'POST', endpoint: '/api/v1/contact' },
] as const;

export type Section = (typeof sections)[number];
export type SectionId = Section['id'];
export type HttpMethod = Section['method'];

/** Endpoint without the `/api/v1` prefix, as shown in compact labels. */
export const shortPath = (endpoint: string) => endpoint.replace('/api/v1', '');
