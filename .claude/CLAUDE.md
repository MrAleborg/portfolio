# graphify
- **graphify** (`.claude/skills/graphify/SKILL.md`, not tracked: install it with `graphify install --platform claude`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

# Spec and plan (main session)
Every feature goes through two approval gates in the main session before any code.

1. **Spec** (`agent-protocols:spec-driven-development`, DDD). Keep it short and limited to this feature; don't repeat what the agent files already say:
   - Assumptions, listed first, for the user to correct.
   - Objective: what and why.
   - Domain model: entities, value objects, boundaries, and where each piece of logic lives (domain, port, adapter, UI).
   - API contract, when the backend and frontend meet (`agent-protocols:api-and-interface-design`).
   - Visual design, for UI changes in `frontend/` (`frontend-design:frontend-design`): layout, typography and color are settled here. The implementer makes no visual decisions.
   - Success criteria: specific and testable. They become the test set.
   - Open questions.
2. **Plan** (`agent-protocols:planning-and-task-breakdown`). Vertical slices in dependency order, backend first. Each task lists its acceptance criteria, how to verify it, and the files it touches (5 at most, otherwise split it).

The spec and plan live in the conversation, not in repo files.

# Implementing plans
After both approvals, delegate each task to `frontend-implementer` for `frontend/` or `backend-implementer` for `backend/` (both Sonnet 5.5, high effort, defined in `.claude/agents/`); don't implement in the main session. Pass the task with its acceptance criteria and the relevant part of the spec. Resume the same agent with SendMessage after each user approval.

# Reviewing
After a green step or before a commit/PR, delegate a read-only review to `reviewer` (bugs, security, over-engineering, test quality, and frontend design for UI changes). The main session decides which findings to act on and sends fixes back to the implementer.

# Dev deploy
A PR (not a draft) deploys its branch to the dev box when it is opened and on each push to it (the `Dev deploy` workflow, `.github/workflows/dev-deploy.yml`), which also checks `http://$DEV_HOST:8080` and `/api/v1/experience/` answer. After creating a PR, and after each push of new commits to a PR, wait for that run and report its result (the box is slow: allow up to 40 minutes). Pushes to a branch without a PR don't deploy. `deploy/dev-deploy.sh` (address in the uncommitted `deploy/.env.dev`) still deploys by hand, e.g. uncommitted changes.

# Commits and PRs
- Author each commit as the user, not as Claude: `git commit --author="<name> <email>"`, with the name and email the user's own commits on main use (e.g. `git log -1 --format='%an <%ae>' origin/main`). Leave the committer as configured, so the commit signature still verifies.
- No attribution in commit messages (no `Co-Authored-By`, no `Claude-Session` line) nor in PR descriptions (no "Generated with Claude Code" footer or session link).
