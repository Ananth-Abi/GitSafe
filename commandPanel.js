"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebviewContent = getWebviewContent;
exports.buildCheatSheetContent = buildCheatSheetContent;
const gitCommands_1 = require("./gitCommands");
function getWebviewContent(info, query) {
    const riskColor = getRiskColor(info.riskLevel);
    const riskLabel = gitCommands_1.RISK_LABELS[info.riskLevel];
    const undoSection = info.canUndo
        ? `<div class="undo yes">✅ Can be undone: <span>${esc(info.undoHow ?? '')}</span></div>`
        : `<div class="undo no">❌ Cannot be undone — this operation may be permanent</div>`;
    const whatHappensList = info.whatHappens.map(w => `<li>${esc(w)}</li>`).join('');
    const examplesHtml = info.examples.map(e => `
    <div class="example">
      <code>${esc(e.cmd)}</code>
      <span class="example-desc">${esc(e.explanation)}</span>
    </div>`).join('');
    const flagsHtml = info.flags
        ? info.flags.map(f => `
      <tr class="${f.risky ? 'risky-flag' : ''}">
        <td><code>${esc(f.flag)}</code></td>
        <td>${esc(f.meaning)}${f.risky ? ' ⚠️' : ''}</td>
      </tr>`).join('')
        : '';
    const flagsSection = info.flags ? `
    <h3>Common Flags</h3>
    <table class="flags-table">
      <thead><tr><th>Flag</th><th>What it does</th></tr></thead>
      <tbody>${flagsHtml}</tbody>
    </table>` : '';
    const tipSection = info.tip
        ? `<div class="tip">💡 <strong>Pro tip:</strong> ${esc(info.tip)}</div>`
        : '';
    const warningBanner = (info.riskLevel === 'high' || info.riskLevel === 'critical')
        ? `<div class="warning-banner">⚠️ <strong>Heads up!</strong> This command can cause data loss. Read carefully before running.</div>`
        : '';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GitSafe</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family, sans-serif);
      font-size: 13px;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 16px 20px;
      line-height: 1.6;
    }
    .queried { opacity: 0.5; font-size: 11px; margin-bottom: 10px; font-family: monospace; }
    .header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--vscode-panel-border, #333);
      padding-bottom: 14px;
    }
    .command-title { flex: 1; }
    .command-title h1 {
      font-size: 18px;
      font-weight: 700;
      font-family: var(--vscode-editor-font-family, monospace);
      color: var(--vscode-textLink-foreground, #4FC1FF);
      margin-bottom: 4px;
    }
    .summary { font-size: 13px; color: var(--vscode-descriptionForeground); }
    .risk-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      background: ${riskColor}22;
      color: ${riskColor};
      border: 1px solid ${riskColor}55;
    }
    .warning-banner {
      background: #FF572222;
      border-left: 3px solid #FF5722;
      padding: 10px 14px;
      border-radius: 4px;
      margin-bottom: 14px;
      font-size: 13px;
    }
    .description { margin-bottom: 14px; }
    h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--vscode-descriptionForeground);
      margin: 14px 0 8px 0;
    }
    ul.what-happens { padding-left: 18px; }
    ul.what-happens li { margin-bottom: 4px; }
    .undo { padding: 8px 12px; border-radius: 4px; margin: 14px 0; font-size: 12px; }
    .undo.yes { background: #4CAF5015; border-left: 3px solid #4CAF50; }
    .undo.no { background: #B71C1C15; border-left: 3px solid #B71C1C; }
    .undo span {
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 11px;
      display: block;
      margin-top: 3px;
      opacity: 0.85;
    }
    .example {
      background: var(--vscode-textBlockQuote-background, #1e1e1e);
      border: 1px solid var(--vscode-panel-border, #333);
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 6px;
    }
    .example code {
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 12px;
      color: var(--vscode-textLink-foreground, #4FC1FF);
      display: block;
      margin-bottom: 2px;
    }
    .example-desc { font-size: 11px; color: var(--vscode-descriptionForeground); }
    .flags-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .flags-table th {
      text-align: left;
      padding: 6px 8px;
      color: var(--vscode-descriptionForeground);
      border-bottom: 1px solid var(--vscode-panel-border, #333);
      font-weight: 600;
    }
    .flags-table td {
      padding: 5px 8px;
      border-bottom: 1px solid var(--vscode-panel-border, #22222244);
      vertical-align: top;
    }
    .flags-table td code {
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 11px;
      color: var(--vscode-textLink-foreground, #4FC1FF);
    }
    .flags-table tr.risky-flag td { color: #FF9800; }
    .tip {
      background: var(--vscode-textBlockQuote-background, #1e1e1e);
      border-left: 3px solid var(--vscode-textLink-foreground, #4FC1FF);
      padding: 8px 12px;
      border-radius: 0 4px 4px 0;
      margin-top: 14px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="queried">Matched: <strong>${esc(query)}</strong></div>
  <div class="header">
    <div class="command-title">
      <h1>${esc(info.command)}</h1>
      <div class="summary">${esc(info.summary)}</div>
    </div>
    <div class="risk-badge">${riskLabel}</div>
  </div>
  ${warningBanner}
  <div class="description">${esc(info.description)}</div>
  <h3>What actually happens</h3>
  <ul class="what-happens">${whatHappensList}</ul>
  ${undoSection}
  <h3>Examples</h3>
  ${examplesHtml}
  ${flagsSection}
  ${tipSection}
</body>
</html>`;
}
function esc(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function getRiskColor(level) {
    const map = {
        safe: '#4CAF50',
        low: '#8BC34A',
        medium: '#FF9800',
        high: '#FF5722',
        critical: '#CF2828',
    };
    return map[level];
}
function buildCheatSheetContent(commands) {
    const rows = commands.map(c => {
        const color = getRiskColor(c.riskLevel);
        return `
    <tr>
      <td><code>${esc(c.command)}</code></td>
      <td>${esc(c.summary)}</td>
      <td style="color:${color}; font-weight:600">${gitCommands_1.RISK_LABELS[c.riskLevel]}</td>
      <td>${c.canUndo ? '✅' : '❌'}</td>
    </tr>`;
    }).join('');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GitSafe — Cheat Sheet</title>
  <style>
    body {
      font-family: var(--vscode-font-family, sans-serif);
      font-size: 13px;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 20px;
    }
    h1 { font-size: 20px; margin-bottom: 6px; }
    p { color: var(--vscode-descriptionForeground); margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left;
      padding: 8px 10px;
      border-bottom: 2px solid var(--vscode-panel-border, #444);
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid var(--vscode-panel-border, #2a2a2a);
      vertical-align: top;
    }
    td code {
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 12px;
      color: var(--vscode-textLink-foreground, #4FC1FF);
    }
    tr:hover td { background: var(--vscode-list-hoverBackground, #2a2a2a); }
  </style>
</head>
<body>
  <h1>🛡️ GitSafe — Command Reference</h1>
  <p>Quick reference for all covered git commands.</p>
  <table>
    <thead>
      <tr>
        <th>Command</th>
        <th>What it does</th>
        <th>Risk Level</th>
        <th>Reversible?</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}
//# sourceMappingURL=commandPanel.js.map