# Contributing to Cubiqo

Thank you for your interest in contributing to Cubiqo! This document provides guidelines and instructions for contributors.

## 🎯 Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming and inclusive community.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/thecubiqo.git`
3. Install dependencies: `npm install`
4. Set up environment variables (copy `.env.example` to `.env.local`)
5. Run development server: `npm run dev`

## 📝 Development Workflow

### Branch Naming
Use descriptive branch names:
- `feature/` for new features
- `fix/` for bug fixes
- `docs/` for documentation
- `refactor/` for code refactoring

Example: `feature/add-user-profile`

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting, missing semi-colons, etc.
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance

Example: `feat: add user authentication`

### Pull Requests
1. Create a descriptive PR title
2. Link any related issues
3. Provide a clear description of changes
4. Ensure all tests pass
5. Request review from maintainers

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=filename
```

### Writing Tests
- Place test files next to the code they test (`.test.ts` or `.spec.ts`)
- Use descriptive test names
- Test both success and failure cases
- Mock external dependencies

## 🏗️ Architecture

### Project Structure
```
src/
├── app/              # Next.js app router pages and API routes
├── components/       # Reusable React components
├── lib/             # Utility functions and services
├── types/           # TypeScript type definitions
└── styles/          # Global styles
```

### Key Technologies
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Supabase** - Database and auth
- **Tailwind CSS** - Styling
- **React Query** - Data fetching

## 🐛 Bug Reports

When reporting bugs, please include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots (if applicable)
5. Environment details

## 💡 Feature Requests

When requesting features, please:
1. Describe the problem you're solving
2. Explain your proposed solution
3. Provide examples or mockups
4. Consider edge cases

## 🔧 Code Style

### TypeScript
- Use strict mode
- Prefer interfaces over types for objects
- Avoid `any` type
- Use meaningful type names

### React
- Use functional components
- Prefer hooks over class components
- Use TypeScript for props
- Keep components small and focused

### Styling
- Use Tailwind CSS utility classes
- Follow responsive design principles
- Maintain consistent spacing and colors

## 📚 Documentation

### Writing Documentation
- Use clear, concise language
- Include code examples
- Update documentation when code changes
- Use Markdown formatting

### Documentation Types
- **API Documentation** - Endpoint descriptions and examples
- **Component Documentation** - Props, usage, and examples
- **Architecture Documentation** - System design and decisions
- **User Guides** - Step-by-step instructions

## 🚨 Security

### Reporting Security Issues
Please report security issues privately to the maintainers. Do not create public issues for security vulnerabilities.

### Security Guidelines
- Never commit secrets or API keys
- Validate all user input
- Use prepared statements for database queries
- Implement proper authentication and authorization

## 🤝 Community

### Getting Help
- Check existing documentation first
- Search existing issues
- Join our community chat
- Ask questions respectfully

### Recognition
Contributors will be recognized in:
- Release notes
- Contributor list
- Community highlights

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

---

Thank you for contributing to Cubiqo! Your efforts help make this project better for everyone.