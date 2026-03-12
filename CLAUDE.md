## Environment
- `gh` CLI is installed at `/c/Program Files/GitHub CLI/gh.exe` — use this full path since it's not on the bash PATH.

## Repo Hygiene

### On session start
- Run `git status`, `git stash list`, and `git branch -a` to check for uncommitted changes, lingering stashes, stale branches, or divergence from remote.
- Flag any issues to the user before starting work.

### After push or PR
- Run `git status`, `git stash list`, `git branch -a`, and `git fetch --prune` to verify clean state.
- Flag any stale branches, uncommitted changes, or divergence.
- Ask the user what they'd like to work on next.

## Button Component

All buttons MUST use the shared button classes from `styles.css`. Never use custom one-off padding, font-size, or border-radius on buttons.

### Types
| Class | Usage |
|---|---|
| `.btn-primary` | Main actions (Search, Apply, Submit) — filled primary color |
| `.btn-secondary` | Secondary actions — outlined with primary color border |
| `.btn-tertiary` | Low-emphasis actions (Clear, Cancel) — text-only, no border |

### Sizes
| Class | Padding | Font size | Border radius | Usage |
|---|---|---|---|---|
| _(default = M)_ | `12px 16px` | `16px` | `16px` | Standalone buttons (search, main CTAs) |
| `.btn-s` | `8px 12px` | `14px` | `12px` | Buttons inside dropdowns, footers, compact areas |

### Rules
- Every button element must have exactly one type class (`btn-primary`, `btn-secondary`, or `btn-tertiary`).
- Add `.btn-s` for small contexts (dropdown footers, inline actions). Omit it for M (default).
- All types share `font-weight: 700`, flexbox centering, and `gap: 8px`.
- Never override button padding, font-size, or border-radius with custom CSS — use the size class instead.
