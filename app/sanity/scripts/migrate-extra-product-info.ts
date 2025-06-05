import {getCliClient} from 'sanity/cli';
import {DEFAULT_LOCALE} from 'countries';

const client = getCliClient();

// Types for the migration
interface Product {
  _id: string;
  _rev: string;
  extraProductInformation?: any[];
}

// Migration script to convert extraProductInformation from baseRichtext to internationalizedArrayRichtext
async function migrateExtraProductInformation() {
  console.log('🔄 Starting migration of extraProductInformation fields...');

  try {
    // Query for all products that have extraProductInformation
    const query = `*[_type == "product" && defined(extraProductInformation)] {
      _id,
      _rev,
      extraProductInformation
    }`;

    const products: Product[] = await client.fetch(query);
    console.log(`📦 Found ${products.length} products with extraProductInformation to migrate`);

    if (products.length === 0) {
      console.log('✅ No products found that need migration');
      return;
    }

    let migratedCount = 0;

    for (const product of products) {
      const {_id, extraProductInformation} = product;

      // Check if it's already in the internationalized format
      if (Array.isArray(extraProductInformation) && 
          extraProductInformation.length > 0 && 
          extraProductInformation[0] && 
          typeof extraProductInformation[0] === 'object' &&
          '_type' in extraProductInformation[0] &&
          extraProductInformation[0]._type === 'internationalizedArrayRichtextValue') {
        console.log(`⏭️  Product ${_id} already migrated, skipping...`);
        continue;
      }

      // Convert old format to new internationalized format
      const migratedContent = [{
        _key: DEFAULT_LOCALE.language.toLowerCase(),
        _type: 'internationalizedArrayRichtextValue',
        value: extraProductInformation || []
      }];

      console.log(`🔄 Migrating product: ${_id}`);

      try {
        // Update the document
        await client
          .patch(_id)
          .set({extraProductInformation: migratedContent})
          .commit();
        
        migratedCount++;
        console.log(`   ✓ Updated product: ${_id}`);
      } catch (error) {
        console.error(`   ❌ Failed to update product: ${_id}`, error);
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log(`📈 Updated ${migratedCount} products`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Handle script execution
if (require.main === module) {
  migrateExtraProductInformation()
    .then(() => {
      console.log('🎉 Migration script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export {migrateExtraProductInformation}; 