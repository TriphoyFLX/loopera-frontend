function parseFilenameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;\n]+)/i);
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const asciiMatch = disposition.match(/filename="([^"]+)"/i);
  return asciiMatch?.[1] ?? null;
}

function triggerDownload(href: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export async function downloadPurchasedPack(
  packId: number | string,
  options: { token?: string | null; fallbackTitle?: string } = {}
): Promise<void> {
  const headers: Record<string, string> = {};
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`/api/shop/${packId}/download`, { headers });
  if (!response.ok) {
    let message = 'Не удалось скачать пак';
    try {
      const data = await response.json();
      if (data.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const contentType = response.headers.get('Content-Type') || '';
  const fallbackName = `${options.fallbackTitle || 'Loopera Pack'}.zip`;

  // Signed CDN/S3 URL (JSON)
  if (contentType.includes('application/json')) {
    const data = (await response.json()) as { download_url?: string };
    if (!data.download_url) {
      throw new Error('Не удалось получить ссылку на скачивание');
    }
    triggerDownload(data.download_url, fallbackName);
    return;
  }

  const filename =
    parseFilenameFromDisposition(response.headers.get('Content-Disposition')) || fallbackName;

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  triggerDownload(url, filename);
  window.URL.revokeObjectURL(url);
}
