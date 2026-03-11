import * as vscode from 'vscode';
import { matchCommand, GIT_COMMANDS, RiskLevel } from './gitCommands';
import { getWebviewContent, buildCheatSheetContent } from './commandPanel';

let explanationPanel: vscode.WebviewPanel | undefined;
let cheatSheetPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('GitSafe is now active');

  // ── Command: Explain via input box ──────────────────────────────────────
  const explainCommand = vscode.commands.registerCommand('gitsafe.explainCommand', async () => {
    const input = await vscode.window.showInputBox({
      prompt: 'Type a git command to explain',
      placeHolder: 'e.g.  git reset --hard   or   git clean -fd',
      title: 'GitSafe — Explain Command',
    });
    if (!input) return;
    showExplanation(input, context);
  });

  // ── Command: Cheat sheet ─────────────────────────────────────────────────
  const cheatSheetCommand = vscode.commands.registerCommand('gitsafe.showCheatSheet', () => {
    showCheatSheet(context);
  });

  // ── Command: Quick pick from all commands ────────────────────────────────
  const quickPickCommand = vscode.commands.registerCommand('gitsafe.quickPick', async () => {
    const items = GIT_COMMANDS.map(cmd => ({
      label: cmd.command,
      description: cmd.summary,
      detail: getRiskLabel(cmd.riskLevel),
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a git command to explain',
      title: 'GitSafe — Pick a Command',
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (!selected) return;
    showExplanation(selected.label, context);
  });

  // ── Terminal Link Provider ───────────────────────────────────────────────
  const linkProvider = vscode.window.registerTerminalLinkProvider({
    provideTerminalLinks(terminalContext) {
      const line = terminalContext.line;

      // Match any git command anywhere in the line
      const match = line.match(/(git\s+\S+(?:\s+\S+)*)/);
      if (!match) return [];

      const info = matchCommand(match[1]);
      if (!info) return [];

      const config = vscode.workspace.getConfiguration('gitsafe');
      const minLevel = config.get<string>('riskLevel', 'medium-and-above');
      if (!shouldShowForLevel(info.riskLevel, minLevel)) return [];

      const startIndex = line.indexOf(match[1]);
      if (startIndex === -1) return [];

      return [{
        startIndex,
        length: match[1].length,
        tooltip: `GitSafe: ${getRiskLabel(info.riskLevel)} — Click to learn what this command does`,
        data: match[1],
      }];
    },

    handleTerminalLink(link: vscode.TerminalLink & { data: string }) {
      showExplanation(link.data, context);
    },
  });

  // ── Status bar button ────────────────────────────────────────────────────
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.text = '$(shield) GitSafe';
  statusBar.tooltip = 'Click to browse git commands safely';
  statusBar.command = 'gitsafe.quickPick';
  statusBar.show();

  context.subscriptions.push(
    explainCommand,
    cheatSheetCommand,
    quickPickCommand,
    linkProvider,
    statusBar,
  );

  // ── Welcome message ──────────────────────────────────────────────────────
  vscode.window.showInformationMessage(
    '🛡️ GitSafe is active! Git commands in the terminal are now clickable. Click the shield below to browse all commands.',
    'Browse Commands',
  ).then(choice => {
    if (choice === 'Browse Commands') {
      vscode.commands.executeCommand('gitsafe.quickPick');
    }
  });
}

function getRiskLabel(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    safe: '✅ Safe',
    low: '🟡 Low Risk',
    medium: '🟠 Medium Risk',
    high: '🔴 High Risk',
    critical: '🚨 Critical — Destructive',
  };
  return map[level];
}

function shouldShowForLevel(level: RiskLevel, setting: string): boolean {
  const order: RiskLevel[] = ['safe', 'low', 'medium', 'high', 'critical'];
  const thresholds: Record<string, RiskLevel> = {
    'all': 'safe',
    'medium-and-above': 'medium',
    'high-only': 'high',
  };
  const threshold = thresholds[setting] ?? 'medium';
  return order.indexOf(level) >= order.indexOf(threshold);
}

function showExplanation(query: string, context: vscode.ExtensionContext) {
  const info = matchCommand(query);

  if (!info) {
    vscode.window.showInformationMessage(
      `GitSafe: No info found for "${query}". Try the command list.`,
      'Browse All Commands',
    ).then(choice => {
      if (choice === 'Browse All Commands') {
        vscode.commands.executeCommand('gitsafe.quickPick');
      }
    });
    return;
  }

  // Warning popup for destructive commands
  if (info.riskLevel === 'high' || info.riskLevel === 'critical') {
    vscode.window.showWarningMessage(
      `⚠️ GitSafe: "${info.command}" is ${info.riskLevel}-risk. ${info.riskReason ?? ''}`,
      'See Full Details',
      'Dismiss',
    ).then(choice => {
      if (choice === 'See Full Details') {
        openPanel(info!, query, context);
      }
    });
  }

  openPanel(info, query, context);
}

function openPanel(
  info: NonNullable<ReturnType<typeof matchCommand>>,
  query: string,
  context: vscode.ExtensionContext,
) {
  if (explanationPanel) {
    explanationPanel.title = `GitSafe: ${info.command}`;
    explanationPanel.webview.html = getWebviewContent(info, query);
    explanationPanel.reveal(vscode.ViewColumn.Beside, true);
  } else {
    explanationPanel = vscode.window.createWebviewPanel(
      'gitsafeExplain',
      `GitSafe: ${info.command}`,
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { enableScripts: false },
    );
    explanationPanel.webview.html = getWebviewContent(info, query);
    explanationPanel.onDidDispose(() => {
      explanationPanel = undefined;
    }, null, context.subscriptions);
  }
}

function showCheatSheet(context: vscode.ExtensionContext) {
  if (cheatSheetPanel) {
    cheatSheetPanel.reveal(vscode.ViewColumn.One);
    return;
  }
  cheatSheetPanel = vscode.window.createWebviewPanel(
    'gitsafeCheatSheet',
    'GitSafe — Cheat Sheet',
    vscode.ViewColumn.One,
    { enableScripts: false },
  );
  cheatSheetPanel.webview.html = buildCheatSheetContent(GIT_COMMANDS);
  cheatSheetPanel.onDidDispose(() => {
    cheatSheetPanel = undefined;
  }, null, context.subscriptions);
}

export function deactivate() {}