import {getCliClient} from 'sanity/cli';

const client = getCliClient();

// Types for the migration
interface LegacySiteProtection {
  enabled?: boolean;
  accessMode?: 'password' | 'countdown' | 'both' | 'either';
  password?: string;
  countdown?: string;
  title?: any[];
  message?: any[];
  countdownLabel?: any[];
  passwordLabel?: any[];
  redirectPage?: any;
  mediaType?: 'image' | 'video';
  backgroundImage?: any;
  backgroundVideo?: any;
  overlayOpacity?: number;
  colorScheme?: any;
}

interface SettingsDocument {
  _id: string;
  _rev: string;
  siteProtection?: LegacySiteProtection;
}

interface ProtectionConfigDocument {
  _type: 'protectionConfig';
  name: string;
  description?: string;
  enabled: boolean;
  accessMode?: 'password' | 'countdown' | 'both' | 'either';
  password?: string;
  countdown?: string;
  title?: any[];
  message?: any[];
  countdownLabel?: any[];
  passwordLabel?: any[];
  redirectPage?: any;
  mediaType?: 'image' | 'video';
  backgroundImage?: any;
  backgroundVideo?: any;
  overlayOpacity?: number;
  colorScheme?: any;
}

// Migration script to convert siteProtection object to protectionConfig reference
async function migrateSiteProtection() {
  console.log('🔄 Starting migration of site protection configuration...');

  try {
    // Query for the settings document
    const query = `*[_type == "settings"][0] {
      _id,
      _rev,
      siteProtection
    }`;

    const settings: SettingsDocument = await client.fetch(query);

    if (!settings) {
      console.log('❌ No settings document found');
      return;
    }

    console.log(`📋 Found settings document: ${settings._id}`);

    // Check if migration is needed
    if (!settings.siteProtection || typeof settings.siteProtection === 'string') {
      console.log('✅ Settings already migrated or no site protection configured');
      return;
    }

    console.log('🔍 Legacy siteProtection object found, migrating...');

    // Create the new protectionConfig document
    const protectionConfig: ProtectionConfigDocument = {
      _type: 'protectionConfig',
      name: 'Global Site Protection',
      description: 'Migrated from legacy siteProtection configuration',
      enabled: settings.siteProtection.enabled || false,
      accessMode: settings.siteProtection.accessMode,
      password: settings.siteProtection.password,
      countdown: settings.siteProtection.countdown,
      title: settings.siteProtection.title,
      message: settings.siteProtection.message,
      countdownLabel: settings.siteProtection.countdownLabel,
      passwordLabel: settings.siteProtection.passwordLabel,
      redirectPage: settings.siteProtection.redirectPage,
      mediaType: settings.siteProtection.mediaType,
      backgroundImage: settings.siteProtection.backgroundImage,
      backgroundVideo: settings.siteProtection.backgroundVideo,
      overlayOpacity: settings.siteProtection.overlayOpacity,
      colorScheme: settings.siteProtection.colorScheme,
    };

    console.log('📝 Creating new protectionConfig document...');

    // Create the protectionConfig document
    const createdDoc = await client.create(protectionConfig);
    console.log(`   ✓ Created protectionConfig document: ${createdDoc._id}`);

    console.log('🔗 Updating settings to reference new protectionConfig...');

    // Update settings to reference the new protectionConfig document
    await client
      .patch(settings._id)
      .set({
        siteProtection: {
          _type: 'reference',
          _ref: createdDoc._id,
        },
      })
      .commit();

    console.log(`   ✓ Updated settings document: ${settings._id}`);
    console.log('✅ Migration completed successfully!');
    console.log(`📈 Migrated site protection from legacy object to document: ${createdDoc._id}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Rollback function in case migration needs to be reverted
async function rollbackSiteProtectionMigration() {
  console.log('🔄 Starting rollback of site protection migration...');

  try {
    // Query for settings with protectionConfig reference
    const query = `*[_type == "settings"][0] {
      _id,
      _rev,
      siteProtection->{
        _id,
        name,
        enabled,
        accessMode,
        password,
        countdown,
        title,
        message,
        countdownLabel,
        passwordLabel,
        redirectPage,
        mediaType,
        backgroundImage,
        backgroundVideo,
        overlayOpacity,
        colorScheme
      }
    }`;

    const settings = await client.fetch(query);

    if (!settings?.siteProtection?._id) {
      console.log('❌ No migrated protection config found to rollback');
      return;
    }

    const protectionConfigId = settings.siteProtection._id;
    console.log(`📋 Found migrated protectionConfig: ${protectionConfigId}`);

    // Convert back to legacy object format
    const legacyProtection: LegacySiteProtection = {
      enabled: settings.siteProtection.enabled,
      accessMode: settings.siteProtection.accessMode,
      password: settings.siteProtection.password,
      countdown: settings.siteProtection.countdown,
      title: settings.siteProtection.title,
      message: settings.siteProtection.message,
      countdownLabel: settings.siteProtection.countdownLabel,
      passwordLabel: settings.siteProtection.passwordLabel,
      redirectPage: settings.siteProtection.redirectPage,
      mediaType: settings.siteProtection.mediaType,
      backgroundImage: settings.siteProtection.backgroundImage,
      backgroundVideo: settings.siteProtection.backgroundVideo,
      overlayOpacity: settings.siteProtection.overlayOpacity,
      colorScheme: settings.siteProtection.colorScheme,
    };

    console.log('🔙 Reverting settings to legacy object format...');

    // Update settings back to legacy object
    await client
      .patch(settings._id)
      .set({ siteProtection: legacyProtection })
      .commit();

    console.log(`   ✓ Reverted settings document: ${settings._id}`);

    console.log('🗑️  Deleting migrated protectionConfig document...');

    // Delete the migrated protectionConfig document
    await client.delete(protectionConfigId);
    console.log(`   ✓ Deleted protectionConfig document: ${protectionConfigId}`);

    console.log('✅ Rollback completed successfully!');

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

// Handle script execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const shouldRollback = args.includes('--rollback');

  const operation = shouldRollback ? rollbackSiteProtectionMigration() : migrateSiteProtection();

  operation
    .then(() => {
      const action = shouldRollback ? 'Rollback' : 'Migration';
      console.log(`🎉 ${action} script completed successfully!`);
      process.exit(0);
    })
    .catch((error) => {
      const action = shouldRollback ? 'Rollback' : 'Migration';
      console.error(`💥 ${action} script failed:`, error);
      process.exit(1);
    });
}

export {migrateSiteProtection, rollbackSiteProtectionMigration};