const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-Dk-PluZY.js","assets/index-BlysQ1qK.css"])))=>i.map(i=>d[i]);
import{u as _,a as E,r as n,c as $,j as e,L as F,C as I,$ as T,m as L,E as P,b as k,d as R,e as H,_ as O}from"./index-Dk-PluZY.js";import W from"./MarkdownRenderer-BP50uBjW.js";import{C as A}from"./code-Cq-3RILe.js";import"./index-DTboirUF.js";import"./katex-BcW5TsDc.js";function V(t){return t?/\.mdx$/i.test(t.trim()):!1}function G(t){if(!t.startsWith("---"))return t;const i=t.match(/^---\s*\n[\s\S]*?\n---\s*\n?/);return i?t.slice(i[0].length):t}function q(t,i={}){if(!i.isMdx)return t;const l=G(t).split(/\r?\n/),r=[];let a=!1,c=!1;for(const s of l){const o=s.trim();if(/^(```|~~~)/.test(o)){a=!a,c=!0,r.push(s);continue}if(a){r.push(s);continue}if(!c){if(!o||/^(import|export)\s/.test(o)||/^\{\/\*.*\*\/\}$/.test(o))continue;c=!0}/^\{\/\*.*\*\/\}$/.test(o)||r.push(s)}return r.join(`
`)}const B=`# DeepScientist Markdown Viewer

Welcome to the **Markdown Viewer** plugin. This viewer supports [GitHub Flavored Markdown](https://github.github.com/gfm/) with additional features.

## Features

### Text Formatting

- **Bold text** using \`**bold**\`
- *Italic text* using \`*italic*\`
- ***Bold and italic*** using \`***combined***\`
- ~~Strikethrough~~ using \`~~text~~\`
- \`Inline code\` using backticks

### Code Blocks

\`\`\`typescript
interface Document {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

async function fetchDocument(id: string): Promise<Document> {
  const response = await fetch(\`/api/documents/\${id}\`);
  return response.json();
}
\`\`\`

### Math Support

Inline math: $E = mc^2$

Display math:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

### Tables (GFM)

| Feature | Status | Priority |
|---------|--------|----------|
| Markdown rendering | Done | High |
| Code highlighting | Done | High |
| Math formulas | Done | Medium |
| Export to PDF | Planned | Low |

### Task Lists (GFM)

- [x] Implement markdown parser
- [x] Add code highlighting
- [ ] Add export functionality
- [ ] Implement search

### Blockquotes

> This is a blockquote.
> It can span multiple lines.
>
> Use it for citations or important notes.

### Images

Images are loaded lazily for better performance:

![DeepScientist Logo](https://via.placeholder.com/400x200?text=DeepScientist)

### Links

- [Visit our website](https://example.com)
- [GitHub Repository](https://github.com/example/deepscientist)

---

## Getting Started

1. Open a markdown file
2. The viewer will render it automatically
3. Use the toolbar to toggle between rendered and source view
4. Copy the source using the copy button

Happy writing! :rocket:
`,K=`# DeepScientist Markdown 查看器

欢迎使用 **Markdown 查看器** 插件。该查看器支持 [GitHub Flavored Markdown](https://github.github.com/gfm/) 及更多增强能力。

## 功能特性

### 文本格式

- 使用 \`**粗体**\` 显示 **粗体**
- 使用 \`*斜体*\` 显示 *斜体*
- 使用 \`***加粗斜体***\` 显示 ***加粗斜体***
- 使用 \`~~删除线~~\` 显示 ~~删除线~~
- 使用反引号显示 \`行内代码\`

### 数学公式

行内公式：$E = mc^2$

块级公式：

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

### 表格

| 功能 | 状态 | 优先级 |
|------|------|--------|
| Markdown 渲染 | 已完成 | 高 |
| 代码高亮 | 已完成 | 高 |
| 数学公式 | 已完成 | 中 |
| 导出 PDF | 规划中 | 低 |

### 开始使用

1. 打开一个 Markdown 文件
2. 查看器会自动完成渲染
3. 使用顶部工具栏在渲染视图和源码视图之间切换
4. 使用复制按钮复制源内容

祝你写作顺利！:rocket:
`;function J({context:t,tabId:i,setDirty:y,setTitle:l}){const{t:r,language:a}=_("markdown_viewer"),c=E(x=>x.updateTabState),[s,o]=n.useState(""),[j,f]=n.useState(!0),[h,g]=n.useState(null),[v,w]=n.useState(!1),[d,b]=n.useState("rendered"),u=t.resourceName||t.resourcePath||"Untitled.md",m=V(u),M=q(s,{isMdx:m});n.useEffect(()=>{l(u)},[u,l]),n.useEffect(()=>{c(i,{contentKind:m?"mdx":"markdown",documentMode:d,isReadOnly:!0})},[m,i,c,d]),n.useEffect(()=>{(async()=>{f(!0),g(null);try{if(!t.resourceId){o(a==="zh-CN"?K:B),f(!1);return}const{getFileContent:p}=await O(async()=>{const{getFileContent:D}=await import("./index-Dk-PluZY.js").then(S=>S.fm);return{getFileContent:D}},__vite__mapDeps([0,1])),C=await p(t.resourceId);o(C)}catch(p){g(p instanceof Error?p.message:r("load_failed"))}finally{f(!1)}})()},[t.resourceId,a,r]);const N=n.useCallback(async()=>{await $(s)&&(w(!0),setTimeout(()=>w(!1),2e3))},[s]);return j?e.jsx("div",{className:"flex items-center justify-center h-full bg-background",children:e.jsxs("div",{className:"flex flex-col items-center gap-3 text-muted-foreground",children:[e.jsx(F,{className:"w-8 h-8 animate-spin"}),e.jsx("span",{children:r("loading")})]})}):h?e.jsx("div",{className:"flex items-center justify-center h-full bg-background",children:e.jsxs("div",{className:"flex flex-col items-center gap-3 text-destructive",children:[e.jsx(I,{className:"w-8 h-8"}),e.jsx("span",{children:h}),e.jsx("button",{className:"px-4 py-2 text-sm bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors",onClick:()=>window.location.reload(),children:r("retry")})]})}):e.jsxs("div",{className:"flex flex-col h-full bg-background text-foreground",children:[e.jsx("style",{dangerouslySetInnerHTML:{__html:T}}),e.jsxs("div",{className:"flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(L,{className:"w-4 h-4 text-muted-foreground"}),e.jsx("span",{className:"text-sm text-foreground",children:u}),e.jsx("span",{className:"text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground",children:m?"MDX":"Markdown"})]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsxs("div",{className:"flex items-center border border-border rounded-md mr-2",children:[e.jsx("button",{onClick:()=>b("rendered"),className:k("p-2 rounded-l-md transition-colors",d==="rendered"?"bg-primary text-primary-foreground":"hover:bg-accent text-muted-foreground"),title:r("rendered_view"),children:e.jsx(P,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>b("source"),className:k("p-2 rounded-r-md transition-colors",d==="source"?"bg-primary text-primary-foreground":"hover:bg-accent text-muted-foreground"),title:r("source_view"),children:e.jsx(A,{className:"w-4 h-4"})})]}),e.jsx("button",{onClick:N,className:"p-2 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground",title:r("copy_source"),children:v?e.jsx(R,{className:"w-4 h-4 text-green-500"}):e.jsx(H,{className:"w-4 h-4"})})]})]}),e.jsx("div",{className:"flex-1 overflow-auto",children:d==="rendered"?e.jsx("div",{className:"max-w-4xl mx-auto p-8",children:e.jsx(W,{content:M})}):e.jsx("pre",{className:"p-4 font-mono text-sm whitespace-pre-wrap",children:s})})]})}export{J as default};
