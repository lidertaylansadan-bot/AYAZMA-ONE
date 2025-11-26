# Contributing to AYAZMA-ONE

Thank you for your interest in contributing to AYAZMA-ONE! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase CLI
- Redis (for local development)
- Git

### Setup Development Environment

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/AYAZMA-ONE.git
   cd AYAZMA-ONE/AYAZMA_ONE_v2
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Supabase**

   ```bash
   npx supabase start
   ```

5. **Run migrations**

   ```bash
   npx supabase db reset
   ```

6. **Start development server**

   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

Example: `feature/add-ollama-provider`

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

**Examples:**

```
feat(ai): add Ollama provider support

fix(context): resolve token overflow in compression

docs(api): update endpoint documentation
```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid `any` types
- Use interfaces for object shapes

```typescript
// ✅ Good
interface User {
  id: string
  name: string
  email: string
}

// ❌ Bad
const user: any = { id: '1', name: 'John' }
```

### React Components

- Use functional components with hooks
- Extract complex logic to custom hooks
- Keep components focused and small

```typescript
// ✅ Good
const UserProfile = ({ userId }: Props) => {
  const { user, loading } = useUser(userId)
  
  if (loading) return <Spinner />
  return <div>{user.name}</div>
}

// ❌ Bad - Too much logic in component
const UserProfile = ({ userId }: Props) => {
  const [user, setUser] = useState()
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data)
        setLoading(false)
      })
  }, [userId])
  
  // ...
}
```

### File Organization

```
module/
├── index.ts          # Public API
├── types.ts          # Type definitions
├── service.ts        # Business logic
├── routes.ts         # API routes (if applicable)
└── __tests__/        # Tests
    └── service.test.ts
```

## Testing

### Unit Tests

- Write tests for all new features
- Aim for >80% code coverage
- Use descriptive test names

```typescript
describe('PermissionService', () => {
  it('should grant read permission to agent', async () => {
    await permissionService.grantPermission(
      'user-1',
      'project-1',
      'design_spec',
      'read'
    )
    
    const hasAccess = await permissionService.checkAgentAccess(
      'user-1',
      'project-1',
      'design_spec'
    )
    
    expect(hasAccess).toBe(true)
  })
})
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx vitest run tests/security/PermissionService.test.ts

# Run tests in watch mode
npx vitest watch
```

## Pull Request Process

### Before Submitting

1. ✅ Code follows style guidelines
2. ✅ Tests pass locally
3. ✅ New tests added for new features
4. ✅ Documentation updated
5. ✅ No linting errors
6. ✅ Commits follow conventional commits

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. Submit PR with clear description
2. Address review comments
3. Ensure CI passes
4. Wait for approval from maintainer
5. Squash and merge

## Database Migrations

### Creating a Migration

```bash
# Create new migration
npx supabase migration new <migration_name>

# Edit the generated file in supabase/migrations/
```

### Migration Guidelines

- Use descriptive names
- Include rollback logic
- Test locally before committing
- Document breaking changes

```sql
-- Good migration example
-- 024_add_notifications_table.sql

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own ON notifications
FOR SELECT USING (auth.uid() = user_id);
```

## Documentation

### Code Comments

- Comment complex logic
- Use JSDoc for public APIs
- Keep comments up to date

```typescript
/**
 * Builds optimized context for AI agents
 * 
 * @param input - Context building parameters
 * @returns Optimized context with prompts
 * @throws AppError if permission denied
 */
async buildContext(input: ContextEngineerInput): Promise<ContextEngineerOutput>
```

### Documentation Updates

- Update relevant .md files
- Add examples for new features
- Keep API reference current

## Questions?

- Open an issue for bugs
- Start a discussion for questions
- Join our Discord (if available)

## License

By contributing, you agree that your contributions will be licensed under the project's license.
