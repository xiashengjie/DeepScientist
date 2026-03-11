const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-Dk-PluZY.js","assets/index-BlysQ1qK.css"])))=>i.map(i=>d[i]);
import{u as V,a as q,r,c as G,j as e,L as $,C as J,F as K,E as Q,b as S,d as Z,e as B,_ as X,f as Y}from"./index-Dk-PluZY.js";import{C as ee}from"./code-Cq-3RILe.js";import{H as te,W as se}from"./wrap-text-Cq5DiV6c.js";const ne={".js":"javascript",".jsx":"javascript",".mjs":"javascript",".ts":"typescript",".tsx":"typescript",".mts":"typescript",".py":"python",".pyw":"python",".pyi":"python",".json":"json",".jsonc":"json",".json5":"json",".html":"html",".htm":"html",".css":"css",".scss":"scss",".sass":"sass",".less":"less",".yaml":"yaml",".yml":"yaml",".toml":"toml",".ini":"ini",".cfg":"ini",".conf":"ini",".sh":"bash",".bash":"bash",".zsh":"zsh",".fish":"fish",".sql":"sql",".xml":"xml",".xsl":"xml",".xslt":"xml",".svg":"xml",".go":"go",".rs":"rust",".c":"c",".h":"c",".cpp":"cpp",".cc":"cpp",".cxx":"cpp",".hpp":"cpp",".hxx":"cpp",".java":"java",".cs":"csharp",".php":"php",".rb":"ruby",".swift":"swift",".kt":"kotlin",".kts":"kotlin",".md":"markdown",".markdown":"markdown"};function re(c){const w=c.substring(c.lastIndexOf(".")).toLowerCase();return ne[w]||"plaintext"}function ae(c){return c==="html"}const U={javascript:["const","let","var","function","return","if","else","for","while","do","switch","case","break","continue","default","class","extends","new","this","super","import","export","from","as","async","await","try","catch","finally","throw","typeof","instanceof","in","of","true","false","null","undefined","void"],typescript:["const","let","var","function","return","if","else","for","while","do","switch","case","break","continue","default","class","extends","new","this","super","import","export","from","as","async","await","try","catch","finally","throw","typeof","instanceof","in","of","true","false","null","undefined","void","type","interface","enum","namespace","module","declare","abstract","implements","private","protected","public","readonly","static"],python:["def","class","if","elif","else","for","while","try","except","finally","with","as","import","from","return","yield","raise","pass","break","continue","and","or","not","in","is","lambda","True","False","None","global","nonlocal","assert","del"],go:["package","import","func","return","var","const","type","struct","interface","map","chan","go","defer","if","else","for","range","switch","case","default","break","continue","fallthrough","select","true","false","nil"],rust:["fn","let","mut","const","static","if","else","match","for","while","loop","break","continue","return","struct","enum","impl","trait","pub","mod","use","as","self","super","crate","async","await","move","ref","true","false","where"]};function ce(c,w){const z=c.split(`
`),E=U[w]||U.javascript||[],o=new Set(E);return z.map(C=>{const s=[];let t=C;for(;t.length>0;){const _=t.match(/^"(?:[^"\\]|\\.)*"/);if(_){s.push({type:"string",value:_[0]}),t=t.slice(_[0].length);continue}const f=t.match(/^'(?:[^'\\]|\\.)*'/);if(f){s.push({type:"string",value:f[0]}),t=t.slice(f[0].length);continue}const y=t.match(/^`(?:[^`\\]|\\.)*`/);if(y){s.push({type:"string",value:y[0]}),t=t.slice(y[0].length);continue}const D=t.match(/^(\/\/.*|#.*)$/);if(D){s.push({type:"comment",value:D[0]}),t="";continue}const N=t.match(/^\/\*.*?\*\//);if(N){s.push({type:"comment",value:N[0]}),t=t.slice(N[0].length);continue}const v=t.match(/^-?\d+\.?\d*([eE][+-]?\d+)?/);if(v){s.push({type:"number",value:v[0]}),t=t.slice(v[0].length);continue}const b=t.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);if(b){const m=b[0],d=t[m.length];o.has(m)?s.push({type:"keyword",value:m}):d==="("?s.push({type:"function",value:m}):s.push({type:"default",value:m}),t=t.slice(m.length);continue}const k=t.match(/^[+\-*/%=<>!&|^~?:]+/);if(k){s.push({type:"operator",value:k[0]}),t=t.slice(k[0].length);continue}const g=t.match(/^[{}[\]();,.]/);if(g){s.push({type:"punctuation",value:g[0]}),t=t.slice(g[0].length);continue}s.push({type:"default",value:t[0]}),t=t.slice(1)}return s})}const oe={keyword:"text-purple-400",string:"text-green-400",comment:"text-gray-500 italic",number:"text-slate-200",function:"text-blue-400",operator:"text-pink-400",punctuation:"text-gray-400",default:"text-gray-100"};function de({context:c,tabId:w,setDirty:z,setTitle:E}){const{t:o}=V("code_viewer"),C=q(a=>a.updateTabState),[s,t]=r.useState(""),[_,f]=r.useState(!0),[y,D]=r.useState(null),[N,v]=r.useState(!1),[b,k]=r.useState(!0),[g,m]=r.useState(!1),[d,L]=r.useState("source"),[T,A]=r.useState(null),j=r.useRef(null),p=c.resourceId,M=c.resourceName||c.resourcePath||"Untitled",x=r.useMemo(()=>re(c.resourcePath||""),[c.resourcePath]),u=r.useMemo(()=>ae(x)||String(c.mimeType||"").toLowerCase().includes("html"),[c.mimeType,x]);r.useEffect(()=>{L(u?"rendered":"source")},[p,u]),r.useEffect(()=>{E(M)},[M,E]),r.useEffect(()=>{C(w,{contentKind:u?"html":"code",documentMode:u?d:"source",isReadOnly:!0})},[u,w,C,d]),r.useEffect(()=>{(async()=>{f(!0),D(null);try{if(!c.resourceId){t(F[x]||F.javascript),f(!1);return}const{getFileContent:n}=await X(async()=>{const{getFileContent:l}=await import("./index-Dk-PluZY.js").then(i=>i.fm);return{getFileContent:l}},__vite__mapDeps([0,1])),h=await n(c.resourceId);t(h)}catch(n){D(n instanceof Error?n.message:o("load_failed"))}finally{f(!1)}})()},[c.resourceId,x,o]);const P=r.useMemo(()=>ce(s,x),[s,x]),H=r.useCallback(async()=>{await G(s)&&(v(!0),setTimeout(()=>v(!1),2e3))},[s]),R=P.length,I=r.useCallback(a=>{if(!p||a.fileId!==p)return;const n=a.lineStart??a.line??a.lineEnd;if(!n)return;const h=a.lineEnd??a.line??a.lineStart??n,l=Math.max(1,R),i=Math.min(Math.max(n,1),l),W=Math.min(Math.max(h,i),l);A({start:i,end:W});const O=document.getElementById(`code-line-${i-1}`);O&&O.scrollIntoView({behavior:"smooth",block:"center"}),j.current&&window.clearTimeout(j.current),j.current=window.setTimeout(()=>{A(null)},2500)},[p,R]);return r.useEffect(()=>{if(!p)return;const a=()=>{Y(p).forEach(i=>I(i.data))};a();const n=l=>{const i=l.detail;I(i)},h=l=>{const i=l.detail;!i||i.fileId!==p||a()};return window.addEventListener("ds:file:jump",n),window.addEventListener("ds:file:queue",h),()=>{window.removeEventListener("ds:file:jump",n),window.removeEventListener("ds:file:queue",h),j.current&&(window.clearTimeout(j.current),j.current=null)}},[I,p]),_?e.jsx("div",{className:"flex items-center justify-center h-full bg-background",children:e.jsxs("div",{className:"flex flex-col items-center gap-3 text-muted-foreground",children:[e.jsx($,{className:"w-8 h-8 animate-spin"}),e.jsx("span",{children:o("loading")})]})}):y?e.jsx("div",{className:"flex items-center justify-center h-full bg-background",children:e.jsxs("div",{className:"flex flex-col items-center gap-3 text-destructive",children:[e.jsx(J,{className:"w-8 h-8"}),e.jsx("span",{children:y}),e.jsx("button",{className:"px-4 py-2 text-sm bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors",onClick:()=>window.location.reload(),children:o("retry")})]})}):e.jsxs("div",{className:"flex flex-col h-full bg-[#1e1e1e] text-gray-100",children:[e.jsxs("div",{className:"flex items-center justify-between px-4 py-2 border-b border-[#333] bg-[#252526]",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(K,{className:"w-4 h-4 text-gray-400"}),e.jsx("span",{className:"text-sm text-gray-300",children:M}),e.jsx("span",{className:"text-xs px-2 py-0.5 rounded bg-[#333] text-gray-400 uppercase",children:u?"HTML":x}),e.jsx("span",{className:"text-xs text-gray-500",children:o("line_count",{count:R})})]}),e.jsxs("div",{className:"flex items-center gap-1",children:[u?e.jsxs("div",{className:"mr-2 flex items-center rounded-md border border-[#3a3a3a] bg-[#202021] p-0.5",children:[e.jsx("button",{onClick:()=>L("rendered"),className:S("rounded px-2 py-1 text-xs transition-colors",d==="rendered"?"bg-[#3A4653] text-white":"text-gray-400 hover:text-gray-200"),title:o("rendered_view"),children:e.jsxs("span",{className:"inline-flex items-center gap-1",children:[e.jsx(Q,{className:"h-3.5 w-3.5"}),o("rendered_view_short")]})}),e.jsx("button",{onClick:()=>L("source"),className:S("rounded px-2 py-1 text-xs transition-colors",d==="source"?"bg-[#3A4653] text-white":"text-gray-400 hover:text-gray-200"),title:o("source_view"),children:e.jsxs("span",{className:"inline-flex items-center gap-1",children:[e.jsx(ee,{className:"h-3.5 w-3.5"}),o("source_view_short")]})})]}):null,!u||d==="source"?e.jsx("button",{onClick:()=>k(!b),className:S("p-2 rounded hover:bg-[#333] transition-colors",b?"text-blue-400":"text-gray-500"),title:o("toggle_line_numbers"),children:e.jsx(te,{className:"w-4 h-4"})}):null,!u||d==="source"?e.jsx("button",{onClick:()=>m(!g),className:S("p-2 rounded hover:bg-[#333] transition-colors",g?"text-blue-400":"text-gray-500"),title:o("toggle_word_wrap"),children:e.jsx(se,{className:"w-4 h-4"})}):null,e.jsx("button",{onClick:H,className:"p-2 rounded hover:bg-[#333] transition-colors text-gray-400 hover:text-gray-200",title:o("copy_source"),children:N?e.jsx(Z,{className:"w-4 h-4 text-green-400"}):e.jsx(B,{className:"w-4 h-4"})})]})]}),e.jsx("div",{className:"flex-1 overflow-auto",children:u&&d==="rendered"?e.jsxs("div",{className:"flex h-full flex-col bg-[#1c1c1d]",children:[e.jsx("div",{className:"border-b border-[#2f2f30] px-4 py-2 text-xs text-gray-400",children:o("html_render_hint")}),e.jsx("div",{className:"flex-1 p-3",children:e.jsx("div",{className:"h-full overflow-hidden rounded-xl border border-white/10 bg-white shadow-[0_24px_60px_-36px_rgba(0,0,0,0.55)]",children:e.jsx("iframe",{title:o("html_render_frame_title",{name:M}),srcDoc:s,sandbox:"",className:"h-full w-full bg-white"})})})]}):e.jsxs("div",{className:"flex min-h-full",children:[b&&e.jsx("div",{className:"flex-shrink-0 py-4 pr-4 text-right bg-[#1e1e1e] border-r border-[#333] select-none sticky left-0",children:P.map((a,n)=>e.jsx("div",{className:"px-4 text-xs leading-6 text-gray-500 font-mono",children:n+1},n))}),e.jsx("pre",{className:S("flex-1 py-4 px-4 font-mono text-sm leading-6 overflow-x-auto",g&&"whitespace-pre-wrap break-all"),children:e.jsx("code",{children:P.map((a,n)=>{const h=T&&n+1>=T.start&&n+1<=T.end;return e.jsx("div",{id:`code-line-${n}`,className:S("min-h-[1.5rem]",h&&"ds-citation-line-highlight"),children:a.length===0?e.jsx("span",{children:" "}):a.map((l,i)=>e.jsx("span",{className:oe[l.type],children:l.value},i))},n)})})})]})})]})}const F={javascript:`// DeepScientist - Example JavaScript Code
import { useState, useEffect } from 'react';

/**
 * Custom hook for fetching data
 * @param {string} url - The URL to fetch from
 * @returns {Object} - The data, loading state, and error
 */
export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}

// Example usage
const API_URL = "https://api.example.com/data";
const { data, loading } = useFetch(API_URL);

console.log("Data loaded:", data);
`,typescript:`// DeepScientist - Example TypeScript Code
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

type AsyncResult<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

async function fetchUser(userId: string): Promise<User> {
  const response = await fetch(\`/api/users/\${userId}\`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}

class UserService {
  private cache: Map<string, User> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    const user = await fetchUser(id);
    this.cache.set(id, user);
    return user;
  }
}

export const userService = new UserService();
`,python:`# DeepScientist - Example Python Code
from typing import List, Optional, Dict
from dataclasses import dataclass
import asyncio

@dataclass
class Document:
    """Represents a research document."""
    id: str
    title: str
    content: str
    tags: List[str]
    metadata: Dict[str, any]

class DocumentProcessor:
    """Processes and analyzes documents."""

    def __init__(self, model_name: str = "gpt-4"):
        self.model_name = model_name
        self._cache: Dict[str, Document] = {}

    async def process(self, doc: Document) -> Dict[str, any]:
        """Process a document and extract insights."""
        # Simulate async processing
        await asyncio.sleep(0.1)

        return {
            "word_count": len(doc.content.split()),
            "tag_count": len(doc.tags),
            "has_metadata": bool(doc.metadata)
        }

    def summarize(self, doc: Document) -> str:
        """Generate a summary of the document."""
        words = doc.content.split()[:100]
        return " ".join(words) + "..."

# Example usage
if __name__ == "__main__":
    doc = Document(
        id="doc-001",
        title="Research Paper",
        content="This is the content of the research paper...",
        tags=["AI", "Machine Learning"],
        metadata={"author": "Dr. Smith"}
    )

    processor = DocumentProcessor()
    print(f"Processing: {doc.title}")
`,go:`// DeepScientist - Example Go Code
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Document represents a research document
type Document struct {
	ID       string            \`json:"id"\`
	Title    string            \`json:"title"\`
	Content  string            \`json:"content"\`
	Tags     []string          \`json:"tags"\`
	Metadata map[string]string \`json:"metadata"\`
}

// DocumentService handles document operations
type DocumentService struct {
	cache map[string]*Document
}

// NewDocumentService creates a new DocumentService
func NewDocumentService() *DocumentService {
	return &DocumentService{
		cache: make(map[string]*Document),
	}
}

// GetDocument retrieves a document by ID
func (s *DocumentService) GetDocument(ctx context.Context, id string) (*Document, error) {
	if doc, ok := s.cache[id]; ok {
		return doc, nil
	}
	return nil, fmt.Errorf("document not found: %s", id)
}

func main() {
	service := NewDocumentService()

	http.HandleFunc("/documents", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
		})
	})

	fmt.Println("Server starting on :8080")
	http.ListenAndServe(":8080", nil)
}
`,rust:`// DeepScientist - Example Rust Code
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub id: String,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    pub metadata: HashMap<String, String>,
}

impl Document {
    pub fn new(id: &str, title: &str, content: &str) -> Self {
        Document {
            id: id.to_string(),
            title: title.to_string(),
            content: content.to_string(),
            tags: Vec::new(),
            metadata: HashMap::new(),
        }
    }

    pub fn word_count(&self) -> usize {
        self.content.split_whitespace().count()
    }

    pub fn add_tag(&mut self, tag: &str) {
        self.tags.push(tag.to_string());
    }
}

pub struct DocumentService {
    cache: HashMap<String, Document>,
}

impl DocumentService {
    pub fn new() -> Self {
        DocumentService {
            cache: HashMap::new(),
        }
    }

    pub fn get(&self, id: &str) -> Option<&Document> {
        self.cache.get(id)
    }

    pub fn insert(&mut self, doc: Document) {
        self.cache.insert(doc.id.clone(), doc);
    }
}

fn main() {
    let mut service = DocumentService::new();
    let mut doc = Document::new("doc-001", "Research Paper", "Content here...");
    doc.add_tag("AI");

    service.insert(doc);
    println!("Document service initialized");
}
`,json:`{
  "name": "@ds/plugin-code-viewer",
  "version": "1.0.0",
  "description": "Code viewer plugin for DeepScientist",
  "author": "DeepScientist Team",
  "license": "MIT",
  "keywords": ["code", "viewer", "syntax", "highlight"],
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "react": "^18.0.0",
    "lucide-react": "^0.263.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest"
  },
  "peerDependencies": {
    "react": ">=18.0.0"
  }
}
`};export{de as default};
