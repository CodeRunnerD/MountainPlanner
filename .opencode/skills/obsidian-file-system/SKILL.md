# obsidian-file-system

## Purpose

This skill defines the canonical file system layout for the multi-project agent system. Load this skill whenever you need to resolve paths, find files, or understand where to read/write files.

---

## Vault Root

The Obsidian vault root is fixed:

```
VAULT_ROOT = D:\Repositories\obsidian-brain\obsidian-brain
```

Every file created by this skill MUST be placed under `VAULT_ROOT`.

---

## Variables

| Variable | Set in | Default | Purpose |
|----------|--------|---------|---------|
| `VAULT_ROOT` | Fixed | `D:\Repositories\obsidian-brain\obsidian-brain` | Obsidian vault root |

---

## Vault Structure

```
D:\Repositories\obsidian-brain\obsidian-brain/
├── MountainPlanner/
│   └── {branch-name}/
│       ├── exploration/        # Research, code reading, how-things-work
│       ├── plan/               # Implementation plans
│       ├── issue/              # Bug analysis, incidents, production problems
│       ├── implementation/     # Progress notes, decisions during development
│       └── review/             # PR reviews, retrospectives, post-mortems
│
├── {other-project}/
│   └── {branch-name}/
│       ├── exploration/
│       ├── plan/
│       ├── issue/
│       ├── implementation/
│       └── review/
│
└── AGENT-SYSTEM/               # Agent system documentation
```

**Rule**: Projects live directly under vault root (no intermediate `Documentation/` or `Repositories/` folder).

---

## Branch Naming

Branches follow gitflow conventions. The branch name becomes the folder name under `{project-name}/`:

| Branch type | Pattern | Example folder |
|-------------|---------|----------------|
| Feature | `feature/CAR-001` | `feature-CAR-001` |
| Release | `release/1.2.3` | `release-1.2.3` |
| Hotfix | `hotfix/fix-timeout` | `hotfix-fix-timeout` |
| Main | `main` | `main` |
| Develop | `develop` | `develop` |

**Branch → folder name rule:** replace `/` with `-`.

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
BRANCH_FOLDER="${BRANCH//\//-}"
```

---

## Doc Type Guide

| Folder | Use when | File types |
|--------|----------|------------|
| `exploration/` | First contact with a codebase, understanding an existing flow, researching options | `.md` + `.canvas` |
| `plan/` | Designing a solution, writing an implementation plan after exploration | `.md` + `.canvas` |
| `issue/` | Investigating a bug, analyzing a production incident, root-cause analysis | `.md` |
| `implementation/` | Taking notes while coding, recording decisions made during a PR | `.md` |
| `review/` | Reviewing a PR, writing a retrospective, post-mortem | `.md` |

**Natural flow:** `exploration` → `plan` → `implementation` (parallel: `issue` for bugs, `review` for PRs)

---

## Path Construction

**Full path for any documentation file:**
```
{VAULT_ROOT}/{project}/{branch-folder}/{type}/{name}-{date}.md
```

Example:
```
D:\Repositories\obsidian-brain\obsidian-brain\MountainPlanner\main\plan\database-schema-2026-04-30.md
```

**Derive project and branch from git (when inside a repo):**
```bash
PROJECT=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "general")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
BRANCH_FOLDER="${BRANCH//\//-}"
DATE=$(date +%Y-%m-%d)
```

---

## Where to Search

Given a task, use this table to know where to look first:

| Task | Where to look |
|------|--------------|
| Read source code for a project | The actual git repo directory |
| Find exploration notes for a project | `{VAULT_ROOT}/{project}/*/exploration/` |
| Find notes for a specific branch | `{VAULT_ROOT}/{project}/{branch-folder}/` |
| Find all docs for a project | `{VAULT_ROOT}/{project}/` |
| Find the latest plan | `{VAULT_ROOT}/{project}/{branch-folder}/plan/` — sort by date descending |
| Find a PR review | `{VAULT_ROOT}/{project}/{branch-folder}/review/` |
| Find an incident note | `{VAULT_ROOT}/{project}/*/issue/` |
| List all projects documented | `ls {VAULT_ROOT}/` |
| List all branches for a project | `ls {VAULT_ROOT}/{project}/` |

---

## File Naming Convention

```
{descriptive-name}-{YYYY-MM-DD}.md
{descriptive-name}-{YYYY-MM-DD}.canvas
```

- Use kebab-case: `payment-flow-analysis-2026-04-15.md`
- Date is always appended so files sort chronologically
- Canvas and note with same base name are a **linked pair** (see obsidian-canvas skill)

---

## Rules

1. **VAULT_ROOT is fixed**: `D:\Repositories\obsidian-brain\obsidian-brain`. Never write files outside this path.
2. Projects live directly under vault root — no intermediate `Documentation/` or `Repositories/` folder.
3. Branch folder name = branch name with `/` replaced by `-`.
4. Always use the project name derived from the git repo root, not a manually typed name.
5. When the current directory is not inside a git repo, use `PROJECT=general` and `BRANCH=main`.
6. Canvas and markdown files with the same base name in the same folder are a linked pair — always maintain both.
7. `AGENT-SYSTEM/` is reserved for agent system files — do not create project documentation there.
8. When searching, always scope to the most specific path possible (`{project}/{branch}/`) before falling back to broader searches.
