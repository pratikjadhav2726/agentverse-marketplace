# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

The AgentVerse team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@agentverse.com**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include in Your Report

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

This information will help us triage your report more quickly.

### What to Expect

After you submit a vulnerability report, here's what happens:

1. **Acknowledgment**: We'll acknowledge receipt of your vulnerability report within 48 hours.

2. **Investigation**: We will investigate the issue and determine its severity and impact. We may ask you for additional information during this process.

3. **Fix Development**: Once we confirm the vulnerability, we will work on a fix. The time to develop a fix depends on the complexity of the issue.

4. **Disclosure**: We will coordinate with you on the disclosure timeline. We prefer to disclose vulnerabilities once a fix is available, but we're open to discussing appropriate timelines.

5. **Credit**: We will credit you in the security advisory (unless you prefer to remain anonymous).

### Preferred Languages

We prefer all communications to be in English.

## Security Best Practices for Contributors

When contributing to AgentVerse, please follow these security best practices:

### General

- Never commit sensitive information (API keys, passwords, tokens, etc.)
- Use environment variables for configuration
- Always validate and sanitize user input
- Keep dependencies up to date
- Follow the principle of least privilege

### Authentication & Authorization

- Implement proper authentication checks
- Use secure session management
- Implement rate limiting
- Use strong password hashing (bcrypt, Argon2)
- Implement CSRF protection

### Database Security

- Use parameterized queries to prevent SQL injection
- Implement proper access controls
- Encrypt sensitive data at rest
- Use secure connections (SSL/TLS)
- Regularly backup data

### API Security

- Validate all input
- Use HTTPS for all communications
- Implement proper error handling (don't leak sensitive info)
- Use API rate limiting
- Implement proper CORS policies

### Frontend Security

- Sanitize user input to prevent XSS
- Use Content Security Policy (CSP)
- Implement proper CSRF protection
- Don't expose sensitive data in client-side code
- Use secure cookies (httpOnly, secure, sameSite)

### Dependencies

- Regularly update dependencies
- Use `npm audit` to check for vulnerabilities
- Review dependencies before adding them
- Use lock files (package-lock.json)

## Known Security Considerations

### JWT Tokens

- Tokens are stored in httpOnly cookies
- 30-minute expiration time
- Secure flag enabled in production
- Strong secret key required (see .env.example)

### Credential Encryption

- AES-256-CBC encryption for stored credentials
- Random IV for each encryption
- Strong encryption key required (32+ characters)

### Database

- SQLite with foreign key constraints
- Parameterized queries throughout
- No raw SQL with user input

### Payment Processing

- Stripe integration for payment processing
- No credit card data stored locally
- Webhook signature verification
- PCI compliance through Stripe

## Security Updates

We will announce security updates through:

- GitHub Security Advisories
- Release notes
- Project README

## Scope

The following are **in scope** for bug bounty/security reports:

- Authentication and authorization bypasses
- Remote code execution
- SQL injection
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Server-side request forgery (SSRF)
- Sensitive data exposure
- API security issues

The following are **out of scope**:

- Denial of service attacks
- Issues in dependencies (report to the dependency maintainers)
- Social engineering attacks
- Physical attacks
- Issues that require unlikely user interaction

## Bug Bounty Program

We currently do not have a formal bug bounty program, but we deeply appreciate security researchers who report vulnerabilities to us. We will:

- Acknowledge your contribution
- Credit you in our security advisories (if you wish)
- Consider appropriate recognition for significant findings

## Questions?

If you have questions about this security policy, please open an issue or contact us at security@agentverse.com.

Thank you for helping keep AgentVerse and our users safe! 🛡️
