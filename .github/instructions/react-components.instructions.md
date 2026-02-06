---
applyTo: "**/components/**/*.tsx"
---
# React Component Standards

## Component Structure

**✅ ALWAYS use folder structure** with `index.tsx`:

```
components/
└── component-name/        # kebab-case folder
    ├── index.tsx          # Main component
    ├── types.ts           # Component-specific types (if needed)
    └── __tests__/         # Tests folder
        └── component-name.test.tsx
```

## Export Pattern

**✅ ALWAYS use named function exports**:

```tsx
// ✅ CORRECT
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ onClick, children }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}

// ❌ INCORRECT: Arrow function export
export const Button = ({ onClick, children }: ButtonProps) => {
  return <button onClick={onClick}>{children}</button>;
};

// ❌ INCORRECT: Default export
export default function Button() { }
```

## Props Interface

**✅ ALWAYS define props interface inside the component file**:

```tsx
// ✅ CORRECT: Interface defined in component file
interface UserCardProps {
  user: User;
  onSelect?: (user: User) => void;
  className?: string;
}

export function UserCard({ user, onSelect, className }: UserCardProps) {
  return (
    <div className={className}>
      <h2>{user.name}</h2>
    </div>
  );
}
```

## Early Returns

**✅ Use early returns** for invalid states:

```tsx
export function UserList({ users }: { users: User[] }) {
  // Early return for empty state
  if (!users?.length) {
    return <p>No users found</p>;
  }

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Event Handlers

**✅ Use `handle` prefix** for event handlers:

```tsx
export function Form() {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // ...
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    // ...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleInputChange} />
    </form>
  );
}
```
