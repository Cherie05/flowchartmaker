# Contributing to Wizzleflow

First off, thank you for considering contributing to Wizzleflow! 

## Development Setup

1. Fork the repo and create your branch from `main`.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the local development server.

## Code Style & Linting

Wizzleflow uses strict ESLint and TypeScript rules to maintain production quality.

- Run `npm run lint` before committing to ensure there are no formatting or syntax errors.
- Ensure all components are strongly typed. Avoid using `any`.
- If you've modified the UI, verify it looks correct in both light and dark backgrounds (especially the `Logo` component).

## Submitting Changes

1. Push to your fork and submit a pull request.
2. Fill out the included Pull Request Template.
3. Ensure the automated GitHub Actions CI pipeline passes (Build, Lint, Typecheck).

Thank you for helping improve Wizzleflow!
