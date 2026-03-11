"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMAND_MAP = exports.RISK_LABELS = exports.GIT_COMMANDS = void 0;
exports.matchCommand = matchCommand;
exports.GIT_COMMANDS = [
    {
        command: 'git commit',
        summary: 'Save a snapshot of your staged changes',
        description: 'Records your staged changes into the repository history as a new commit. Nothing is deleted. Your files stay exactly as they are.',
        riskLevel: 'safe',
        whatHappens: [
            'Creates a new commit with your staged changes',
            'Moves HEAD (your current position) to the new commit',
            'Does NOT affect unstaged files',
            'Does NOT touch your working directory files',
        ],
        canUndo: true,
        undoHow: 'Run `git reset HEAD~1` to undo the last commit (keeps your file changes)',
        examples: [
            { cmd: 'git commit -m "Fix login bug"', explanation: 'Commit with a message inline' },
            { cmd: 'git commit', explanation: 'Opens your editor to write a commit message' },
            { cmd: 'git commit --amend', explanation: 'Edit the last commit message or add forgotten files' },
        ],
        flags: [
            { flag: '-m "message"', meaning: 'Provide commit message inline' },
            { flag: '--amend', meaning: 'Modify the most recent commit', risky: true },
            { flag: '--no-verify', meaning: 'Skip pre-commit hooks', risky: true },
        ],
        tip: 'Write commit messages in present tense: "Fix bug" not "Fixed bug"',
    },
    {
        command: 'git pull',
        summary: 'Download and merge changes from the remote repository',
        description: 'Fetches changes from the remote (e.g. GitHub) and merges them into your current branch. This is how you get your teammates latest work.',
        riskLevel: 'low',
        riskReason: 'Can cause merge conflicts if you and a teammate edited the same file',
        whatHappens: [
            'Downloads new commits from the remote',
            'Merges those commits into your current branch',
            'May create a merge commit if there are conflicts',
            'Your local uncommitted changes are NOT touched',
        ],
        canUndo: true,
        undoHow: 'Run `git reset --hard ORIG_HEAD` immediately after a bad pull',
        examples: [
            { cmd: 'git pull', explanation: 'Pull from the default remote into current branch' },
            { cmd: 'git pull origin main', explanation: 'Pull specifically from the main branch on origin' },
            { cmd: 'git pull --rebase', explanation: 'Rebase your commits on top of remote changes (cleaner history)' },
        ],
        flags: [
            { flag: '--rebase', meaning: 'Rebase instead of merge (cleaner history)' },
            { flag: '--force', meaning: 'Force update — can overwrite local changes', risky: true },
        ],
        tip: 'Always pull before you start working to avoid conflicts later',
    },
    {
        command: 'git push',
        summary: 'Upload your local commits to the remote repository',
        description: 'Sends your local commits up to the remote (e.g. GitHub). This makes your work available to teammates.',
        riskLevel: 'low',
        riskReason: 'Force push can overwrite teammates work on the remote',
        whatHappens: [
            'Uploads your commits to the remote branch',
            'Fails safely if the remote has commits you do not have yet',
            'Does NOT change your local files',
        ],
        canUndo: true,
        undoHow: 'Revert or amend commits and force-push, but coordinate with your team first',
        examples: [
            { cmd: 'git push', explanation: 'Push current branch to its tracked remote branch' },
            { cmd: 'git push origin main', explanation: 'Push to the main branch on origin' },
            { cmd: 'git push -u origin feature-branch', explanation: 'Push and set upstream tracking for this branch' },
        ],
        flags: [
            { flag: '-u / --set-upstream', meaning: 'Set the remote branch to track (use first time pushing a new branch)' },
            { flag: '--force / -f', meaning: 'Overwrites remote history — can delete teammates work!', risky: true },
            { flag: '--force-with-lease', meaning: 'Safer force push — fails if remote has commits you have not seen' },
            { flag: '--tags', meaning: 'Also push local tags to remote' },
        ],
        tip: 'Never use --force on shared branches like main. Use --force-with-lease if you must.',
    },
    {
        command: 'git checkout',
        summary: 'Switch to a different branch (or restore files)',
        description: 'Switches your working directory to another branch. If you pass a filename, it restores that file to its last committed state — permanently discarding your changes to it.',
        riskLevel: 'medium',
        riskReason: 'Using it on a file path permanently discards your uncommitted changes to that file',
        whatHappens: [
            'Switches HEAD to the target branch or commit',
            'Updates your working directory files to match the target',
            'Uncommitted changes may carry over OR cause an error (git will warn you)',
            'git checkout -- <file> PERMANENTLY discards changes to that file with no recovery',
        ],
        canUndo: true,
        undoHow: 'Switch back with `git checkout <previous-branch>`. File changes discarded with -- <file> cannot be recovered.',
        examples: [
            { cmd: 'git checkout main', explanation: 'Switch to the main branch' },
            { cmd: 'git checkout -b new-feature', explanation: 'Create AND switch to a new branch' },
            { cmd: 'git checkout -- index.html', explanation: 'Discard all changes to index.html — permanent!' },
        ],
        flags: [
            { flag: '-b <branch>', meaning: 'Create a new branch and switch to it' },
            { flag: '-- <file>', meaning: 'Restore file to last commit, discarding changes permanently', risky: true },
        ],
        tip: 'Modern git recommends `git switch` for branches and `git restore` for files — clearer and less confusing.',
    },
    {
        command: 'git branch',
        summary: 'List, create, or delete branches',
        description: 'Manages your branches. Without flags it lists branches. With -d it deletes. With a name it creates one.',
        riskLevel: 'low',
        riskReason: 'Deleting a branch with unmerged commits can make those commits hard to find',
        whatHappens: [
            'git branch — lists all local branches',
            'git branch <name> — creates a new branch but does NOT switch to it',
            'git branch -d <name> — deletes branch safely (refuses if unmerged)',
            'git branch -D <name> — force deletes even if unmerged',
        ],
        canUndo: true,
        undoHow: 'Recover a deleted branch with `git checkout -b <name> <commit-hash>`. Find the hash with `git reflog`.',
        examples: [
            { cmd: 'git branch', explanation: 'List all local branches' },
            { cmd: 'git branch -a', explanation: 'List local AND remote branches' },
            { cmd: 'git branch -d feature-login', explanation: 'Delete feature-login (safe — refuses if unmerged)' },
            { cmd: 'git branch -D feature-login', explanation: 'Force delete feature-login even if not merged' },
        ],
        flags: [
            { flag: '-d <name>', meaning: 'Delete branch (safe — only if fully merged)' },
            { flag: '-D <name>', meaning: 'Force delete branch even if unmerged', risky: true },
            { flag: '-m <new-name>', meaning: 'Rename current branch' },
            { flag: '-a', meaning: 'List all branches including remote-tracking' },
        ],
    },
    {
        command: 'git merge',
        summary: 'Combine another branch\'s changes into your current branch',
        description: 'Takes the commits from another branch and integrates them into your current branch.',
        riskLevel: 'medium',
        riskReason: 'Can create merge conflicts that require manual resolution',
        whatHappens: [
            'Finds the common ancestor of both branches',
            'Combines the changes from both sides',
            'Creates a merge commit unless fast-forward is possible',
            'Conflicts are marked in files for you to resolve manually',
        ],
        canUndo: true,
        undoHow: '`git merge --abort` during a conflict. Or `git reset --hard ORIG_HEAD` after a completed merge.',
        examples: [
            { cmd: 'git merge feature-login', explanation: 'Merge feature-login into your current branch' },
            { cmd: 'git merge --abort', explanation: 'Cancel an in-progress merge with conflicts' },
            { cmd: 'git merge --squash feature-login', explanation: 'Squash all feature commits into one before merging' },
        ],
        flags: [
            { flag: '--no-ff', meaning: 'Always create a merge commit' },
            { flag: '--squash', meaning: 'Combine all commits from branch into one' },
            { flag: '--abort', meaning: 'Abort an in-progress conflicted merge' },
        ],
    },
    {
        command: 'git reset',
        summary: 'Move HEAD back to a previous commit',
        description: 'Moves the current branch pointer back to an earlier commit. What happens to your files depends on the mode used.',
        riskLevel: 'high',
        riskReason: '--hard permanently discards your uncommitted changes and resets your files',
        whatHappens: [
            '--soft: Moves HEAD back, keeps files AND staged changes intact',
            '--mixed (default): Moves HEAD back, keeps files but unstages changes',
            '--hard: Moves HEAD back AND resets files — your changes are GONE',
            'Commits you reset past become orphaned but are findable via reflog for ~30 days',
        ],
        canUndo: true,
        undoHow: 'Run `git reflog` to find the old commit hash, then `git reset --hard <hash>` to go back',
        examples: [
            { cmd: 'git reset HEAD~1', explanation: 'Undo last commit, keep file changes unstaged' },
            { cmd: 'git reset --soft HEAD~1', explanation: 'Undo last commit, keep file changes staged' },
            { cmd: 'git reset --hard HEAD~1', explanation: 'Undo last commit AND discard all file changes permanently' },
        ],
        flags: [
            { flag: '--soft', meaning: 'Undo commit only; keep staged changes' },
            { flag: '--mixed', meaning: 'Undo commit and unstage; keep file changes (default)' },
            { flag: '--hard', meaning: 'Undo commit AND discard file changes permanently', risky: true },
        ],
        tip: 'When in doubt use --soft or --mixed. Only use --hard when you are 100% sure you want to discard everything.',
    },
    {
        command: 'git clean',
        summary: 'Delete untracked files from your working directory',
        description: 'Removes files that are NOT tracked by git — files you created but never added. This is permanent, these files are not sent to trash.',
        riskLevel: 'critical',
        riskReason: 'Permanently deletes files that were never committed. They CANNOT be recovered from git.',
        whatHappens: [
            'Deletes files not tracked by git',
            'Does NOT delete files in .gitignore unless you add -x',
            'Does NOT delete committed files',
            'Files are permanently deleted — not sent to trash or recycle bin',
        ],
        canUndo: false,
        examples: [
            { cmd: 'git clean -n', explanation: 'DRY RUN — shows what would be deleted without deleting anything' },
            { cmd: 'git clean -fd', explanation: 'Delete untracked files AND untracked directories' },
            { cmd: 'git clean -fdx', explanation: 'Delete untracked files, directories AND files in .gitignore' },
        ],
        flags: [
            { flag: '-n / --dry-run', meaning: 'Preview what would be deleted without doing it' },
            { flag: '-f / --force', meaning: 'Required to actually delete anything (safety mechanism)' },
            { flag: '-d', meaning: 'Also remove untracked directories' },
            { flag: '-x', meaning: 'Also remove files ignored by .gitignore like node_modules or .env', risky: true },
            { flag: '-i', meaning: 'Interactive mode — choose exactly what to delete' },
        ],
        tip: 'ALWAYS run `git clean -n` first to preview what will be deleted before running the real command!',
    },
    {
        command: 'git push --force',
        summary: 'Overwrite the remote branch history with your local history',
        description: 'Forces the remote to accept your local branch even if it would overwrite commits already on the remote. Can permanently erase teammates work.',
        riskLevel: 'critical',
        riskReason: 'Overwrites remote history — can permanently delete commits your teammates pushed',
        whatHappens: [
            'Replaces the remote branch entirely with your local branch',
            'Any commits on the remote that you do not have locally are GONE',
            'Teammates who already pulled those commits will have conflicts',
            'If used on main, affects everyone on the team immediately',
        ],
        canUndo: true,
        undoHow: 'If teammates still have the old commits locally they can force-push back. Act quickly before others pull.',
        examples: [
            { cmd: 'git push --force', explanation: 'Force push to remote — overwrites remote history' },
            { cmd: 'git push --force-with-lease', explanation: 'Safer: fails if remote has commits you have not seen yet' },
        ],
        flags: [
            { flag: '--force / -f', meaning: 'Overwrite remote unconditionally', risky: true },
            { flag: '--force-with-lease', meaning: 'Safer force push — verifies you have the latest remote state' },
        ],
        tip: 'Use --force-with-lease instead of --force. It prevents accidentally overwriting commits you have not seen.',
    },
    {
        command: 'git stash',
        summary: 'Temporarily save uncommitted changes to a stack',
        description: 'Saves your current uncommitted changes to a stash and gives you a clean working directory. You can restore them later.',
        riskLevel: 'safe',
        whatHappens: [
            'Saves staged and unstaged changes to a stash stack',
            'Restores your working directory to match HEAD',
            'Your changes are NOT deleted — they are stored safely in the stash',
            'You can have multiple stashes at once',
        ],
        canUndo: true,
        undoHow: '`git stash pop` to restore your changes. `git stash list` to see all stashes.',
        examples: [
            { cmd: 'git stash', explanation: 'Save current changes and clean working directory' },
            { cmd: 'git stash pop', explanation: 'Restore most recent stash' },
            { cmd: 'git stash list', explanation: 'See all stashes' },
            { cmd: 'git stash drop', explanation: 'Permanently delete the most recent stash' },
        ],
        flags: [
            { flag: 'push -m "message"', meaning: 'Stash with a descriptive name' },
            { flag: 'pop', meaning: 'Restore latest stash' },
            { flag: 'list', meaning: 'View all stashes' },
            { flag: 'drop', meaning: 'Delete a stash permanently', risky: true },
            { flag: 'clear', meaning: 'Delete ALL stashes permanently', risky: true },
        ],
    },
    {
        command: 'git rebase',
        summary: 'Rewrite commit history by moving commits to a new base',
        description: 'Moves your commits to start from a different base commit. Creates cleaner history than merging but rewrites commit hashes.',
        riskLevel: 'high',
        riskReason: 'Rewrites commit history — force push is required after rebasing shared branches which disrupts teammates',
        whatHappens: [
            'Takes your commits and replays them on top of another branch',
            'Creates NEW commit hashes — original commits are replaced',
            'Rebasing a shared branch requires force-pushing which can disrupt teammates',
            'Conflicts must be resolved one commit at a time',
        ],
        canUndo: true,
        undoHow: '`git rebase --abort` during rebase. Or use `git reflog` to find the pre-rebase state and reset to it.',
        examples: [
            { cmd: 'git rebase main', explanation: 'Move your current branch commits on top of main' },
            { cmd: 'git rebase -i HEAD~3', explanation: 'Interactively edit, squash, or reorder last 3 commits' },
            { cmd: 'git rebase --abort', explanation: 'Cancel an in-progress rebase' },
        ],
        flags: [
            { flag: '-i / --interactive', meaning: 'Interactively choose how to handle each commit' },
            { flag: '--abort', meaning: 'Cancel the rebase and return to original state' },
            { flag: '--continue', meaning: 'Continue after resolving a conflict' },
        ],
        tip: 'Golden rule: Never rebase commits that have already been pushed to a shared branch.',
    },
];
exports.RISK_LABELS = {
    safe: '✅ Safe',
    low: '🟡 Low Risk',
    medium: '🟠 Medium Risk',
    high: '🔴 High Risk',
    critical: '🚨 Critical — Destructive',
};
exports.COMMAND_MAP = new Map();
for (const cmd of exports.GIT_COMMANDS) {
    exports.COMMAND_MAP.set(cmd.command, cmd);
    const parts = cmd.command.split(' ');
    if (parts.length >= 2) {
        exports.COMMAND_MAP.set('git ' + parts[1], cmd);
    }
}
function matchCommand(input) {
    const trimmed = input.trim().toLowerCase();
    if (/git\s+push\s+(--force|-f)\b/.test(trimmed)) {
        return exports.COMMAND_MAP.get('git push --force');
    }
    for (const [key] of exports.COMMAND_MAP) {
        if (trimmed === key || trimmed.startsWith(key + ' ') || trimmed.startsWith(key)) {
            return exports.COMMAND_MAP.get(key);
        }
    }
    const match = trimmed.match(/^git\s+(\w+)/);
    if (match) {
        return exports.COMMAND_MAP.get('git ' + match[1]);
    }
    return undefined;
}
//# sourceMappingURL=gitCommands.js.map