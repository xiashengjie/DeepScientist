from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass
from html import unescape
from html.parser import HTMLParser
from typing import Any
from urllib.request import Request, urlopen

DEFAULT_TIMEOUT_SECONDS = 6
USER_AGENT = "DeepScientist/0.1"


@dataclass(frozen=True)
class _FetchPlan:
    name: str
    url: str
    content_mode: str
    parser: Callable[[str, str, str], dict[str, Any]]
    timeout: int = DEFAULT_TIMEOUT_SECONDS


class _HTMLTextExtractor(HTMLParser):
    _BLOCK_TAGS = {
        "article",
        "aside",
        "blockquote",
        "br",
        "caption",
        "dd",
        "div",
        "dl",
        "dt",
        "figcaption",
        "figure",
        "footer",
        "form",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "header",
        "hr",
        "li",
        "nav",
        "ol",
        "p",
        "pre",
        "section",
        "table",
        "tbody",
        "td",
        "th",
        "thead",
        "tr",
        "ul",
    }
    _SKIP_TAGS = {"script", "style", "noscript", "svg"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._skip_depth = 0
        self._parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in self._SKIP_TAGS:
            self._skip_depth += 1
            return
        if self._skip_depth:
            return
        if tag == "li":
            self._parts.append("\n- ")
        elif tag in self._BLOCK_TAGS:
            self._parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in self._SKIP_TAGS and self._skip_depth:
            self._skip_depth -= 1
            return
        if self._skip_depth:
            return
        if tag in self._BLOCK_TAGS:
            self._parts.append("\n")

    def handle_data(self, data: str) -> None:
        if self._skip_depth:
            return
        text = data.strip()
        if text:
            self._parts.append(unescape(text))

    def text(self) -> str:
        lines: list[str] = []
        for raw_line in "".join(self._parts).splitlines():
            line = re.sub(r"\s+", " ", raw_line).strip()
            if line:
                lines.append(line)
            elif lines and lines[-1] != "":
                lines.append("")
        return "\n".join(lines).strip()


def read_arxiv_content(paper_id: str, *, full_text: bool = False) -> dict[str, Any]:
    normalized_id = normalize_arxiv_id(paper_id)
    if not normalized_id:
        return {
            "ok": False,
            "paper_id": str(paper_id or "").strip(),
            "requested_full_text": full_text,
            "error": "Invalid arXiv paper id.",
            "attempts": [],
            "guidance": "Pass an arXiv id like `2010.11929` or `2401.12345v2`.",
        }

    attempts: list[dict[str, Any]] = []
    plans = _full_text_plans(normalized_id) if full_text else _overview_plans(normalized_id)
    for plan in plans:
        try:
            payload = _fetch_text(plan.url, timeout=plan.timeout)
            parsed = plan.parser(normalized_id, payload, plan.url)
            content = str(parsed.get("content") or "").strip()
            if not content:
                attempts.append(
                    {
                        "source": plan.name,
                        "url": plan.url,
                        "ok": False,
                        "error": "Empty response.",
                    }
                )
                continue
            attempts.append(
                {
                    "source": plan.name,
                    "url": plan.url,
                    "ok": True,
                    "content_mode": plan.content_mode,
                }
            )
            return {
                "ok": True,
                "paper_id": normalized_id,
                "requested_full_text": full_text,
                "content_mode": plan.content_mode,
                "source": plan.name,
                "source_url": plan.url,
                "title": parsed.get("title"),
                "authors": parsed.get("authors") or [],
                "content": content,
                "attempts": attempts,
                "guidance": "Use web search for discovery. Use `artifact.arxiv(...)` after you already know the arXiv paper id.",
            }
        except Exception as exc:  # noqa: BLE001
            attempts.append(
                {
                    "source": plan.name,
                    "url": plan.url,
                    "ok": False,
                    "error": _format_error(exc),
                }
            )

    mode = "full text" if full_text else "overview"
    return {
        "ok": False,
        "paper_id": normalized_id,
        "requested_full_text": full_text,
        "error": f"Unable to fetch arXiv {mode} content for `{normalized_id}`.",
        "attempts": attempts,
        "guidance": "Use web search to confirm the paper id or try again later.",
    }


def normalize_arxiv_id(raw_value: str) -> str | None:
    value = str(raw_value or "").strip()
    if not value:
        return None
    value = value.replace("https://", "").replace("http://", "")
    value = value.rstrip("/")
    value = value.removesuffix(".pdf").removesuffix(".md")
    patterns = (
        re.compile(r"(\d{4}\.\d{4,5}(?:v\d+)?)", re.IGNORECASE),
        re.compile(r"([a-z\-]+(?:\.[A-Z]{2})?/\d{7}(?:v\d+)?)", re.IGNORECASE),
    )
    for pattern in patterns:
        match = pattern.search(value)
        if match:
            return match.group(1)
    return None


def _overview_plans(paper_id: str) -> list[_FetchPlan]:
    return [
        _FetchPlan(
            name="alphaxiv_overview",
            url=f"https://www.alphaxiv.org/overview/{paper_id}.md",
            content_mode="overview",
            parser=_parse_markdown,
            timeout=4,
        ),
        _FetchPlan(
            name="arxiv_abstract",
            url=f"https://arxiv.org/abs/{paper_id}",
            content_mode="abstract",
            parser=_parse_arxiv_abstract_html,
        ),
        _FetchPlan(
            name="alphaxiv_full_text",
            url=f"https://www.alphaxiv.org/abs/{paper_id}.md",
            content_mode="full_text",
            parser=_parse_markdown,
        ),
    ]


def _full_text_plans(paper_id: str) -> list[_FetchPlan]:
    return [
        _FetchPlan(
            name="alphaxiv_full_text",
            url=f"https://www.alphaxiv.org/abs/{paper_id}.md",
            content_mode="full_text",
            parser=_parse_markdown,
        ),
        _FetchPlan(
            name="arxiv_html",
            url=f"https://arxiv.org/html/{paper_id}",
            content_mode="full_text",
            parser=_parse_article_html,
        ),
        _FetchPlan(
            name="ar5iv_labs_html",
            url=f"https://ar5iv.labs.arxiv.org/html/{paper_id}",
            content_mode="full_text",
            parser=_parse_article_html,
        ),
        _FetchPlan(
            name="ar5iv_html",
            url=f"https://ar5iv.org/html/{paper_id}",
            content_mode="full_text",
            parser=_parse_article_html,
        ),
        _FetchPlan(
            name="arxiv_abstract",
            url=f"https://arxiv.org/abs/{paper_id}",
            content_mode="abstract",
            parser=_parse_arxiv_abstract_html,
        ),
    ]


def _fetch_text(url: str, *, timeout: int) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/markdown,text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        },
    )
    with urlopen(request, timeout=timeout) as response:  # noqa: S310
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def _parse_markdown(paper_id: str, payload: str, url: str) -> dict[str, Any]:
    content = payload.lstrip("\ufeff").strip()
    if not content:
        return {"content": ""}
    title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else _first_nonempty_line(content)
    return {
        "title": title,
        "authors": [],
        "content": content,
    }


