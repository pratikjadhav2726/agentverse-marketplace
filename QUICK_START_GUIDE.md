# Quick Start Guide for Contributors

Welcome to AgentVerse Marketplace! This guide will help you get started quickly.

## 🚀 For New Contributors

### 1. First Time Setup (5 minutes)

```bash
# Clone the repository
git clone https://github.com/agentverse/marketplace.git
cd marketplace

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000` 🎉

### 2. Before Making Changes

- Read [CONTRIBUTING.md](CONTRIBUTING.md)
- Check existing issues
- Comment on the issue you want to work on
- Create a feature branch

### 3. Making Changes

```bash
# Create a branch
git checkout -b feature/your-feature-name

# Make your changes
# ... code ...

# Test your changes
npm run lint
npm run type-check
npm run build

# Commit with conventional commit format
git commit -m "feat: add amazing feature"

# Push to your fork
git push origin feature/your-feature-name
```

### 4. Submit Pull Request

- Use the PR template
- Link related issues
- Add screenshots for UI changes
- Wait for review

## 📚 Quick Links

- [Full Documentation](docs/)
- [API Documentation](docs/04-feature-documentation/)
- [Architecture](docs/02-architecture/)
- [Security Policy](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

## 🐛 Found a Bug?

1. Check if it's already reported
2. Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
3. Include steps to reproduce

## 💡 Have an Idea?

1. Check if it's already suggested
2. Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
3. Explain the use case

## ❓ Need Help?

- 📖 Check the [documentation](docs/)
- 💬 Ask in [GitHub Discussions](https://github.com/agentverse/marketplace/discussions)
- 🐛 Report bugs in [Issues](https://github.com/agentverse/marketplace/issues)

## 🎯 Good First Issues

Look for issues labeled `good-first-issue` to get started!

## 📝 Environment Variables

Required for development:
```bash
JWT_SECRET=your-secret-key
CREDENTIAL_ENCRYPTION_KEY=your-encryption-key-32-chars
STRIPE_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

See [.env.example](.env.example) for all variables.

## 🧪 Testing

```bash
# Run linter
npm run lint

# Check types
npm run type-check

# Build project
npm run build
```

## 📋 Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(agents): add scheduling feature`
- `fix(auth): resolve session timeout issue`
- `docs(readme): update installation steps`

## 🤝 Code Review Process

1. PR is submitted
2. CI checks run automatically
3. Maintainers review
4. Address feedback
5. Approved and merged!

## 🎉 After Your PR is Merged

- You'll be added to [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Mentioned in release notes
- Celebrated in the community!

## 🔐 Security Issues

**DO NOT** report security issues publicly. Email: security@agentverse.com

## 📞 Contact

- Email: support@agentverse.com
- GitHub: [@agentverse](https://github.com/agentverse)

---

Thank you for contributing to AgentVerse Marketplace! 🚀
