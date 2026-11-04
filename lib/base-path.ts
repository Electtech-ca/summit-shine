// The sub-path the site is served under: next.config.mjs sets it from BASE_PATH, for example
// /portfolio/summit-shine on the ElectTech VPS. Empty when the site is served from the root.
// next/link, the router and redirect() add it themselves; plain fetch() calls, <a href> and
// URLs built from window.location do not, so they go through withBasePath().
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  return `${basePath}${path}`;
}
