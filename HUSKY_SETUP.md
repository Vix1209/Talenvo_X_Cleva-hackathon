# Husky Setup for Talenvo

## Overview

This project uses Husky to enforce code quality checks before commits. Husky runs pre-commit hooks to ensure that all code is properly formatted and linted before being committed to the repository.

## Pre-commit Hooks

The following checks are run automatically before each commit:

1. **Code Formatting** (`npm run format`): Uses Prettier to ensure consistent code style across the project.
2. **Code Linting** (`npm run lint`): Uses ESLint to check for code quality issues and enforce coding standards.

## How It Works

When you attempt to make a commit:

1. Husky intercepts the commit process
2. It runs the format command to fix any formatting issues
3. It runs the lint command to fix any linting issues
4. If both commands succeed, the commit proceeds
5. If any command fails, the commit is aborted, allowing you to fix the issues

## Benefits

- Ensures consistent code style across the project
- Prevents code with linting errors from being committed
- Reduces the need for style-related code review comments
- Avoids redundant imports and other common issues
- Improves overall code quality

## Manual Override

If you need to bypass the pre-commit hooks in exceptional circumstances, you can use:

```bash
git commit --no-verify -m "Your commit message"
```

However, this should be used sparingly and only when absolutely necessary.
