/**
 * 把第四范式 B 轮两份交叉验证报告分别导出为单文件 HTML（自包含 + 内联 CSS）。
 * 数据源：
 *   - src/data/sifanshi-report.ts            （投资备忘录 ⇄ 多源尽调）
 *   - src/data/sifanshi-validation-report.ts （投资备忘录事实交叉验证）
 *
 * 运行方式：
 *   npx tsx scripts/export-sifanshi-html.ts
 *
 * 输出位置：
 *   exports/第四范式B轮-投资备忘录-交叉验证报告.html
 *   exports/第四范式B轮-投资备忘录-事实交叉验证报告.html
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { sifanshiReportMessages } from "../src/data/sifanshi-report";
import { sifanshiValidationReportMessages } from "../src/data/sifanshi-validation-report";
import { RISK_LEVEL_CONFIG } from "../src/lib/risk-level";
import type {
  AssistantBlock,
  DiligenceContent,
  DiligenceSection,
  SemanticTone,
  SourceAnchor,
  VerificationCardItem,
  VerificationCategory,
  VerificationVerdict,
} from "../src/types";

type DiligenceBlock = Extract<AssistantBlock, { kind: "diligence-report" }>;

const __dirname = dirname(fileURLToPath(import.meta.url));

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 把正文中的 **加粗** + [^N] 引用渲染为 HTML：
 *   - **xxx** → <mark>xxx</mark>
 *   - [^N]   → <sup class="cite" data-idx="N">N</sup>
 */
function renderRichText(text: string, citationCount: number): string {
  const escaped = escapeHtml(text);
  // 引用：[^N]
  const withCites = escaped.replace(/\[\^(\d+)\]/g, (_m, idx: string) => {
    const n = parseInt(idx, 10);
    if (n < 1 || n > citationCount) return "";
    return `<sup class="cite"><a href="#cite-${n}">${n}</a></sup>`;
  });
  // 加粗：**xxx**
  return withCites.replace(
    /\*\*([^*]+)\*\*/g,
    (_m, body: string) => `<mark class="hl">${body}</mark>`
  );
}

/** 4 类语义色 */
const TONE_STYLE: Record<
  SemanticTone,
  { wrap: string; text: string; iconBg: string }
> = {
  danger: { wrap: "tone-danger", text: "text-danger", iconBg: "ic-danger" },
  warning: { wrap: "tone-warning", text: "text-warning", iconBg: "ic-warning" },
  neutral: { wrap: "tone-neutral", text: "text-neutral", iconBg: "ic-neutral" },
  positive: { wrap: "tone-positive", text: "text-positive", iconBg: "ic-positive" },
};

/** 7 类验证分类的着色 */
const CATEGORY_STYLE: Record<VerificationCategory, string> = {
  财务数据: "cat-blue",
  募资: "cat-violet",
  融资数据: "cat-violet",
  法务合规: "cat-cyan",
  客户数据: "cat-orange",
  业务数据: "cat-emerald",
  市场行业: "cat-pink",
  团队治理: "cat-indigo",
};

/** 4 类结论 */
const VERDICT_STYLE: Record<VerificationVerdict, string> = {
  一致: "verdict-ok",
  部分一致: "verdict-partial",
  不一致: "verdict-bad",
  证据不足: "verdict-insufficient",
};

