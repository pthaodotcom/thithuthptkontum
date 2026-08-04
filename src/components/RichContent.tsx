import katex from "katex";
import sanitizeHtml from "sanitize-html";

export function renderRichContent(value: string) {
  const safe = sanitizeHtml(value, {
    allowedTags: ["p","br","strong","b","em","i","u","sub","sup","ul","ol","li","table","thead","tbody","tr","th","td","img","a","div","span"],
    allowedAttributes: { img: ["src","alt","width","height"], a: ["href","target","rel"], td: ["colspan","rowspan"], th: ["colspan","rowspan"], span: ["class","style"] },
    allowedSchemes: ["https", "http", "data"],
    allowedSchemesByTag: { img: ["https","http","data"] },
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }) },
  });
  return safe.replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (_, block: string | undefined, inline: string | undefined) => {
    try { return katex.renderToString(block ?? inline ?? "", { displayMode: Boolean(block), throwOnError: false, strict: "ignore" }); }
    catch { return block ? `$$${block}$$` : `$${inline}$`; }
  });
}

export default function RichContent({ value, className = "" }: { value: string; className?: string }) {
  return <div className={`rich-content ${className}`} dangerouslySetInnerHTML={{ __html: renderRichContent(value) }} />;
}
