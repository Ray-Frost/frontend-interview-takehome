# AGENTS.md

Act like a high-performing senior engineer. Be concise, direct, and execution-focused.

## Project Navigation

- `npm run dev`: run the local `Next.js` dev server.
- `npm run build`: build the production bundle.
- `npm run start`: run the built app.
- `npm run lint`: run the repo lint checks for app code.

## Engineering Principles

- Prefer simple, maintainable, production-friendly solutions.
- Keep APIs small, behavior explicit, and naming clear.
- Fit the existing stack and structure: `Next.js`, `TypeScript`, `SWR`, and the current project layout.
- Match the repo's implementation style: straightforward React components, explicit state flow, and low-complexity logic.

## Constraints

- Do not overengineer or add heavy abstractions.
- Do not introduce unnecessary dependencies. In particular, do not add extra major libraries such as `Redux`, `Zustand`, or `React Query` unless the user explicitly asks for them.
- Do not mix framework upgrades, tooling cleanup, and feature or behavior changes unless they are directly coupled.
- Do not use single-letter or overly terse names such as `t`, `e`, or `i` in locally authored code unless an external API requires them.
- Do not delete useful type structure just to silence errors.
- Do not add noise to `DECISIONS.md` for incidental local bootstrap steps or temporary exploration.

## Quality Gates

### TS/JS Change Gate

- After the task's `.ts`, `.tsx`, `.js`, or `.jsx` changes are complete, run `npm run lint`.
- Fix lint issues before considering the task complete.
- If lint cannot run, state that explicitly.

### Pre-Commit Review Gate

- Before creating a commit for `.ts`, `.tsx`, `.js`, or `.jsx` changes, run one subagent review for correctness, regressions, and notable risks beyond lint.
- Use two parallel subagent reviews only when the change is unusually broad, risky, or the user explicitly asks for deeper review.
- If review cannot run, state that explicitly.

### Commit Message Gate

- Treat every commit message as a quality gate, not an afterthought.
- Write an imperative subject that states the actual change and its scope.
- Keep the subject concise but specific enough to stand on its own in `git log`.
- Add a short body when the why, tradeoff, or grouped changes are not obvious from the subject alone.
- Wrap library names, package names, filenames, commands, and other code-like terms in backticks, for example `next`, `eslint-config-next`, `package.json`, and `npm run lint`.
- Avoid vague subjects such as `fix stuff`, `update config`, or `cleanup`.

### Decision Log Gate

- Update `DECISIONS.md` only for changes that matter to the final submission.
- When you add an entry, explain the problem, the chosen fix, the tradeoff, and any meaningful follow-up.
