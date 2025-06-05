import {getCliClient} from 'sanity/cli';
import {DEFAULT_LOCALE} from 'countries';

const client = getCliClient();

// Types for the migration
interface Product {
  _id: string;
  _rev: string;
  extraProductInformation?: any[];
}

// Fix script to correct improperly migrated extraProductInformation fields
async function fixExtraProductInformationMigration() {
  console.log('🔧 Starting fix for improperly migrated extraProductInformation fields...');

  try {
    // Query for all products that have extraProductInformation
    const query = `*[_type == "product" && defined(extraProductInformation)] {
      _id,
      _rev,
      extraProductInformation
    }`;

    const products: Product[] = await client.fetch(query);
    console.log(`📦 Found ${products.length} products with extraProductInformation to check`);

    if (products.length === 0) {
      console.log('✅ No products found with extraProductInformation');
      return;
    }

    let fixedCount = 0;

    for (const product of products) {
      const {_id, extraProductInformation} = product;

      if (!Array.isArray(extraProductInformation) || extraProductInformation.length === 0) {
        console.log(`⏭️  Product ${_id} has no content, skipping...`);
        continue;
      }

      const firstItem = extraProductInformation[0];
      
      // Check if this looks like it needs fixing
      let needsFix = false;
      let fixedContent = null;

      // Case 1: Already in correct format - skip
      if (firstItem && 
          typeof firstItem === 'object' &&
          '_key' in firstItem &&
          '_type' in firstItem &&
          firstItem._type === 'internationalizedArrayRichtextValue' &&
          'value' in firstItem) {
        console.log(`✅ Product ${_id} already in correct format, skipping...`);
        continue;
      }

      // Case 2: Wrongly wrapped content (double wrapped or wrong structure)
      if (firstItem && 
          typeof firstItem === 'object' &&
          '_type' in firstItem &&
          typeof firstItem._type === 'string' &&
          firstItem._type.includes('internationalizedArray') &&
          firstItem._type !== 'internationalizedArrayRichtextValue') {
        console.log(`🔧 Product ${_id} has incorrect type: ${firstItem._type}`);
        
        // Fix the type name
        if ('value' in firstItem && firstItem.value) {
          fixedContent = [{
            _key: ('_key' in firstItem && typeof firstItem._key === 'string') ? 
              firstItem._key : DEFAULT_LOCALE.language.toLowerCase(),
            _type: 'internationalizedArrayRichtextValue',
            value: firstItem.value
          }];
          needsFix = true;
        }
      }

      // Case 3: Content stored directly as rich text blocks (needs internationalization wrapping)
      if (firstItem && 
          typeof firstItem === 'object' &&
          '_type' in firstItem &&
          firstItem._type === 'block') {
        console.log(`🔧 Product ${_id} has unwrapped rich text blocks`);
        
        fixedContent = [{
          _key: DEFAULT_LOCALE.language.toLowerCase(),
          _type: 'internationalizedArrayRichtextValue',
          value: extraProductInformation
        }];
        needsFix = true;
      }

      // Case 4: Invalid or corrupted structure
      if (!needsFix && firstItem && typeof firstItem === 'object' && !('_type' in firstItem)) {
        console.log(`🔧 Product ${_id} has corrupted structure`);
        
        // Try to salvage any content that looks like rich text blocks
        const blocks = Array.isArray(extraProductInformation) ? 
          extraProductInformation.filter(item => 
            item && 
            typeof item === 'object' && 
            '_type' in item && 
            item._type === 'block'
          ) : [];
        
        if (blocks.length > 0) {
          fixedContent = [{
            _key: DEFAULT_LOCALE.language.toLowerCase(),
            _type: 'internationalizedArrayRichtextValue',
            value: blocks
          }];
          needsFix = true;
        } else {
          console.log(`❌ Product ${_id} has no salvageable content, removing field...`);
          fixedContent = null;
          needsFix = true;
        }
      }

      if (needsFix) {
        console.log(`🔧 Fixing product: ${_id}`);

        try {
          if (fixedContent === null) {
            // Remove the field entirely
            await client
              .patch(_id)
              .unset(['extraProductInformation'])
              .commit();
          } else {
            // Update with fixed content
            await client
              .patch(_id)
              .set({extraProductInformation: fixedContent})
              .commit();
          }
          
          fixedCount++;
          console.log(`   ✓ Fixed product: ${_id}`);
        } catch (error) {
          console.error(`   ❌ Failed to fix product: ${_id}`, error);
        }
      }
    }

    console.log('✅ Fix completed successfully!');
    console.log(`📈 Fixed ${fixedCount} products`);

  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  }
}

// Handle script execution
if (require.main === module) {
  fixExtraProductInformationMigration()
    .then(() => {
      console.log('🎉 Fix script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fix script failed:', error);
      process.exit(1);
    });
}

export {fixExtraProductInformationMigration}; 