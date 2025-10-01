import {createClient} from '@sanity/client';
import * as fs from 'fs';
import * as path from 'path';

// Load .env file manually
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

console.log('Environment check:');
console.log('- Project ID:', process.env.PUBLIC_SANITY_STUDIO_PROJECT_ID || '(not set)');
console.log('- Dataset:', process.env.PUBLIC_SANITY_STUDIO_DATASET || '(not set)');
console.log('- Token:', process.env.SANITY_STUDIO_TOKEN ? '(set)' : '(not set)');
console.log();

const client = createClient({
  projectId: process.env.PUBLIC_SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.PUBLIC_SANITY_STUDIO_DATASET!,
  token: process.env.SANITY_STUDIO_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function queryColorSchemes() {
  console.log('\n=== Querying all Color Scheme documents ===\n');

  const query = `*[_type == "colorScheme"] | order(default desc, _createdAt desc) {
    _id,
    _type,
    _createdAt,
    name,
    default,
    background {
      hex,
      rgb
    },
    foreground {
      hex,
      rgb
    },
    primary {
      hex,
      rgb
    },
    primaryForeground {
      hex,
      rgb
    },
    card {
      hex,
      rgb
    },
    cardForeground {
      hex,
      rgb
    },
    border {
      hex,
      rgb
    }
  }`;

  try {
    const colorSchemes = await client.fetch(query);

    console.log(`Found ${colorSchemes.length} color scheme(s):\n`);

    colorSchemes.forEach((scheme: any, index: number) => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Color Scheme #${index + 1}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`Name: ${scheme.name || '(unnamed)'}`);
      console.log(`ID: ${scheme._id}`);
      console.log(`Default: ${scheme.default ? '✓ YES' : '✗ No'}`);
      console.log(`Created: ${new Date(scheme._createdAt).toLocaleString()}`);
      console.log();
      console.log('Colors:');
      console.log(`  Background:       ${scheme.background?.hex || 'not set'} (rgb: ${scheme.background?.rgb?.r}, ${scheme.background?.rgb?.g}, ${scheme.background?.rgb?.b})`);
      console.log(`  Foreground:       ${scheme.foreground?.hex || 'not set'} (rgb: ${scheme.foreground?.rgb?.r}, ${scheme.foreground?.rgb?.g}, ${scheme.foreground?.rgb?.b})`);
      console.log(`  Primary:          ${scheme.primary?.hex || 'not set'} (rgb: ${scheme.primary?.rgb?.r}, ${scheme.primary?.rgb?.g}, ${scheme.primary?.rgb?.b})`);
      console.log(`  Primary FG:       ${scheme.primaryForeground?.hex || 'not set'} (rgb: ${scheme.primaryForeground?.rgb?.r}, ${scheme.primaryForeground?.rgb?.g}, ${scheme.primaryForeground?.rgb?.b})`);
      console.log(`  Card:             ${scheme.card?.hex || 'not set'} (rgb: ${scheme.card?.rgb?.r}, ${scheme.card?.rgb?.g}, ${scheme.card?.rgb?.b})`);
      console.log(`  Card Foreground:  ${scheme.cardForeground?.hex || 'not set'} (rgb: ${scheme.cardForeground?.rgb?.r}, ${scheme.cardForeground?.rgb?.g}, ${scheme.cardForeground?.rgb?.b})`);
      console.log(`  Border:           ${scheme.border?.hex || 'not set'} (rgb: ${scheme.border?.rgb?.r}, ${scheme.border?.rgb?.g}, ${scheme.border?.rgb?.b})`);
    });

    console.log(`\n${'='.repeat(60)}\n`);
  } catch (error) {
    console.error('Error fetching color schemes:', error);
    process.exit(1);
  }
}

queryColorSchemes();
