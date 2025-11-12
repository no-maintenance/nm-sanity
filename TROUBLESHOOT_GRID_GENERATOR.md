# Troubleshooting: Grid Generator Button Not Appearing

## Quick Fixes to Try

### 1. Ensure You're on the Correct Tab
The Grid Generator button is in the **"Puzzle"** tab. Make sure you:
1. Open a Strands Puzzle document in Sanity Studio
2. Click on the **"Puzzle"** tab at the top
3. Look for "✨ Generate Your Grid" section between "Theme Words" and "Generated Grid"

### 2. Restart Sanity Studio
Schema changes require a restart:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

### 3. Clear Browser Cache
1. Open Sanity Studio (usually http://localhost:3333)
2. Open DevTools (F12 or right-click → Inspect)
3. Right-click the refresh button
4. Select "Empty Cache and Hard Reload"

### 4. Rebuild the Schema
```bash
# Clean build
rm -rf .sanity
npm run dev
```

## Where the Button Should Appear

The Grid Generator button should appear:
- **After**: Theme Words array field
- **Before**: Generated Grid table field
- **In**: The "Puzzle" tab/group
- **Shows as**: A card with "✨ Generate Your Grid" title

## Visual Guide

The button area looks like this:
```text
┌─────────────────────────────────────┐
│ ✨ Generate Your Grid               │
│                                     │
│ Step 1: Add Theme Words Above ↑    │
│ • Add 3-6 theme words               │
│ • Mark ONE word as the Spangram     │
│                                     │
│ [✨ Generate Grid from Words]       │
└─────────────────────────────────────┘
```

## Check if Component is Loading

1. Open browser DevTools Console
2. Look for any errors related to:
   - `GridGeneratorButton`
   - `gridGenerator`
   - Module loading errors

## Manual Schema Verification

In Sanity Studio, you can check if the schema is loaded:

1. Go to any Strands Puzzle document
2. Open browser DevTools
3. In Console, run:
```javascript
// This should show the schema types
console.log(window._sanityStudio?.schema?._original?.types?.map(t => t.name).filter(n => n.includes('grid')))
```

Expected output should include: `['gridGenerator', 'generatedGrid']`

## If Nothing Works

### Option 1: Use Direct Grid Entry
1. Switch "Grid Creation Mode" to "Manual grid entry"
2. Fill in the grid table manually

### Option 2: Generate via Script
You can generate grids using the script directly:

```bash
npx tsx -e "
import {generateStrandsGrid} from './app/lib/games/grid-generator.js';

const result = await generateStrandsGrid({
  themeWords: [
    {word: 'MEMORY', isSpangram: true},
    {word: 'STILL', isSpangram: false},
    // Add your theme words here
  ],
  ensureHints: true,
  minHintWords: 15,
});

console.log('Grid:', result.grid);
console.log('Canonical Paths:', JSON.stringify(result.canonicalPaths, null, 2));
"
```

### Option 3: Check Sanity Configuration
Verify the file exists and is properly formatted:
```bash
ls -la app/sanity/schema/objects/games/grid-generator.ts
ls -la app/sanity/components/grid-generator-button.tsx
```

## Common Issues

### Issue: "onChange is not a function"
**Solution**: The component isn't receiving proper props from Sanity. Try rebuilding.

### Issue: Component doesn't render at all
**Solution**: The schema type might not be registered. Check `app/sanity/schema/index.ts` includes `gridGenerator`.

### Issue: Button appears but doesn't work
**Solution**: Check browser console for errors when clicking. May need to check file imports.

## Need More Help?

1. Check the browser console for specific error messages
2. Verify all files were saved properly
3. Ensure you're using the latest code (git status)
4. Try creating a new Strands Puzzle document to see if it appears there
