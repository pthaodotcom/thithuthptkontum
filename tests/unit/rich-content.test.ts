import { describe,expect,it } from "vitest";
import { renderRichContent } from "@/components/RichContent";
describe("rich content",()=>{
 it("render latex",()=>expect(renderRichContent("Giá trị $x^2$")).toContain("katex"));
 it("loại script và javascript URL",()=>{const out=renderRichContent('<script>alert(1)</script><a href="javascript:alert(2)">x</a>');expect(out).not.toContain("script");expect(out).not.toContain("javascript:")});
});
