import { readFile } from "node:fs/promises";
import path from "node:path";

// Pre-render the self-contained viewer so it also works in production without
// loading the application shell or relying on a separate preview server.
export const dynamic = "force-static";
export const runtime = "nodejs";

export async function GET() {
  const html = await readFile(
    path.join(process.cwd(), "docs/diagrams/site.html"),
    "utf8",
  );

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
