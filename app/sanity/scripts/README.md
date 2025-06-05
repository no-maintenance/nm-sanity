# Sanity Migration Scripts

This directory contains migration scripts for updating existing content when schema changes are made.

## Migration: Extra Product Information Internationalization

### Overview
This migration converts the `extraProductInformation` field from a basic rich text format to an internationalized array format, enabling multi-language support.

### When to use
Run this migration after changing the `extraProductInformation` field type from `baseRichtext` to `internationalizedArrayRichtext` in your product schema.

### How to run

1. **From the project root:**
   ```bash
   npm run migrate:product-info
   ```

2. **Or directly with tsx:**
   ```bash
   npx tsx app/sanity/scripts/migrate-extra-product-info.ts
   ```

3. **Or with Node.js (if compiled):**
   ```bash
   node app/sanity/scripts/migrate-extra-product-info.js
   ```

### What it does

1. **Finds all products** with existing `extraProductInformation` content
2. **Checks format** - skips products already in the new internationalized format
3. **Converts content** from old format:
   ```json
   [{ "_type": "block", "children": [...] }]
   ```
   
   To new internationalized format:
   ```json
   [{
     "_key": "en",
     "_type": "internationalizedArrayRichtextValue",
     "value": [{ "_type": "block", "children": [...] }]
   }]
   ```

4. **Updates documents** one by one with error handling
5. **Reports progress** with detailed logging

### Safety features
- ✅ **Non-destructive** - only updates documents that need migration
- ✅ **Idempotent** - safe to run multiple times
- ✅ **Error handling** - continues processing if individual updates fail
- ✅ **Progress logging** - shows exactly what's happening
- ✅ **Format detection** - automatically skips already migrated content

### Expected output
```
🔄 Starting migration of extraProductInformation fields...
📦 Found 15 products with extraProductInformation to migrate
🔄 Migrating product: product-abc123
   ✓ Updated product: product-abc123
🔄 Migrating product: product-def456
   ✓ Updated product: product-def456
⏭️  Product product-xyz789 already migrated, skipping...
✅ Migration completed successfully!
📈 Updated 14 products
🎉 Migration script completed successfully!
```

### Troubleshooting

**No products found:**
- Check that you have products with `extraProductInformation` content
- Verify your Sanity project connection

**Permission errors:**
- Ensure your Sanity token has write permissions
- Check that you're connected to the correct dataset

**Individual update failures:**
- The script will continue and report which specific products failed
- Check the error messages for specific issues (e.g., validation errors)

### Reverting (if needed)
If you need to revert back to the old format, you would need to:
1. Change the schema back to `baseRichtext`
2. Create a reverse migration script that extracts the `value` from each internationalized entry
3. Run the reverse migration

⚠️ **Note**: Only revert if you haven't started adding content in multiple languages, as that would be lost. 