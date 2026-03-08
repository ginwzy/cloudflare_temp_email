const URL_ATTRS = new Set(['href', 'src', 'action', 'formaction', 'xlink:href', 'poster']);
const DROP_WITH_CONTENT_TAGS = new Set([
  'script', 'iframe', 'frame', 'object', 'embed', 'form',
  'input', 'button', 'textarea', 'select', 'option',
  'meta', 'base', 'link', 'style', 'svg', 'math',
  'video', 'audio', 'source', 'track',
]);

const MAIL_ALLOWED_TAGS = new Set([
  'a', 'abbr', 'address', 'article', 'aside',
  'b', 'blockquote', 'br',
  'caption', 'code', 'col', 'colgroup',
  'dd', 'div', 'dl', 'dt',
  'em',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr',
  'i', 'img',
  'li',
  'ol',
  'p', 'pre',
  'section', 'small', 'span', 'strong', 'sub', 'sup',
  'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr',
  'u', 'ul',
]);

const RICH_TEXT_ALLOWED_TAGS = new Set([
  'a', 'b', 'blockquote', 'br', 'code',
  'div', 'em', 'i', 'li', 'ol', 'p', 'pre',
  'small', 'span', 'strong', 'sub', 'sup', 'u', 'ul',
]);

const ICON_ALLOWED_TAGS = new Set([
  'svg', 'g', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
  'ellipse', 'defs', 'symbol', 'use', 'title', 'desc',
]);

const GLOBAL_ATTRS = new Set([
  'class', 'title', 'alt', 'role',
  'aria-label', 'aria-hidden',
  'width', 'height',
  'align', 'colspan', 'rowspan',
  'viewbox', 'fill', 'stroke', 'd',
  'x', 'y', 'x1', 'x2', 'y1', 'y2',
  'cx', 'cy', 'r', 'rx', 'ry',
  'points', 'transform',
  'xmlns', 'xmlns:xlink',
  'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'focusable',
]);

const PER_TAG_ATTRS = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title', 'width', 'height']),
  td: new Set(['colspan', 'rowspan', 'align']),
  th: new Set(['colspan', 'rowspan', 'align']),
  col: new Set(['span', 'width']),
  colgroup: new Set(['span']),
  svg: new Set(['viewbox', 'width', 'height', 'fill', 'stroke', 'xmlns', 'xmlns:xlink', 'focusable']),
  use: new Set(['href', 'xlink:href']),
  path: new Set(['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'transform']),
  circle: new Set(['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width', 'transform']),
  rect: new Set(['x', 'y', 'width', 'height', 'rx', 'ry', 'fill', 'stroke', 'stroke-width', 'transform']),
  line: new Set(['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width', 'transform']),
  polyline: new Set(['points', 'fill', 'stroke', 'stroke-width', 'transform']),
  polygon: new Set(['points', 'fill', 'stroke', 'stroke-width', 'transform']),
  ellipse: new Set(['cx', 'cy', 'rx', 'ry', 'fill', 'stroke', 'stroke-width', 'transform']),
};

const DEFAULT_REL = 'noopener noreferrer nofollow ugc';

function fallbackStrip(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\sstyle=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

function unwrapElement(el) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) {
    parent.insertBefore(el.firstChild, el);
  }
  parent.removeChild(el);
}

function isSafeUrl(value, { forImage = false, forIcon = false } = {}) {
  if (!value) return false;
  const raw = value.trim();
  if (!raw) return false;
  if (raw.startsWith('#')) return true;
  if (forIcon) {
    return raw.startsWith('#');
  }

  try {
    const parsed = new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'https://localhost');
    const protocol = parsed.protocol.toLowerCase();
    if (forImage) {
      return protocol === 'http:' || protocol === 'https:' || protocol === 'data:' || protocol === 'cid:' || protocol === 'blob:';
    }
    return protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:' || protocol === 'tel:';
  } catch {
    return false;
  }
}

function sanitizeWithMode(html, mode) {
  if (!html) return '';
  if (typeof DOMParser === 'undefined' || typeof document === 'undefined') {
    return fallbackStrip(html);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html), 'text/html');
  const body = doc.body;
  const allowedTags = mode === 'icon'
    ? ICON_ALLOWED_TAGS
    : mode === 'mail'
      ? MAIL_ALLOWED_TAGS
      : RICH_TEXT_ALLOWED_TAGS;

  const elements = Array.from(body.querySelectorAll('*'));

  for (const element of elements) {
    const tag = element.tagName.toLowerCase();
    if (!allowedTags.has(tag)) {
      if (DROP_WITH_CONTENT_TAGS.has(tag)) {
        element.remove();
      } else {
        unwrapElement(element);
      }
      continue;
    }

    const allowedAttrs = new Set([
      ...GLOBAL_ATTRS,
      ...(PER_TAG_ATTRS[tag] || []),
    ]);

    for (const attr of Array.from(element.attributes)) {
      const attrName = attr.name.toLowerCase();
      const value = attr.value || '';
      const isEventAttr = attrName.startsWith('on');
      const keepAttr = allowedAttrs.has(attrName);

      if (isEventAttr || attrName === 'style' || attrName === 'srcset' || attrName === 'srcdoc') {
        element.removeAttribute(attr.name);
        continue;
      }

      if (!keepAttr) {
        element.removeAttribute(attr.name);
        continue;
      }

      if (URL_ATTRS.has(attrName)) {
        const forImage = tag === 'img' || attrName === 'src';
        const forIcon = mode === 'icon';
        if (!isSafeUrl(value, { forImage, forIcon })) {
          element.removeAttribute(attr.name);
          continue;
        }
      }

      if (attrName === 'target' && value && value !== '_blank' && value !== '_self') {
        element.removeAttribute(attr.name);
      }
    }

    if (tag === 'a' && element.getAttribute('href')) {
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', DEFAULT_REL);
    }
  }

  return body.innerHTML || '';
}

export function sanitizeMailHtml(html) {
  return sanitizeWithMode(html, 'mail');
}

export function sanitizeRichTextHtml(html) {
  return sanitizeWithMode(html, 'rich');
}

export function sanitizeIconHtml(html) {
  return sanitizeWithMode(html, 'icon');
}

export function buildSandboxedMailSrcdoc(html) {
  const safeHtml = sanitizeMailHtml(html);
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: cid: https: http:; style-src 'unsafe-inline'; font-src data: https: http:;"><base target="_blank"></head><body>${safeHtml}</body></html>`;
}
