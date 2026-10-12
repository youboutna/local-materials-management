const allowedTags = new Set([
  'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DEL', 'EM', 'H1', 'H2', 'H3', 'H4',
  'HR', 'I', 'IMG', 'LI', 'OL', 'P', 'PRE', 'S', 'STRONG', 'U', 'UL',
]);

const blockedTags = new Set(['IFRAME', 'OBJECT', 'SCRIPT', 'STYLE', 'SVG', 'TEMPLATE']);

const isSafeUrl = (value: string): boolean => {
  const trimmed = value.trim();
  return /^(https?:|mailto:|tel:|\/|#)/i.test(trimmed) && !/^\/\//.test(trimmed);
};

export function sanitizeArticleHtml(html: string): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');

  const cleanNode = (node: Node): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent ?? '');
    }
    if (!(node instanceof Element)) return null;
    if (blockedTags.has(node.tagName)) return null;

    if (!allowedTags.has(node.tagName)) {
      const fragment = document.createDocumentFragment();
      node.childNodes.forEach((child) => {
        const cleanChild = cleanNode(child);
        if (cleanChild) fragment.appendChild(cleanChild);
      });
      return fragment;
    }

    const cleanElement = document.createElement(node.tagName.toLowerCase());
    for (const attribute of ['alt', 'title', 'colspan', 'rowspan']) {
      const value = node.getAttribute(attribute);
      if (value !== null) cleanElement.setAttribute(attribute, value);
    }
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
      cleanElement.setAttribute('target', '_blank');
    }
    for (const attribute of ['href', 'src']) {
      const value = node.getAttribute(attribute);
      if (value && isSafeUrl(value)) cleanElement.setAttribute(attribute, value);
    }
    if (node.tagName === 'A' && cleanElement.getAttribute('target') === '_blank') {
      cleanElement.setAttribute('rel', 'noopener noreferrer');
    }

    node.childNodes.forEach((child) => {
      const cleanChild = cleanNode(child);
      if (cleanChild) cleanElement.appendChild(cleanChild);
    });
    return cleanElement;
  };

  const output = document.createElement('div');
  parsed.body.childNodes.forEach((node) => {
    const cleanNodeValue = cleanNode(node);
    if (cleanNodeValue) output.appendChild(cleanNodeValue);
  });
  return output.innerHTML;
}
