"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const gitCommands_1 = require("./gitCommands");
const commandPanel_1 = require("./commandPanel");
let explanationPanel;
let cheatSheetPanel;
let lastExplainedInput = '';
let terminalBuffer = '';
function activate(context) {
    console.log('GitSafe is now active');
    // ── Command: Explain via input box ──────────────────────────────────────
    const explainCommand = vscode.commands.registerCommand('gitsafe.explainCommand', async () => {
        const input = await vscode.window.showInputBox({
            prompt: 'Type a git command to explain',
            placeHolder: 'e.g.  git reset --hard   or   git clean -fd',
            title: 'GitSafe — Explain Command',
        });
        if (!input)
            return;
        showExplanation(input, context);
    });
    // ── Command: Cheat sheet ─────────────────────────────────────────────────
    const cheatSheetCommand = vscode.commands.registerCommand('gitsafe.showCheatSheet', () => {
        showCheatSheet(context);
    });
    // ── Terminal watcher ─────────────────────────────────────────────────────
    const terminalWatcher = vscode.window.onDidWriteTerminalData(event => {
        const config = vscode.workspace.getConfiguration('gitsafe');
        if (!config.get('enableTerminalMonitoring', true))
            return;
        handleTerminalData(event.data, context);
    });
    // ── Status bar button ────────────────────────────────────────────────────
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBar.text = '$(shield) GitSafe';
    statusBar.tooltip = 'Click to explain a git command';
    statusBar.command = 'gitsafe.explainCommand';
    statusBar.show();
    context.subscriptions.push(explainCommand, cheatSheetCommand, terminalWatcher, statusBar);
}
function handleTerminalData(data, context) {
    terminalBuffer += data;
    if (data.includes('\r') || data.includes('\n')) {
        const lines = terminalBuffer.split(/[\r\n]+/);
        for (let i = 0; i < lines.length - 1; i++) {
            processTerminalLine(lines[i].trim(), context);
        }
        terminalBuffer = lines[lines.length - 1];
    }
    if (terminalBuffer.length > 2000) {
        terminalBuffer = terminalBuffer.slice(-500);
    }
}
function processTerminalLine(line, context) {
    // Strip ANSI escape codes
    const clean = line.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '').trim();
    if (!clean.match(/^git\s+\w+/))
        return;
    if (clean === lastExplainedInput)
        return;
    lastExplainedInput = clean;
    const info = (0, gitCommands_1.matchCommand)(clean);
    if (!info)
        return;
    const config = vscode.workspace.getConfiguration('gitsafe');
    const minLevel = config.get('riskLevel', 'medium-and-above');
    if (!shouldShowForLevel(info.riskLevel, minLevel))
        return;
    showExplanation(clean, context);
    const confirmDestructive = config.get('confirmDestructive', true);
    if (confirmDestructive && (info.riskLevel === 'high' || info.riskLevel === 'critical')) {
        vscode.window.showWarningMessage(`⚠️ GitSafe: "${info.command}" is ${info.riskLevel}-risk. ${info.riskReason ?? ''}`, 'See Details', 'Dismiss').then(choice => {
            if (choice === 'See Details')
                showExplanation(clean, context);
        });
    }
}
function shouldShowForLevel(level, setting) {
    const order = ['safe', 'low', 'medium', 'high', 'critical'];
    const thresholds = {
        'all': 'safe',
        'medium-and-above': 'medium',
        'high-only': 'high',
    };
    const threshold = thresholds[setting] ?? 'medium';
    return order.indexOf(level) >= order.indexOf(threshold);
}
function showExplanation(query, context) {
    const info = (0, gitCommands_1.matchCommand)(query);
    if (!info) {
        vscode.window.showInformationMessage(`GitSafe: No info found for "${query}". Try the cheat sheet for a full list.`, 'Open Cheat Sheet').then(choice => {
            if (choice === 'Open Cheat Sheet')
                showCheatSheet(context);
        });
        return;
    }
    if (explanationPanel) {
        explanationPanel.title = `GitSafe: ${info.command}`;
        explanationPanel.webview.html = (0, commandPanel_1.getWebviewContent)(info, query);
        explanationPanel.reveal(vscode.ViewColumn.Beside, true);
    }
    else {
        explanationPanel = vscode.window.createWebviewPanel('gitsafeExplain', `GitSafe: ${info.command}`, { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true }, { enableScripts: false });
        explanationPanel.webview.html = (0, commandPanel_1.getWebviewContent)(info, query);
        explanationPanel.onDidDispose(() => {
            explanationPanel = undefined;
        }, null, context.subscriptions);
    }
}
function showCheatSheet(context) {
    if (cheatSheetPanel) {
        cheatSheetPanel.reveal(vscode.ViewColumn.One);
        return;
    }
    cheatSheetPanel = vscode.window.createWebviewPanel('gitsafeCheatSheet', 'GitSafe — Cheat Sheet', vscode.ViewColumn.One, { enableScripts: false });
    cheatSheetPanel.webview.html = (0, commandPanel_1.buildCheatSheetContent)(gitCommands_1.GIT_COMMANDS);
    cheatSheetPanel.onDidDispose(() => {
        cheatSheetPanel = undefined;
    }, null, context.subscriptions);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map