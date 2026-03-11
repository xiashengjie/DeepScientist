const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-Dk-PluZY.js","assets/index-BlysQ1qK.css"])))=>i.map(i=>d[i]);
import{r as n,c as te,j as e,L as se,T as R,m as ne,n as z,b,d as re,e as oe,o as ae,p as le,X as H,_ as ie,f as ce}from"./index-Dk-PluZY.js";import{H as de,W as ue}from"./wrap-text-Cq5DiV6c.js";const he=1024*1024,k=1e4;function xe({context:i,tabId:y,setDirty:v,setTitle:N}){const[h,u]=n.useState(""),[d,C]=n.useState(!0),[O,P]=n.useState(null),[Q,A]=n.useState(!1),[L,q]=n.useState(!0),[S,J]=n.useState(!0),[p,B]=n.useState(0),[X,I]=n.useState(!1),[m,E]=n.useState(!1),[f,F]=n.useState(""),[g,T]=n.useState(0),[o,V]=n.useState([]),[D,K]=n.useState(null),w=n.useRef(null),x=i.resourceId,M=i.resourceName||i.resourcePath||"Untitled";n.useEffect(()=>{N(M)},[M,N]),n.useEffect(()=>{(async()=>{C(!0),P(null),I(!1);try{if(!i.resourceId){u(G),B(G.length),C(!1);return}const{getFileContent:t}=await ie(async()=>{const{getFileContent:a}=await import("./index-Dk-PluZY.js").then(l=>l.fm);return{getFileContent:a}},__vite__mapDeps([0,1])),r=await t(i.resourceId);u(r),B(r.length),r.length>he&&I(!0)}catch(t){P(t instanceof Error?t.message:"Failed to load file")}finally{C(!1)}})()},[i.resourceId]);const c=n.useMemo(()=>h.split(`
`),[h]),W=n.useMemo(()=>c.length>k?c.slice(0,k):c,[c]),Y=c.length>k,_=n.useCallback(s=>{if(!x||s.fileId!==x)return;const t=s.lineStart??s.line??s.lineEnd;if(!t)return;const r=s.lineEnd??s.line??s.lineStart??t,a=Math.max(1,c.length),l=Math.min(Math.max(t,1),a),ee=Math.min(Math.max(r,l),a);K({start:l,end:ee});const $=document.getElementById(`line-${l-1}`);$&&$.scrollIntoView({behavior:"smooth",block:"center"}),w.current&&window.clearTimeout(w.current),w.current=window.setTimeout(()=>{K(null)},2500)},[x,c.length]);n.useEffect(()=>{if(!x)return;const s=()=>{ce(x).forEach(l=>_(l.data))};s();const t=a=>{const l=a.detail;_(l)},r=a=>{const l=a.detail;!l||l.fileId!==x||s()};return window.addEventListener("ds:file:jump",t),window.addEventListener("ds:file:queue",r),()=>{window.removeEventListener("ds:file:jump",t),window.removeEventListener("ds:file:queue",r),w.current&&(window.clearTimeout(w.current),w.current=null)}},[_,x]),n.useEffect(()=>{if(!f.trim()){V([]),T(0);return}const s=f.toLowerCase(),t=[];c.forEach((r,a)=>{r.toLowerCase().includes(s)&&t.push(a)}),V(t),T(0)},[f,c]);const j=n.useCallback(s=>{if(o.length===0)return;let t=g;s==="next"?t=(g+1)%o.length:t=(g-1+o.length)%o.length,T(t);const r=document.getElementById(`line-${o[t]}`);r&&r.scrollIntoView({behavior:"smooth",block:"center"})},[g,o]),Z=n.useCallback(async()=>{await te(h)&&(A(!0),setTimeout(()=>A(!1),2e3))},[h]),U=n.useMemo(()=>p<1024?`${p} B`:p<1024*1024?`${(p/1024).toFixed(1)} KB`:`${(p/(1024*1024)).toFixed(1)} MB`,[p]);return n.useEffect(()=>{const s=t=>{(t.ctrlKey||t.metaKey)&&t.key==="f"&&(t.preventDefault(),E(!0)),t.key==="Escape"&&m&&(E(!1),F("")),m&&(t.key==="F3"||t.key==="Enter"&&!t.shiftKey)&&(t.preventDefault(),j("next")),m&&(t.key==="F3"&&t.shiftKey||t.key==="Enter"&&t.shiftKey)&&(t.preventDefault(),j("prev"))};return window.addEventListener("keydown",s),()=>window.removeEventListener("keydown",s)},[m,j]),d?e.jsx("div",{className:"flex items-center justify-center h-full bg-background",children:e.jsxs("div",{className:"flex flex-col items-center gap-3 text-muted-foreground",children:[e.jsx(se,{className:"w-8 h-8 animate-spin"}),e.jsx("span",{children:"Loading file..."})]})}):O?e.jsx("div",{className:"flex items-center justify-center h-full bg-background",children:e.jsxs("div",{className:"flex flex-col items-center gap-3 text-destructive",children:[e.jsx(R,{className:"w-8 h-8"}),e.jsx("span",{children:O}),e.jsx("button",{className:"px-4 py-2 text-sm bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors",onClick:()=>window.location.reload(),children:"Retry"})]})}):e.jsxs("div",{className:"flex flex-col h-full bg-background text-foreground",children:[e.jsxs("div",{className:"flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(ne,{className:"w-4 h-4 text-muted-foreground"}),e.jsx("span",{className:"text-sm text-foreground",children:M}),e.jsxs("span",{className:"text-xs text-muted-foreground",children:[c.length," ",c.length===1?"line":"lines"," | ",U]})]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{onClick:()=>E(!m),className:b("p-2 rounded hover:bg-accent transition-colors",m?"text-primary bg-accent":"text-muted-foreground"),title:"Search (Ctrl+F)",children:e.jsx(z,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>q(!L),className:b("p-2 rounded hover:bg-accent transition-colors",L?"text-primary":"text-muted-foreground"),title:"Toggle line numbers",children:e.jsx(de,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>J(!S),className:b("p-2 rounded hover:bg-accent transition-colors",S?"text-primary":"text-muted-foreground"),title:"Toggle word wrap",children:e.jsx(ue,{className:"w-4 h-4"})}),e.jsx("button",{onClick:Z,className:"p-2 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground",title:"Copy to clipboard",children:Q?e.jsx(re,{className:"w-4 h-4 text-green-500"}):e.jsx(oe,{className:"w-4 h-4"})})]})]}),m&&e.jsxs("div",{className:"flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/20",children:[e.jsx(z,{className:"w-4 h-4 text-muted-foreground flex-shrink-0"}),e.jsx("input",{type:"text",value:f,onChange:s=>F(s.target.value),placeholder:"Search...",className:"flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground",autoFocus:!0}),o.length>0&&e.jsxs("span",{className:"text-xs text-muted-foreground flex-shrink-0",children:[g+1," of ",o.length]}),e.jsxs("div",{className:"flex items-center gap-1 flex-shrink-0",children:[e.jsx("button",{onClick:()=>j("prev"),disabled:o.length===0,className:"p-1 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed",children:e.jsx(ae,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>j("next"),disabled:o.length===0,className:"p-1 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed",children:e.jsx(le,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>{E(!1),F("")},className:"p-1 rounded hover:bg-accent",children:e.jsx(H,{className:"w-4 h-4"})})]})]}),X&&e.jsxs("div",{className:"flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/30 text-yellow-600 dark:text-yellow-400",children:[e.jsx(R,{className:"w-4 h-4 flex-shrink-0"}),e.jsxs("span",{className:"text-sm",children:["Large file (",U,"). Performance may be affected."]}),e.jsx("button",{onClick:()=>I(!1),className:"ml-auto p-1 hover:bg-yellow-500/20 rounded",children:e.jsx(H,{className:"w-4 h-4"})})]}),e.jsx("div",{className:"flex-1 overflow-auto",children:e.jsxs("div",{className:"flex min-h-full",children:[L&&e.jsx("div",{className:"flex-shrink-0 py-4 pr-4 text-right bg-muted/20 border-r border-border select-none sticky left-0",children:W.map((s,t)=>e.jsx("div",{id:`line-num-${t}`,className:b("px-4 text-xs leading-6 font-mono",o.includes(t)&&o[g]===t?"text-primary font-bold":o.includes(t)?"text-primary/60":"text-muted-foreground"),children:t+1},t))}),e.jsxs("pre",{className:b("flex-1 py-4 px-4 font-mono text-sm leading-6 overflow-x-auto",S&&"whitespace-pre-wrap break-all"),children:[W.map((s,t)=>{const r=o.length>0&&o[g]===t,a=f.trim()&&s.toLowerCase().includes(f.toLowerCase()),l=D&&t+1>=D.start&&t+1<=D.end;return e.jsx("div",{id:`line-${t}`,className:b("min-h-[1.5rem]",l&&"ds-citation-line-highlight",r&&"bg-primary/20",a&&!r&&"bg-primary/10"),children:a?me(s,f):s||" "},t)}),Y&&e.jsxs("div",{className:"py-4 text-center text-muted-foreground border-t border-border mt-4",children:[e.jsx(R,{className:"w-4 h-4 inline-block mr-2"}),"File truncated. Showing first ",k.toLocaleString()," ","of ",c.length.toLocaleString()," lines."]})]})]})})]})}function me(i,y){if(!y.trim())return i;const v=[],N=i.toLowerCase(),h=y.toLowerCase();let u=0,d=N.indexOf(h);for(;d!==-1;)d>u&&v.push(i.slice(u,d)),v.push(e.jsx("mark",{className:"bg-yellow-300 dark:bg-yellow-500/50 text-foreground px-0.5 rounded",children:i.slice(d,d+y.length)},d)),u=d+y.length,d=N.indexOf(h,u);return u<i.length&&v.push(i.slice(u)),v}const G=`DeepScientist - Text Viewer Demo
================================

This is a demonstration of the Text Viewer plugin.
It displays plain text files with optional features:

Features:
---------
1. Line numbers (toggle with # button)
2. Word wrap (toggle with wrap button)
3. Search functionality (Ctrl+F)
4. Copy to clipboard
5. Large file warning (> 1MB)

Keyboard Shortcuts:
------------------
- Ctrl+F: Open search
- Escape: Close search
- Enter: Next match
- Shift+Enter: Previous match
- F3: Next match
- Shift+F3: Previous match

Sample Log Output:
-----------------
[2025-12-18 10:30:15] INFO: Application started
[2025-12-18 10:30:16] DEBUG: Loading configuration from config.yaml
[2025-12-18 10:30:16] INFO: Database connection established
[2025-12-18 10:30:17] DEBUG: Cache initialized with 256MB limit
[2025-12-18 10:30:18] INFO: API server listening on port 8080
[2025-12-18 10:30:20] INFO: Worker pool started with 4 workers
[2025-12-18 10:30:22] DEBUG: Health check endpoint registered
[2025-12-18 10:30:25] INFO: Ready to accept connections

Environment Variables:
---------------------
NODE_ENV=production
DATABASE_URL=postgresql://localhost/deepscientist
REDIS_URL=redis://localhost:6379
API_KEY=sk-...
LOG_LEVEL=debug

This text viewer is designed as a fallback for files
that don't have a specialized viewer, such as:
- Plain text files (.txt)
- Log files (.log)
- Configuration files
- README files without markdown rendering

The viewer prioritizes readability and performance,
even for large files with thousands of lines.
`;export{xe as default};
