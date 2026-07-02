type BootstrapPage = {
  title: string;
  status: "success" | "disabled" | "error" | "info";
  message: string;
  details?: string[];
};

const STATUS_COLOR: Record<BootstrapPage["status"], string> = {
  success: "#16a34a",
  disabled: "#ca8a04",
  error: "#dc2626",
  info: "#2563eb",
};

export function renderBootstrapPage(page: BootstrapPage): string {
  const color = STATUS_COLOR[page.status];
  const details = page.details?.length
    ? `<ul style="margin:1rem 0 0;padding-left:1.25rem;line-height:1.6;">${page.details
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}</ul>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(page.title)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; background: #0b1220; color: #e5e7eb; }
    main { max-width: 40rem; margin: 0 auto; padding: 1.5rem; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 1.25rem; }
    h1 { font-size: 1.35rem; margin: 0 0 0.75rem; color: ${color}; }
    p { margin: 0; line-height: 1.6; color: #d1d5db; }
    code { background: #1f2937; padding: 0.1rem 0.35rem; border-radius: 4px; }
  </style>
</head>
<body>
  <main>
    <div class="card">
      <h1>${escapeHtml(page.title)}</h1>
      <p>${escapeHtml(page.message)}</p>
      ${details}
    </div>
  </main>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
