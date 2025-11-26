# Data Pods & Permissions

## Overview

Data Pods implement a permission-based access control system that allows users to grant AI agents specific access levels to their project data.

## Permission Model

### Access Levels

```typescript
type PermissionLevel = 'none' | 'read' | 'write'
```

- **none**: No access to project data
- **read**: Can view project data and documents
- **write**: Can view and modify project data

### Permission Structure

```typescript
interface AgentPermission {
  id: string
  userId: string
  projectId: string
  agentName: string
  permission: PermissionLevel
  createdAt: Date
  updatedAt: Date
}
```

## Database Schema

### agent_permissions Table

```sql
CREATE TABLE agent_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('none', 'read', 'write')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id, agent_name)
);
```

## Row Level Security (RLS)

### Enabled Tables

- `projects`
- `project_documents`
- `agent_activities`
- `agent_permissions`

### RLS Policies

#### Projects

```sql
-- Users can only see their own projects
CREATE POLICY projects_select_own ON projects
FOR SELECT USING (auth.uid() = owner_id);

-- Users can only insert their own projects
CREATE POLICY projects_insert_own ON projects
FOR INSERT WITH CHECK (auth.uid() = owner_id);
```

#### Project Documents

```sql
-- Users can see documents from their projects
CREATE POLICY project_documents_select_own ON project_documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_documents.project_id
    AND projects.owner_id = auth.uid()
  )
);
```

#### Agent Activities

```sql
-- Users can see activities from their projects
CREATE POLICY agent_activities_select_own ON agent_activities
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = agent_activities.project_id
    AND projects.owner_id = auth.uid()
  )
);
```

## Permission Service

### Check Agent Access

```typescript
class PermissionService {
  async checkAgentAccess(
    userId: string,
    projectId: string,
    agentName: string
  ): Promise<boolean> {
    const { data } = await supabase
      .from('agent_permissions')
      .select('permission')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .eq('agent_name', agentName)
      .single()

    return data?.permission === 'read' || data?.permission === 'write'
  }
}
```

### Grant Permission

```typescript
async grantPermission(
  userId: string,
  projectId: string,
  agentName: string,
  permission: PermissionLevel
): Promise<void> {
  await supabase
    .from('agent_permissions')
    .upsert({
      user_id: userId,
      project_id: projectId,
      agent_name: agentName,
      permission
    })
}
```

### Revoke Permission

```typescript
async revokePermission(
  userId: string,
  projectId: string,
  agentName: string
): Promise<void> {
  await supabase
    .from('agent_permissions')
    .delete()
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .eq('agent_name', agentName)
}
```

## Integration with Context Engineer

```typescript
async buildContext(input: ContextEngineerInput) {
  // Check permissions first
  if (input.agentName) {
    const hasAccess = await permissionService.checkAgentAccess(
      input.userId,
      input.projectId,
      input.agentName
    )
    
    if (!hasAccess) {
      throw new AppError(
        'PERMISSION_DENIED',
        `Agent ${input.agentName} does not have access to this project`,
        403
      )
    }
  }
  
  // Continue with context building...
}
```

## UI Component

### AgentPermissionsPanel

```typescript
const AgentPermissionsPanel = ({ projectId }: Props) => {
  const [permissions, setPermissions] = useState<AgentPermission[]>([])
  
  const updatePermission = async (
    agentName: string,
    permission: PermissionLevel
  ) => {
    if (permission === 'none') {
      await supabase
        .from('agent_permissions')
        .delete()
        .eq('project_id', projectId)
        .eq('agent_name', agentName)
    } else {
      await supabase
        .from('agent_permissions')
        .upsert({
          project_id: projectId,
          agent_name: agentName,
          permission
        })
    }
  }
  
  return (
    <div>
      {AGENTS.map(agent => (
        <PermissionRow
          key={agent}
          agentName={agent}
          permission={permissions[agent] || 'none'}
          onChange={(p) => updatePermission(agent, p)}
        />
      ))}
    </div>
  )
}
```

## Security Best Practices

### 1. Always Check Permissions

```typescript
// ✅ Good
if (agentName) {
  await permissionService.checkAgentAccess(userId, projectId, agentName)
}

// ❌ Bad - No permission check
const context = await buildContext({ projectId, agentName })
```

### 2. Use RLS Policies

```typescript
// ✅ Good - RLS enforces access
const { data } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId)

// ❌ Bad - Bypassing RLS with service role
const { data } = await supabaseAdmin
  .from('projects')
  .select('*')
```

### 3. Validate Input

```typescript
// ✅ Good
const validAgents = ['design_spec', 'workflow_designer', 'content_strategist']
if (!validAgents.includes(agentName)) {
  throw new Error('Invalid agent name')
}
```

### 4. Audit Permission Changes

```typescript
await auditService.logActivity(
  projectId,
  'system',
  'permission.granted',
  { agentName, permission }
)
```

## Testing

### Unit Tests

```typescript
describe('PermissionService', () => {
  it('should grant read permission', async () => {
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
  
  it('should deny access without permission', async () => {
    const hasAccess = await permissionService.checkAgentAccess(
      'user-1',
      'project-1',
      'design_spec'
    )
    
    expect(hasAccess).toBe(false)
  })
})
```

## Migration Guide

### Adding New Agent

1. Update agent list in UI
2. No database changes needed
3. Users can grant permissions immediately

### Changing Permission Levels

1. Update type definition
2. Update CHECK constraint in database
3. Update UI options
4. Migrate existing permissions if needed

## Troubleshooting

### Permission Denied Errors

```typescript
// Check if permission exists
const { data } = await supabase
  .from('agent_permissions')
  .select('*')
  .eq('user_id', userId)
  .eq('project_id', projectId)
  .eq('agent_name', agentName)

console.log('Permission:', data)
```

### RLS Policy Issues

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- View policies
SELECT * FROM pg_policies 
WHERE tablename = 'projects';
```
