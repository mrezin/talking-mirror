# Contributing to TalkingMirror

Thank you for contributing! Please read this guide before opening issues or submitting PRs.

---

## Code of Conduct

Be respectful, constructive, and professional. Focus on ideas, not individuals.

---

## Getting Started

1. Fork the repo
2. Branch from `main`: `git checkout -b feat/my-feature`
3. Install dependencies: `yarn install`
4. Copy env files:
   ```bash
   cp .env.example .env
   cp services/firebase/.env.example services/firebase/.env
   cp services/revenuecat/.env.example services/revenuecat/.env
   ```
5. Make your changes
6. Typecheck: `yarn workspaces run typecheck`
7. Commit using Conventional Commits
8. Push and open a Pull Request

---

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description
```

| Prefix | Purpose |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Tooling, deps, config |
| `docs` | Documentation |
| `refactor` | Code restructuring |
| `test` | Adding/fixing tests |
| `perf` | Performance improvements |

**Scope examples:** `ios`, `android`, `firebase`, `revenuecat`, `shared`, `mirror`, `subscription`

**Examples:**
```
feat(mirror): add audio playback toggle button
fix(firebase): handle missing compliment document gracefully
chore(shared): upgrade Expo SDK to 52
docs(api): add getDailyCompliment endpoint example
```

---

## Branch Naming

| Pattern | Example |
|---|---|
| `feat/description` | `feat/mirror-beauty-filter` |
| `fix/description` | `fix/subscription-trial-expiry` |
| `chore/description` | `chore/upgrade-expo-sdk` |
| `docs/description` | `docs/api-spec-update` |

---

## Workspace Commands

```bash
# Run iOS app
yarn workspace @talking-mirror/ios start

# Run Android app
yarn workspace @talking-mirror/android start

# Typecheck one workspace
yarn workspace @talking-mirror/firebase typecheck

# Typecheck all workspaces
yarn workspaces run typecheck

# Firebase emulators
yarn firebase:emulate

# Firebase deploy
yarn firebase:deploy
```

---

## Pull Request Process

1. Fill out the PR template completely
2. Keep PRs small and focused (one feature per PR)
3. Ensure CI passes (typecheck, prebuild, EAS dry-run)
4. Request review from at least one maintainer
5. Address all review feedback before merge

---

## Code Style

- **TypeScript strict mode** required
- **Naming:** PascalCase for components/types, camelCase for functions/variables
- **Platform-specific code:** use `.android.tsx` / `.ios.tsx` extensions
- **Imports:** built-in -> external -> internal (sorted)
- **No console.log** in production code (use Firebase Functions logger)

---

## Review Guidelines

### For Authors
- Self-review before requesting review
- Keep diff clean, no unrelated formatting changes
- Respond to feedback within 2 business days

### For Reviewers
- Be constructive, not critical
- Approve when the code is correct
- Flag blocking issues early

---

## Out of Scope (Do Not Submit)

- Social/community features (not in MVP)
- Real-time AI generation (uses curated library)
- Web app features
- Changes to production Firebase security rules without team review
