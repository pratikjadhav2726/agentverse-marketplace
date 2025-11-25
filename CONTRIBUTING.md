# Contributing to AgentVerse Marketplace

Thank you for your interest in contributing to AgentVerse Marketplace! We welcome contributions from the community and are excited to see what you'll bring to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/agentverse-marketplace.git
   cd agentverse-marketplace
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/agentverse-marketplace.git
   ```

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env.local`
   - Fill in the required environment variables
   - See README.md for detailed instructions

3. **Initialize the database**:
   ```bash
   npm run db:init
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Run tests**:
   ```bash
   npm test
   ```

6. **Run linting**:
   ```bash
   npm run lint
   ```

## How to Contribute

### Types of Contributions

We welcome many types of contributions:

- **Bug fixes**: Help us squash those bugs!
- **New features**: Add exciting new functionality
- **Documentation**: Improve or add documentation
- **Tests**: Increase test coverage
- **Code quality**: Refactoring and improvements
- **Design**: UI/UX improvements

### Before You Start

1. **Check existing issues**: Look for existing issues or create a new one to discuss your idea
2. **Get feedback**: For major changes, please open an issue first to discuss what you would like to change
3. **Assign yourself**: Comment on the issue to let others know you're working on it

## Pull Request Process

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**:
   - Write clean, maintainable code
   - Follow our coding standards (see below)
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**:
   ```bash
   npm run lint
   npm test
   npm run build
   ```

4. **Commit your changes**:
   - Follow our commit message guidelines
   - Make atomic commits (one logical change per commit)

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**:
   - Fill out the PR template completely
   - Link related issues
   - Provide screenshots/videos for UI changes
   - Ensure all CI checks pass

7. **Code Review**:
   - Address review comments promptly
   - Keep the PR updated with the main branch
   - Be patient and respectful

8. **After Approval**:
   - A maintainer will merge your PR
   - Your branch will be deleted
   - You can delete your local branch

## Coding Standards

### General Principles

- Follow **SOLID principles** and best practices
- Write clean, readable, and maintainable code
- Keep functions small and focused
- Use meaningful variable and function names
- Add comments for complex logic

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow the existing code style
- Use functional programming patterns where appropriate
- Avoid `any` types; use proper typing
- Use async/await over promises

### React/Next.js

- Use functional components with hooks
- Follow React best practices
- Use Server Components where possible
- Optimize for performance (memoization, lazy loading)
- Keep components small and reusable

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow the existing design system
- Ensure responsive design
- Test on multiple screen sizes
- Use shadcn/ui components when available

### File Organization

- Keep related files together
- Use clear, descriptive file names
- Follow the existing project structure
- Export from index files when appropriate

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi-colons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

### Examples

```
feat(agents): add ability to schedule agent executions

Add new scheduling feature that allows users to schedule
agent executions at specific times or intervals.

Closes #123
```

```
fix(auth): resolve session timeout issue

Users were being logged out too early. Adjusted JWT
expiration time to match session configuration.

Fixes #456
```

## Reporting Bugs

### Before Submitting a Bug Report

1. **Check the documentation**: The issue might be covered there
2. **Search existing issues**: Someone might have already reported it
3. **Update to latest version**: The bug might already be fixed
4. **Try to reproduce**: Can you consistently reproduce the issue?

### How to Submit a Bug Report

Use the **Bug Report** issue template and include:

- Clear, descriptive title
- Steps to reproduce the behavior
- Expected behavior
- Actual behavior
- Screenshots or videos (if applicable)
- Environment details (OS, browser, Node version)
- Error messages or logs
- Any additional context

## Feature Requests

We love feature requests! Use the **Feature Request** issue template and include:

- Clear, descriptive title
- The problem you're trying to solve
- Your proposed solution
- Alternative solutions considered
- Why this feature would be useful to most users
- Mockups or examples (if applicable)

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Discord/Slack**: Real-time community chat (if applicable)

### Getting Help

- Check the [README](README.md) and documentation
- Search closed issues and discussions
- Ask in GitHub Discussions
- Be patient and respectful

## Recognition

Contributors will be:

- Listed in our CONTRIBUTORS file
- Mentioned in release notes
- Celebrated in our community channels

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

## Questions?

Don't hesitate to ask questions! We're here to help. Open an issue or start a discussion, and we'll be happy to assist you.

Thank you for contributing to AgentVerse Marketplace! 🚀
