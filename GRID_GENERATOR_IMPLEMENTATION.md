# Grid Generator Implementation - Proper Sanity Pattern

## Overview

This document explains how the canonical grid generation and storage works in the Strands puzzle system, following Sanity's established patterns for custom input components.

## Architecture

### 1. Hidden Generated Field Pattern

The `canonicalGrid` field follows Sanity's pattern for auto-generated data:

```typescript
defineField({
  name: 'canonicalGrid',
  type: 'canonicalGrid',
  readOnly: true,  // Users cannot manually edit
  hidden: true,    // Not shown in UI - data is auto-generated
  validation: (Rule) => Rule.custom((value, context) => {
    // Conditional validation based on gridLocked state
    const parent = context?.parent as any;
    if (parent?.gridLocked && !value) {
      return 'Grid must be generated before locking';
    }
    return true;
  }),
})
```

**Location**: `app/sanity/schema/documents/strands-puzzle.tsx:111-130`

### 2. Custom Input Component with Sanity Client

The grid generator button is a custom input component that:
- Uses `useClient()` hook for proper Sanity API access
- Uses `useFormValue()` to access the parent document
- Generates the grid using the V2 algorithm
- Directly patches the document via `client.patch().set().commit()`

```typescript
export function GridGeneratorButton(props: ObjectInputProps) {
  // Use Sanity client hook for proper API access
  const client = useClient({apiVersion: '2024-01-01'});

  // Access parent document
  const document = useFormValue([]) as any;

  const handleGenerate = async () => {
    // ... generate grid ...

    // Directly patch document using Sanity client
    await client
      .patch(document._id)
      .set({
        canonicalGrid: canonicalGrid,
        gridMetadata: { ... },
      })
      .commit();
  };
}
```

**Location**: `app/sanity/components/grid-generator-button.tsx:79-257`

### 3. Visual Preview in Generator

The grid generator shows a visual preview with:
- Color-coded theme words
- Spangram highlighting (★ indicator + green border)
- 8x6 grid layout matching the actual game
- Theme words list with matching colors

Users see the generated grid immediately without needing to look at the hidden field.

**Location**: `app/sanity/components/grid-generator-button.tsx:440-596`

## Data Flow

```text
┌─────────────────────┐
│  Theme Words Input  │
│  (User Entry)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Grid Generator     │
│  Button Component   │
│  - Validates words  │
│  - Generates grid   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  client.patch()     │
│  - Sets canonical   │
│    Grid (hidden)    │
│  - Sets metadata    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Visual Preview     │
│  (Shows result)     │
└─────────────────────┘
```

## Key Design Decisions

### Why Hidden Field?

The `canonicalGrid` field is hidden because:
1. **Auto-generated**: Users should never manually edit this data
2. **Visual Preview**: The generator component shows a better visual representation
3. **Complex Structure**: Raw JSON is not user-friendly to view
4. **Sanity Pattern**: Follows the established pattern for generated/computed fields

### Why Direct Client Patching?

Using `client.patch()` instead of `onChange`:
1. **Documented Pattern**: This is how Sanity's examples handle generated data
2. **Reliable**: Direct API calls don't depend on form state or event propagation
3. **Clear Errors**: Failures are explicit with proper error messages
4. **Atomic Updates**: The patch operation is atomic and transactional

### Why useClient Hook?

The `useClient()` hook:
1. **Official API**: Part of Sanity's public API
2. **Proper Context**: Gets the correctly configured client with auth
3. **Type Safe**: Full TypeScript support
4. **Future Proof**: Won't break with Sanity updates

## Canonical Grid Structure

The canonical grid stores:

```typescript
{
  cells: string[],              // 48-character flat array
  themePaths: string,           // JSON string of theme word paths
  hintPaths?: string,           // JSON string of hint word paths
  metadata: {
    generatedAt: string,
    algorithm: string,
    dimensions: { rows: number; cols: number },
    totalHintWords: number
  }
}
```

**Note**: `themePaths` and `hintPaths` are stored as JSON strings (not objects) because Sanity requires explicit field definitions for nested objects, and these structures are dynamic.

## Related Files

- **Schema**: `app/sanity/schema/documents/strands-puzzle.tsx`
- **Generator**: `app/sanity/components/grid-generator-button.tsx`
- **Algorithm**: `app/lib/games/grid-generator-v2.ts`
- **Types**: `app/lib/games/canonical-grid.types.ts`
- **Utilities**: `app/lib/games/grid-utils.ts`
- **Logic**: `app/lib/games/strands-logic.ts`

## Testing

To test the grid generator:

1. Open Sanity Studio
2. Create a new Strands Puzzle document (must be saved first)
3. Add theme words totaling 48 letters
4. Mark one word as Spangram (6+ letters)
5. Click "✨ Generate Grid from Words"
6. Verify:
   - Visual preview appears with colored grid
   - No errors in browser console
   - Document saves successfully
   - Can regenerate without issues

## Migration Notes

Previous implementation attempted to use `onChange` and `PatchEvent`, which is the correct pattern for form input components that update their own field. However, for components that need to update sibling fields or generate complex derived data, the `client.patch()` approach is more appropriate and reliable.

This matches patterns seen in:
- Sanity's document function examples (auto-tagging, auto-summary, etc.)
- Shopify template examples (status fields, generated data)
- Official Sanity documentation examples
