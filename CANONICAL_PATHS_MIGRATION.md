# Canonical Paths Migration Guide

## Overview

This migration adds canonical (intended) paths for theme words in existing Strands puzzles. This ensures that puzzles only accept the specific letter paths that were intended during grid generation, preventing the issue where multiple paths can form the same word and potentially leave orphaned letters.

## Prerequisites

1. **Sanity Write Token**: You need a write token to update puzzles in Sanity.
   - Go to your Sanity project dashboard
   - Navigate to Settings → API → Tokens
   - Create a new token with "Editor" or "Deploy Studio" permissions
   - Add it to your `.env` file as `SANITY_API_WRITE_TOKEN`

2. **Environment Variables**: Ensure your `.env` file has:
   ```text
   SANITY_STUDIO_PROJECT_ID=your-project-id
   SANITY_STUDIO_DATASET=production
   SANITY_API_WRITE_TOKEN=your-write-token
   ```

## Running the Migration

### Option 1: Using npm/yarn script

Add to your `package.json`:
```json
{
  "scripts": {
    "migrate:canonical-paths": "tsx scripts/migrate-canonical-paths.ts"
  }
}
```

Then run:
```bash
npm run migrate:canonical-paths
# or
yarn migrate:canonical-paths
```

### Option 2: Direct execution

```bash
npx tsx scripts/migrate-canonical-paths.ts
```

## What the Migration Does

1. **Fetches all Strands puzzles** from your Sanity dataset
2. **Skips puzzles** that:
   - Already have canonical paths defined
   - Don't have a generated grid yet
3. **For each puzzle needing migration**:
   - Finds the canonical path for each theme word using DFS
   - Stores these paths in `gridMetadata.canonicalPaths`
4. **Updates the puzzle** in Sanity with the canonical paths

## Expected Output

```bash
🔍 Fetching Strands puzzles...

Found 10 puzzles

Processing: Strands #1
  ✓ Found path for "MEMORY": [21, 14, 22, 23, 31, 39]
  ✓ Found path for "STILL": [7, 13, 19, 25, 26]
  ✓ Found path for "SILENCE": [7, 19, 25, 31, 37, 43, 32]
  ✅ Successfully updated with canonical paths

Processing: Strands #2
  ⏭️  Already has canonical paths, skipping

...

📊 Migration Summary:
  ✅ Migrated: 7 puzzles
  ⏭️  Skipped: 2 puzzles
  ❌ Errors: 1 puzzles

✨ Migration complete!
```

## Troubleshooting

### "Could not find path for word" Error
- This means the word cannot be formed in the grid
- Check if the grid was generated correctly
- May need to regenerate the grid for this puzzle

### Authentication Errors
- Verify your write token is correct
- Ensure the token has proper permissions
- Check that project ID and dataset are correct

### Network/API Errors
- The script will show which puzzles failed
- You can run the migration again - it will skip already migrated puzzles
- Consider adding retry logic for network failures

## Testing

After migration, test your puzzles:

1. Load a migrated puzzle in the game
2. Try to form a theme word using different paths
3. Verify that only the canonical path is accepted
4. Check that "wrong path" message appears for alternative paths

## Rollback

If needed, you can remove canonical paths by running:

```javascript
// Remove canonical paths (rollback script)
await client
  .patch(puzzleId)
  .unset(['gridMetadata.canonicalPaths'])
  .commit();
```

## Notes

- The migration is **idempotent** - safe to run multiple times
- New puzzles automatically get canonical paths during grid generation
- This migration only affects existing puzzles created before the canonical paths feature
