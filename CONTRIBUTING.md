# Contributing

Thank you for your interest in contributing to DungeonMix! This document focuses on code contributions. For non-code contributions, such as feature proposals or bug reports that aren't tied to a specific part of the codebase, feel free to create a free-form discussion in [GitHub Discussions](https://github.com/Mezriss/dungeonmix/discussions).

## Working with the Codebase

### Package Manager

DungeonMix uses pnpm exclusively. It supports the npm API, so you can run all the usual commands by prefixing them with "p", such as `pnpm install && pnpm run dev` to get started.

### Code Quality Tools

DungeonMix uses the following tools to maintain codebase consistency and minimize regressions:

- Prettier
- TypeScript
- ESLint
- Vitest

These tools run automatically in a pre-commit hook (via Husky) and should never be skipped. Consider configuring your IDE to format code with Prettier on save for a smoother workflow.

### Commit Message Conventions

Commit messages must follow a specific format to maintain consistency and clarity. The format is enforced by a pre-commit hook and uses the following structure:

`type(scope?): message`

- **Type**: Must be one of the following: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`, `revert`.
- **Scope** (optional): A brief identifier in parentheses, using alphanumeric characters and hyphens (e.g., `(ui)` or `(state-management)`).
- **Message**: A concise description starting with a space after the colon, at least 5 characters long.

Example: `feat(ui): add resize handles to areas`

### Dependency Management

We aim to keep both the app size and installation footprint as small as possible. New dependencies will only be added if they provide significant benefits and have no sub-dependencies. Reducing the number of dependencies remains an ongoing roadmap goal.

### Localization

DungeonMix uses Lingui for localization. Every user-facing string should be wrapped in the `<Trans/>` macro if it's in a component body, or the `t` macro if passed as a variable. If you add or modify translatable strings, follow these steps:

1. Run `pnpm run extract` to update the translation source files (messages.po).
2. If you speak the language, add translations (you can use Poedit or similar tools to edit locale files).
3. Run `pnpm run compile` to update the generated messages files (messages.ts).
4. Explicitly state what was changed or added in your pull request.

If you don't speak the language and can't verify a machine translation, leave the strings untranslated - they will be handled separately.

### Testing

DungeonMix aims for high test coverage, especially in "business logic" areas like state actions and hooks. If you modify these parts of the codebase, update existing tests or add new ones to cover your changes.

### Backward Compatibility

Changes must not break existing user boards. A basic versioning and migration system is in place to ensure this. If you modify `BoardState`:

1. Update `getInitialBoardState()` to incorporate your changes, if applicable.
2. Bump the `VERSION` constant in `state.ts`.
3. Add a migration function to the `migrations` array in `state.ts`. These functions update data from older board versions after loading from storage but before populating the board state.

## Reporting Bugs

1. **Search Existing Issues**: Before submitting a new bug report, search the existing issues to ensure it hasn't already been reported.
2. **Reproduce the Issue**: Confirm the bug is reproducible on the latest version of the `master` branch.
3. **Create a New Issue**: If it's new and reproducible, create an issue with a concise, descriptive title.
4. **Issue Body**: Include:
   - Step-by-step reproduction instructions.
   - Expected behavior.
   - Actual behavior.
   - Relevant environment details (e.g., browser version, operating system).

## Pull Request Process

1. **Fork and Clone**: Fork the repository and clone it locally.
2. **Create a Feature Branch**: Branch from an up-to-date `master` branch. Use a descriptive name (e.g., `feat/area-resize-handles` or `fix/header-layout-bug`).
3. **Implement Changes**: Make your changes, following the guidelines above (e.g., no unnecessary dependencies, add tests, handle localization).
4. **Commit Changes**: Use atomic commits with clear, concise messages that adhere to the commit message conventions.
5. **Push and Open PR**: Push your branch to your fork and open a pull request against the original repository's `master` branch.
6. **PR Description**: Provide a clear description with context, linking to any related issues or discussions.
7. **Review**: Address feedback by pushing additional commits to your branch—the PR will update automatically.
