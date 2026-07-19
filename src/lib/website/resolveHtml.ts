/* Serve-time image substitution: stored site HTML references images only as
   {{img:ALIAS}} tokens; this swaps them for fresh URLs (1h-signed storage
   URLs / venue photo URLs) on every request. Unknown aliases resolve to a
   transparent pixel so a stale reference can never fetch anything. */

const BLANK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export function resolveHtml(html: string, urlMap: Record<string, string>): string {
  return html.replace(/\{\{img:([A-Za-z0-9-]{1,40})\}\}/g, (_m, alias: string) => {
    return urlMap[alias] ?? BLANK_PIXEL;
  });
}

/** Font families referenced in the HTML that exist in our catalog — used to
    build the Google Fonts <link> for the page. */
export function familiesInHtml(html: string, catalogFamilies: string[]): string[] {
  return catalogFamilies.filter((family) => html.includes(family));
}
