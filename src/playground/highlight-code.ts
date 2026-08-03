function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function highlightCode(code: string, language: "bash" | "tsx") {
  const slots: string[] = [];
  const park = (html: string) => {
    const marker = `\u0000${"x".repeat(slots.length + 1)}\u0000`;
    slots.push(html);
    return marker;
  };
  const wrap = (tokenClass: string, value: string) =>
    park(`<span class="${tokenClass}">${escapeHtml(value)}</span>`);

  let text = code;

  if (language === "bash") {
    text = text.replace(/(https?:\/\/\S+)/g, (match) => wrap("token-string", match));
    text = text.replace(
      /\b(pnpm|npm|npx|yarn|bun|dlx|shadcn@latest|add)\b/g,
      (match) => wrap("token-keyword", match),
    );
  } else {
    text = text.replace(/("[^"\n]*"|'[^'\n]*')/g, (match) => wrap("token-string", match));
    text = text.replace(
      /\b(import|from|export|const|return)\b/g,
      (match) => wrap("token-keyword", match),
    );
    text = text.replace(/(<\/?[A-Za-z][\w.]*)/g, (match) => wrap("token-tag", match));
    text = text.replace(/\b(\d+(?:\.\d+)?)\b/g, (match) => wrap("token-number", match));
  }

  return escapeHtml(text).replace(/\u0000(x+)\u0000/g, (_, marker: string) => {
    return slots[marker.length - 1] ?? "";
  });
}
