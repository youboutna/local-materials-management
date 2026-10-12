export function getNewsletterSiteUrl(): string | null {
  const configuredUrl = (
    Deno.env.get("NEWSLETTER_SITE_URL") ||
    Deno.env.get("SITE_URL") ||
    ""
  ).trim();
  if (!configuredUrl) return null;

  try {
    const url = new URL(configuredUrl);
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}