def _parse_arxiv_abstract_html(paper_id: str, payload: str, url: str) -> dict[str, Any]:
    title = _match_first(payload, r'<meta name="citation_title" content="([^"]+)"')
    if not title:
        title = _match_first(payload, r"<title>(.*?)</title>", flags=re.IGNORECASE | re.DOTALL)
    authors = re.findall(r'<meta name="citation_author" content="([^"]+)"', payload)
    abstract = _match_first(
        payload,
        r'<span class="descriptor">Abstract:</span>(.*?)</blockquote>',
        flags=re.IGNORECASE | re.DOTALL,
    )
    abstract = _clean_inline_text(abstract)
    if not abstract:
        abstract = _clean_inline_text(_extract_text(payload))
    lines = []
    if title:
        lines.extend([f"# {title}", ""])
    lines.append(f"- paper_id: {paper_id}")
    lines.append("- source: arXiv abstract page")
    if authors:
        lines.append(f"- authors: {', '.join(_clean_inline_text(author) for author in authors)}")
    lines.extend(["", "## Abstract", "", abstract or "Abstract unavailable."])
    return {
        "title": _clean_inline_text(title),
        "authors": [_clean_inline_text(author) for author in authors if _clean_inline_text(author)],
        "content": "\n".join(lines).strip(),
    }


def _parse_article_html(paper_id: str, payload: str, url: str) -> dict[str, Any]:
    title = _match_first(payload, r"<title>(.*?)</title>", flags=re.IGNORECASE | re.DOTALL)
    article = _match_first(payload, r"<article[^>]*>(.*?)</article>", flags=re.IGNORECASE | re.DOTALL)
    body = article or _match_first(payload, r"<body[^>]*>(.*?)</body>", flags=re.IGNORECASE | re.DOTALL) or payload
    text = _extract_text(body)
    if not text:
        return {"content": ""}
    cleaned_title = _clean_inline_text(title)
    if cleaned_title:
        text = _trim_duplicate_title(text, cleaned_title)
    lines = []
    if cleaned_title:
        lines.extend([f"# {cleaned_title}", ""])
    lines.append(f"- paper_id: {paper_id}")
    lines.append(f"- source: {url}")
    lines.extend(["", text])
    return {
        "title": cleaned_title,
        "authors": [],
        "content": "\n".join(lines).strip(),
    }


def _extract_text(payload: str) -> str:
    parser = _HTMLTextExtractor()
    parser.feed(payload)
    parser.close()
    return parser.text()


def _trim_duplicate_title(text: str, title: str) -> str:
    lines = [line for line in text.splitlines()]
    while lines and lines[0].strip().lower() == title.strip().lower():
        lines.pop(0)
    return "\n".join(lines).strip()


def _match_first(payload: str, pattern: str, *, flags: int = 0) -> str:
    match = re.search(pattern, payload, flags)
    if not match:
        return ""
    return unescape(match.group(1))


def _clean_inline_text(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(str(value or ""))).strip()


def _first_nonempty_line(text: str) -> str:
    for line in text.splitlines():
        cleaned = line.strip()
        if cleaned:
            return cleaned
    return ""


def _format_error(exc: Exception) -> str:
    message = str(exc).strip()
    return message or exc.__class__.__name__