function renderContent(content: DiligenceContent, citationCount: number): string {
  switch (content.type) {
    case "paragraph":
      return `<p class="paragraph">${renderRichText(content.text, citationCount)}</p>`;

    case "bullets": {
      const Tag = content.ordered ? "ol" : "ul";
      const items = content.items
        .map((it) => `<li>${renderRichText(it, citationCount)}</li>`)
        .join("");
      return `<${Tag} class="bullets ${content.ordered ? "ordered" : "dotted"}">${items}</${Tag}>`;
    }

    case "callout": {
      const s = TONE_STYLE[content.tone];
      return `<div class="callout ${s.wrap}">
  ${content.title ? `<p class="callout-title ${s.text}">${escapeHtml(content.title)}</p>` : ""}
  <p class="callout-body">${renderRichText(content.text, citationCount)}</p>
</div>`;
    }

    case "stats": {
      const cards = content.items
        .map((s) => {
          const tone = s.tone ? TONE_STYLE[s.tone].text : "";
          return `<div class="stat-card">
  <p class="stat-label">${escapeHtml(s.label)}</p>
  <p class="stat-value ${tone}">${escapeHtml(s.value)}</p>
  ${s.sub ? `<p class="stat-sub">${escapeHtml(s.sub)}</p>` : ""}
</div>`;
        })
        .join("");
      return `<div class="stats-grid">${cards}</div>`;
    }

    case "bars": {
      const rows = content.items
        .map((b) => {
          const tone = b.tone ? TONE_STYLE[b.tone].text : "";
          const fillClass = b.tone ? `bar-fill-${b.tone}` : "bar-fill-neutral";
          const w = Math.max(2, Math.min(100, b.value));
          return `<div class="bar-row">
  <div class="bar-meta">
    <span class="bar-label">${escapeHtml(b.label)}</span>
    <span class="bar-value ${tone}">${escapeHtml(b.display)}</span>
  </div>
  <div class="bar-track"><div class="bar-fill ${fillClass}" style="width:${w}%"></div></div>
</div>`;
        })
        .join("");
      return `<div class="bars-block">
  ${content.caption ? `<p class="bars-caption">${escapeHtml(content.caption)}</p>` : ""}
  <div class="bars-list">${rows}</div>
</div>`;
    }

    case "table": {
      const headers = content.headers
        .map((h) => `<th>${escapeHtml(h)}</th>`)
        .join("");
      const rows = content.rows
        .map(
          (row) =>
            `<tr>${row
              .map(
                (cell, ci) =>
                  `<td class="${ci === content.emphasizeCol ? "emphasize" : ""}">${renderRichText(cell, citationCount)}</td>`
              )
              .join("")}</tr>`
        )
        .join("");
      return `<div class="table-wrap"><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
    }

    case "verification-cards": {
      const cardsHtml = content.items
        .map((it) => renderVerificationCard(it))
        .join("");
      if (!content.caption) return `<div class="vcards">${cardsHtml}</div>`;
      // 有 caption 时包成可折叠 details 块
      const isOpen = !(content.defaultCollapsed ?? false);
      return `<details class="vcards-group" ${isOpen ? "open" : ""}>
  <summary>${escapeHtml(content.caption)}</summary>
  <div class="vcards">${cardsHtml}</div>
</details>`;
    }

    default:
      return "";
  }
}

function renderSourceAnchor(a: SourceAnchor): string {
  const docLine = `${escapeHtml(a.document)} · P${escapeHtml(String(a.page))}${a.paragraph ? ` · ${escapeHtml(a.paragraph)}` : ""}`;
  const excerpt = escapeHtml(a.excerpt ?? "");
  return `<div class="src-anchor" title="${excerpt}">
  <span class="src-doc">${docLine}</span>
</div>`;
}

function renderVerificationCard(item: VerificationCardItem): string {
  const catClass = CATEGORY_STYLE[item.category];
  const verdictClass = VERDICT_STYLE[item.verdict];
  const riskCfg = RISK_LEVEL_CONFIG[item.riskLevel];
  const claimSources = (item.claimSources ?? [])
    .map(
      (a) =>
        `<span class="src-chip" title="${escapeHtml(a.excerpt ?? "")}">${escapeHtml(a.document)} · P${escapeHtml(String(a.page))}</span>`
    )
    .join("");
  const evidenceSources = item.evidenceSources.map(renderSourceAnchor).join("");

  return `<article class="vcard">
  <header class="vcard-head">
    <div class="vcard-chips">
      <span class="chip ${catClass}"><span class="chip-dot"></span>${escapeHtml(item.category)}</span>
      <span class="chip chip-risk chip-risk-${item.riskLevel}">${escapeHtml(riskCfg.label)}</span>
    </div>
    <span class="chip ${verdictClass}">${escapeHtml(item.verdict)}</span>
  </header>
  <div class="vcard-body">
    <section class="vcard-claim">
      <p class="vcard-eyebrow">
        <span class="vcard-index">#${item.index}</span>
        投资备忘录 · 主张
      </p>
      <p class="vcard-text claim-text">${escapeHtml(item.claim)}</p>
      ${claimSources ? `<div class="src-chips">${claimSources}</div>` : ""}
    </section>
    <section class="vcard-evidence">
      <p class="vcard-eyebrow">证据摘要</p>
      <p class="vcard-text evidence-text">${escapeHtml(item.evidence)}</p>
      ${
        evidenceSources
          ? `<details class="src-list"><summary>证据来源 · ${item.evidenceSources.length}</summary><div>${evidenceSources}</div></details>`
          : ""
      }
    </section>
  </div>
</article>`;
}

function renderSection(section: DiligenceSection, citationCount: number): string {
  const body = section.content
    .map((c) => renderContent(c, citationCount))
    .join("\n");
  const isOpen = section.defaultOpen ?? true;
  return `<details id="${section.id}" class="section" ${isOpen ? "open" : ""}>
  <summary class="section-head"><span>${escapeHtml(section.title)}</span></summary>
  <div class="section-body">${body}</div>
</details>`;
}

function renderToc(sections: DiligenceSection[]): string {
  const items = sections
    .map(
      (s) =>
        `<li><a href="#${s.id}">${escapeHtml(s.title)}</a></li>`
    )
    .join("");
  return `<nav class="toc">
  <p class="toc-title">目录</p>
  <ol>${items}</ol>
</nav>`;
}

function renderCitations(citations: SourceAnchor[]): string {
  if (citations.length === 0) return "";
  const rows = citations
    .map(
      (a, i) => `<li id="cite-${i + 1}" class="citation">
  <span class="cite-index">[${i + 1}]</span>
  <div class="cite-body">
    <p class="cite-doc">${escapeHtml(a.document)} · P${escapeHtml(String(a.page))}${a.paragraph ? ` · ${escapeHtml(a.paragraph)}` : ""}</p>
    <p class="cite-excerpt">「${escapeHtml(a.excerpt)}」</p>
  </div>
</li>`
    )
    .join("");
  return `<section class="citations">
  <h2>引用与原文摘要（共 ${citations.length} 条）</h2>
  <ol class="citations-list">${rows}</ol>
</section>`;
}

function renderReport(report: DiligenceBlock): string {
  const verdictRecommendationClass =
    report.verdict.recommendation.includes("暂缓") ||
    report.verdict.recommendation.includes("否决")
      ? "verdict-danger"
      : report.verdict.recommendation.includes("附条件")
        ? "verdict-warning"
        : "verdict-positive";

  const metrics = report.metrics
    .map((m) => {
      const tone = m.tone ? TONE_STYLE[m.tone].text : "";
      return `<div class="metric-card">
  <p class="metric-label">${escapeHtml(m.label)}</p>
  <p class="metric-value ${tone}">${escapeHtml(m.value)}</p>
  ${m.sub ? `<p class="metric-sub">${escapeHtml(m.sub)}</p>` : ""}
</div>`;
    })
    .join("");

  const citationCount = report.citations.length;
  const toc = renderToc(report.sections);
  const sections = report.sections
    .map((s) => renderSection(s, citationCount))
    .join("\n");

  return `<header class="report-header">
  <p class="report-eyebrow">尽调复核报告</p>
  <h1>${escapeHtml(report.title)}</h1>
  <p class="report-company">${escapeHtml(report.company)}</p>
  <div class="verdict-grid">
    <div class="verdict-card ${verdictRecommendationClass}">
      <p class="verdict-label">最终建议</p>
      <p class="verdict-value">${escapeHtml(report.verdict.recommendation)}</p>
    </div>
    <div class="verdict-card">
      <p class="verdict-label">整体风险评级</p>
      <p class="verdict-value risk-${report.verdict.riskLevel}">${escapeHtml(RISK_LEVEL_CONFIG[report.verdict.riskLevel].label)}</p>
    </div>
    <div class="verdict-card">
      <p class="verdict-label">估值判断</p>
      <p class="verdict-value">${escapeHtml(report.verdict.valuation)}</p>
    </div>
  </div>
  <p class="report-summary">${renderRichText(report.summary, citationCount)}</p>
</header>

<section class="metrics-grid">${metrics}</section>

<main class="report-main">
  <aside class="toc-wrap">${toc}</aside>
  <div class="sections-wrap">${sections}</div>
</main>

${renderCitations(report.citations)}`;
}

const css = String.raw`
:root {
  --bg: #f5f7fb;
  --card: #ffffff;
  --border: #e2e8f0;
  --border-soft: #eef2f7;
  --text: #0f172a;
  --text-muted: #475569;
  --text-soft: #94a3b8;
  --accent: #2563eb;
  --accent-soft: #dbeafe;
  --shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 28px rgba(15, 23, 42, 0.04);
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei",
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
  font-size: 14px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
.container { max-width: 1180px; margin: 0 auto; padding: 32px 24px 80px; }

/* ============ 报告头 ============ */
.report-header {
  padding: 28px 32px;
  background: linear-gradient(180deg, #ffffff 0%, rgba(241, 245, 249, 0.6) 100%);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: var(--shadow);
}
.report-eyebrow {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--text-soft);
}
.report-header h1 {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text);
  line-height: 1.3;
}
.report-company {
  margin: 0 0 18px;
  font-size: 13px;
  color: var(--text-muted);
}
.verdict-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.verdict-card {
  border: 1px solid var(--border);
  background: #ffffff;
  border-radius: 14px;
  padding: 12px 14px;
}
.verdict-label {
  margin: 0 0 4px;
  font-size: 11px;
  color: var(--text-soft);
}
.verdict-value {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}
.verdict-danger { background: #fef2f2; }
.verdict-danger .verdict-value { color: #b91c1c; }
.verdict-warning { background: #fffbeb; }
.verdict-warning .verdict-value { color: #b45309; }
.verdict-positive .verdict-value { color: #047857; }
.risk-R1 { color: #047857; }
.risk-R2 { color: #0369a1; }
.risk-R3 { color: #b45309; }
.risk-R4 { color: #c2410c; }
.risk-R5 { color: #b91c1c; }
.report-summary {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-muted);
}

/* ============ 顶部 KPI 网格 ============ */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  margin: 18px 0 24px;
}
.metric-card {
  border: 1px solid var(--border);
  background: #ffffff;
  border-radius: 14px;
  padding: 12px 14px;
}
.metric-label {
  margin: 0 0 4px;
  font-size: 11px;
  color: var(--text-soft);
}
.metric-value {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--text);
}
.metric-sub {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--text-soft);
}

/* ============ 主体（目录 + 章节） ============ */
.report-main {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
}
@media (max-width: 880px) {
  .report-main { grid-template-columns: 1fr; }
}
.toc-wrap { position: sticky; top: 16px; align-self: start; }
.toc {
  border: 1px solid var(--border);
  background: #ffffff;
  border-radius: 14px;
  padding: 12px 14px;
  box-shadow: var(--shadow);
}
.toc-title {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-soft);
}
.toc ol {
  list-style: none;
  margin: 0;
  padding: 0;
}
.toc li + li { margin-top: 2px; }
.toc a {
  display: block;
  padding: 6px 8px;
  border-radius: 8px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 12px;
  line-height: 1.4;
}
.toc a:hover { background: #f1f5f9; color: var(--text); }

/* ============ 章节 ============ */
.sections-wrap { display: flex; flex-direction: column; gap: 12px; }
.section {
  border: 1px solid var(--border);
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow);
}
.section > summary {
  list-style: none;
  cursor: pointer;
  padding: 14px 18px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section > summary::-webkit-details-marker { display: none; }
.section > summary::after {
  content: "▾";
  font-size: 12px;
  color: var(--text-soft);
  transition: transform 0.15s ease;
}
.section[open] > summary::after { transform: rotate(180deg); }
.section-body { padding: 4px 18px 18px; display: flex; flex-direction: column; gap: 12px; }

/* ============ 通用文本 ============ */
.paragraph {
  margin: 0;
  font-size: 13px;
  line-height: 1.75;
  color: var(--text);
}
.bullets {
  margin: 0;
  padding-left: 22px;
  font-size: 13px;
  line-height: 1.75;
  color: var(--text);
}
.bullets.dotted { list-style-type: disc; }
.bullets li + li { margin-top: 4px; }
mark.hl {
  background: rgba(254, 240, 138, 0.7);
  color: #78350f;
  padding: 0 2px;
  border-radius: 3px;
  font-weight: 600;
}
sup.cite a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 15px;
  padding: 0 4px;
  margin: 0 2px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: none;
  background: #f1f5f9;
  border: 1px solid var(--border);
  border-radius: 4px;
}
sup.cite a:hover { background: var(--text); color: #ffffff; border-color: var(--text); }

/* ============ 标注（callout） ============ */
.callout {
  border: 1px solid;
  border-radius: 12px;
  padding: 12px 14px;
}
.callout-title { margin: 0 0 4px; font-size: 12px; font-weight: 600; }
.callout-body { margin: 0; font-size: 12.5px; line-height: 1.65; color: var(--text); }
.tone-danger { background: rgba(254, 226, 226, 0.5); border-color: #fecaca; }
.tone-danger .text-danger { color: #b91c1c; }
.tone-warning { background: rgba(254, 243, 199, 0.5); border-color: #fde68a; }
.tone-warning .text-warning { color: #b45309; }
.tone-neutral { background: rgba(241, 245, 249, 0.6); border-color: var(--border); }
.tone-neutral .text-neutral { color: var(--text-muted); }
.tone-positive { background: rgba(209, 250, 229, 0.5); border-color: #a7f3d0; }
.tone-positive .text-positive { color: #047857; }
.text-danger { color: #b91c1c; }
.text-warning { color: #b45309; }
.text-positive { color: #047857; }
.text-neutral { color: var(--text-muted); }

/* ============ KPI 子卡 + 横向条形 ============ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}
.stat-card {
  border: 1px solid var(--border);
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 14px;
}
.stat-label { margin: 0 0 4px; font-size: 11px; color: var(--text-soft); }
.stat-value {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}
.stat-sub { margin: 6px 0 0; font-size: 11px; color: var(--text-soft); }

.bars-block {
  border: 1px solid var(--border);
  background: #ffffff;
  border-radius: 12px;
  padding: 14px 16px;
}
.bars-caption {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-soft);
}
.bars-list { display: flex; flex-direction: column; gap: 10px; }
.bar-row { display: flex; flex-direction: column; gap: 4px; }
.bar-meta { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.bar-label { font-size: 12px; color: var(--text-muted); }
.bar-value { font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }
.bar-track {
  height: 8px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}
.bar-fill { height: 100%; border-radius: 999px; transition: width 0.3s ease; }
.bar-fill-positive { background: #34d399; }
.bar-fill-warning { background: #fbbf24; }
.bar-fill-danger { background: #f87171; }
.bar-fill-neutral { background: #94a3b8; }

/* ============ 表格 ============ */
.table-wrap {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.table-wrap table { width: 100%; border-collapse: collapse; font-size: 12px; }
.table-wrap thead tr { background: #f8fafc; }
.table-wrap th {
  text-align: left;
  padding: 10px 12px;
  font-weight: 600;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
}
.table-wrap td {
  padding: 10px 12px;
  vertical-align: top;
  color: var(--text);
  border-bottom: 1px solid var(--border-soft);
}
.table-wrap td.emphasize { font-weight: 600; color: var(--text); }
.table-wrap tbody tr:last-child td { border-bottom: none; }

/* ============ 验证卡片 ============ */
.vcards { display: flex; flex-direction: column; gap: 10px; }
.vcards-group {
  border: 1px solid var(--border);
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
}
.vcards-group > summary {
  cursor: pointer;
  list-style: none;
  padding: 10px 14px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-muted);
  background: #f8fafc;
  user-select: none;
}
.vcards-group > summary::-webkit-details-marker { display: none; }
.vcards-group > summary::after { content: " ▾"; color: var(--text-soft); font-size: 10px; }
.vcards-group[open] > summary::after { content: " ▴"; }
.vcards-group > div { padding: 10px 12px; }

.vcard {
  border: 1px solid var(--border);
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.vcard-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-soft);
  background: #ffffff;
}
.vcard-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid transparent;
  border-radius: 999px;
}
.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.7;
}
.cat-blue { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.cat-violet { border-color: #ddd6fe; background: #f5f3ff; color: #6d28d9; }
.cat-cyan { border-color: #a5f3fc; background: #ecfeff; color: #0e7490; }
.cat-orange { border-color: #fed7aa; background: #fff7ed; color: #c2410c; }
.cat-emerald { border-color: #a7f3d0; background: #ecfdf5; color: #047857; }
.cat-pink { border-color: #fbcfe8; background: #fdf2f8; color: #be185d; }
.cat-indigo { border-color: #c7d2fe; background: #eef2ff; color: #4338ca; }

.chip-risk-R1 { border-color: #a7f3d0; background: #ecfdf5; color: #065f46; }
.chip-risk-R2 { border-color: #bae6fd; background: #f0f9ff; color: #0369a1; }
.chip-risk-R3 { border-color: #fde68a; background: #fffbeb; color: #92400e; }
.chip-risk-R4 { border-color: #fdba74; background: #fff7ed; color: #9a3412; }
.chip-risk-R5 { border-color: #fecaca; background: #fef2f2; color: #991b1b; }

.verdict-ok { border-color: #a7f3d0; background: #ecfdf5; color: #047857; font-weight: 600; }
.verdict-partial { border-color: #fde68a; background: #fffbeb; color: #b45309; font-weight: 600; }
.verdict-bad { border-color: #fecaca; background: #fef2f2; color: #b91c1c; font-weight: 600; }
.verdict-insufficient { border-color: var(--border); background: #f1f5f9; color: var(--text-muted); font-weight: 600; }

.vcard-body {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
}
@media (max-width: 720px) {
  .vcard-body { grid-template-columns: 1fr; }
}
.vcard-claim {
  position: relative;
  padding: 14px 16px 14px 20px;
  background: #ffffff;
  border-right: 1px solid var(--border-soft);
}
@media (max-width: 720px) {
  .vcard-claim { border-right: 0; border-bottom: 1px solid var(--border-soft); }
}
.vcard-claim::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 14px;
  bottom: 14px;
  width: 3px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.8);
}
.vcard-evidence { padding: 14px 16px; background: rgba(241, 245, 249, 0.4); }
.vcard-eyebrow {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}
.vcard-index {
  background: #0f172a;
  color: #ffffff;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}
.vcard-text {
  margin: 0;
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.75;
}
.claim-text { color: var(--text); font-weight: 500; }
.evidence-text { color: var(--text-muted); font-size: 12.5px; }
.src-chips { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 4px; }
.src-chip {
  display: inline-block;
  padding: 2px 8px;
  font-size: 10.5px;
  color: var(--text-muted);
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 6px;
}
.src-list { margin-top: 12px; }
.src-list > summary {
  cursor: pointer;
  list-style: none;
  text-align: right;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--accent);
  user-select: none;
}
.src-list > summary::-webkit-details-marker { display: none; }
.src-list > summary::after { content: " ›"; }
.src-list[open] > summary::after { content: " ▾"; }
.src-list > div { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
.src-anchor {
  border: 1px solid var(--border);
  background: #ffffff;
  border-radius: 8px;
  padding: 6px 10px;
}
.src-doc { font-size: 11.5px; color: var(--text-muted); }

/* ============ 引用底部清单 ============ */
.citations {
  margin-top: 32px;
  padding: 22px 26px;
  border: 1px solid var(--border);
  background: #ffffff;
  border-radius: 16px;
  box-shadow: var(--shadow);
}
.citations h2 {
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}
.citations-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 12px; }
.citation { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; border-top: 1px solid var(--border-soft); }
.citation:first-child { border-top: 0; padding-top: 0; }
.cite-index {
  background: #f1f5f9;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 1px 6px;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.cite-body { flex: 1; min-width: 0; }
.cite-doc { margin: 0 0 4px; font-size: 12px; font-weight: 600; color: var(--text); }
.cite-excerpt { margin: 0; font-size: 12px; line-height: 1.7; color: var(--text-muted); }

/* ============ 打印优化 ============ */
@media print {
  body { background: #ffffff; }
  .container { padding: 0; max-width: none; }
  .toc-wrap { display: none; }
  .report-main { grid-template-columns: 1fr; }
  .section, .vcard, .vcards-group, .metric-card, .stat-card, .bars-block, .table-wrap, .verdict-card, .report-header, .citations {
    break-inside: avoid;
    box-shadow: none;
  }
  .section[open] > summary::after, .section > summary::after { display: none; }
  details, details[open] { display: block; }
  details > summary { pointer-events: none; }
  .vcards-group, .src-list { border: none; }
  .vcards-group > div, .src-list > div { padding: 0; margin-top: 6px; }
}
`;

function extractReportBlock(
  messages: typeof sifanshiReportMessages,
  contextLabel: string
): DiligenceBlock {
  for (const m of messages) {
    if (m.role !== "assistant" || !m.blocks?.length) continue;
    const found = m.blocks.find(
      (b): b is DiligenceBlock => b.kind === "diligence-report"
    );
    if (found) return found;
  }
  throw new Error(`未在 ${contextLabel} 中找到 diligence-report 块`);
}

function exportReport(block: DiligenceBlock, fileName: string, outDir: string) {
  const bodyHtml = renderReport(block);
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(block.title)}</title>
  <style>${css}</style>
</head>
<body>
  <div class="container">
    ${bodyHtml}
  </div>
</body>
</html>
`;
  const outPath = resolve(outDir, fileName);
  writeFileSync(outPath, html, "utf8");
  console.log(`✔ 报告已导出：${outPath}`);
  console.log(`  共 ${block.sections.length} 个章节、${block.citations.length} 条引用。`);
}

function main() {
  const outDir = resolve(__dirname, "../exports");
  mkdirSync(outDir, { recursive: true });

  const crossCheck = extractReportBlock(sifanshiReportMessages, "sifanshiReportMessages");
  exportReport(crossCheck, "第四范式B轮-投资备忘录-交叉验证报告.html", outDir);

  const validation = extractReportBlock(
    sifanshiValidationReportMessages,
    "sifanshiValidationReportMessages"
  );
  exportReport(validation, "第四范式B轮-投资备忘录-事实交叉验证报告.html", outDir);
}

main();
