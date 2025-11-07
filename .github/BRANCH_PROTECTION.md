# Branch Protection Setup

This document explains how to configure branch protection rules to ensure tests pass before merging.

## Required Setup Steps

### 1. Enable Branch Protection Rules

Go to your GitHub repository settings:

1. Navigate to **Settings** → **Branches**
2. Click **Add rule** for the `main` branch
3. Configure the following settings:

#### Required Settings:

- ✅ **Require a pull request before merging**

  - ✅ Require approvals: 1
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners (if you have CODEOWNERS file)

- ✅ **Require status checks to pass before merging**

  - ✅ Require branches to be up to date before merging
  - ✅ Status checks that are required:
    - `All Checks Complete` (from our CI workflow)
    - `Run Tests (18.x)`
    - `Run Tests (20.x)`
    - `Lint & Type Check`

- ✅ **Require conversation resolution before merging**
- ✅ **Require signed commits** (recommended)
- ✅ **Include administrators** (applies rules to repo admins too)

#### Optional but Recommended:

- ✅ **Restrict pushes that create files matching a path** → `dist/**` (prevent committing build artifacts)
- ✅ **Require linear history** (prevents merge commits, forces rebase/squash)

### 2. Alternative: Settings via GitHub CLI

If you prefer to set this up programmatically:

```bash
# Install GitHub CLI if not already installed
# brew install gh

# Authenticate
gh auth login

# Create branch protection rule
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["All Checks Complete","Run Tests (18.x)","Run Tests (20.x)","Lint & Type Check"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null
```

## CI Workflow Features

Our `.github/workflows/ci.yml` provides:

### ✅ **Multi-Node Testing**

- Tests on Node.js 18.x and 20.x
- Ensures compatibility across versions

### ✅ **Comprehensive Checks**

- **Tests**: Jest test suite with coverage
- **Build**: Ensures production build works
- **Type Check**: TypeScript compilation without emit
- **Linting**: ESLint checks (if configured)

### ✅ **Fail-Fast Protection**

- `all-checks` job requires ALL other jobs to succeed
- Any failing test/lint/build will block the PR

### ✅ **Artifact Collection**

- Test results and coverage uploaded
- Available for 7 days for debugging

## How It Works

1. **Developer creates PR** → CI workflow triggers
2. **All tests must pass** → Node 18.x & 20.x
3. **Build must succeed** → Ensures no build errors
4. **Type checks must pass** → No TypeScript errors
5. **Lint checks must pass** → Code style compliance
6. **"All Checks Complete" job** → Final gate that requires all above

## Benefits

✅ **Prevents broken code** from reaching main branch
✅ **Enforces testing standards** across all contributions  
✅ **Multi-environment testing** (Node 18 & 20)
✅ **Build validation** ensures deployable code
✅ **Type safety** enforcement via TypeScript
✅ **Consistent code style** via linting

## Troubleshooting

### Tests failing on CI but passing locally?

- Check Node.js version differences
- Verify environment variables/mocks
- Check file path case sensitivity (CI is Linux)

### Branch protection not working?

- Ensure status check names match exactly
- Verify workflow runs completed at least once
- Check that you're targeting the right branch (`main`)

### Need to bypass protection temporarily?

- Only repository administrators can bypass
- Use "Merge without waiting for requirements" (if enabled)
- **Not recommended** for production repositories
