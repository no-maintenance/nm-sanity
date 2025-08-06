#!/usr/bin/env ts-node
// ts-node shebang allows running this TypeScript file directly without explicit ts-node command
import {getCliClient} from 'sanity/cli';
import {DEFAULT_LOCALE} from 'countries';

// Replace with your actual Sanity Studio base URL if different
const SANITY_STUDIO_BASE_URL = 'https://nomaintenance.us/cms';

const client = getCliClient();

interface ProductSummary {
  _id: string;
  store: {
    title: string;
    slug: {current: string};
    status: string;
    tags?: string[];
  };
  sizeChart?: any;
  extraProductInformation?: any;
}

/**
 * Fetch and print all active products that are missing `extraProductInformation`.
 *
 * A product is considered “missing” this field when the field is not defined or
 * its first internationalised value array is empty.
 */
async function listProductsMissingExtraInfo() {
  console.log('🔍 Fetching published (non-draft) products with "NOMAINTENANCE" tag, visible in online store and missing extraProductInformation or sizeChart...');

  const query = `*[
    _type == "product" &&
    !(_id in path('drafts.**')) &&
    store.status == "active" &&
    store.tags match "*NOMAINTENANCE*" && // Filter by NOMAINTENANCE tag using string match
    (!defined(extraProductInformation) || !defined(sizeChart))
  ]{
    _id,
    store {
      title,
      slug,
      status,
      tags, // Keep tags in projection to verify if needed for debugging
    },
    extraProductInformation,
    sizeChart,
  }`;

  try {
    const products: ProductSummary[] = await client.fetch(query);

    if (products.length === 0) {
      console.log('🎉 All active products contain extraProductInformation AND sizeChart!');
      return;
    }
    // Build CSV
    const csvHeader = 'title,url,missing_extra_product_information,missing_size_chart\n';
    const csvRows = products
      .map((p) => {
        const slug = p.store?.slug?.current ?? '';
        // Construct Sanity Studio edit URL
        const urlPath = `${SANITY_STUDIO_BASE_URL}/structure/products;${p._id};${p._id}?perspective=draft`;


        const isMissingExtraProductInformation = !p.extraProductInformation;
        const isMissingSizeChart = !p.sizeChart;

        const missingExtraProductInformation = isMissingExtraProductInformation ? 'Yes' : 'No';
        const missingSizeChart = isMissingSizeChart ? 'Yes' : 'No';

        // Escape double-quotes by doubling them and wrap fields that contain commas
        const esc = (s: string) =>
          s.includes(',') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s;

        return `${esc(p.store.title)},${esc(urlPath)},${esc(missingExtraProductInformation)},${esc(missingSizeChart)}`;
      })
      .join('\n');

    const csvContent = csvHeader + csvRows;

    const outputPath = process.argv[2] ?? 'products-missing-content.csv';
    await import('node:fs/promises').then((fs) =>
      fs.writeFile(outputPath, csvContent, 'utf8'),
    );

    console.log(`⚠️  Found ${products.length} published active product(s) with "NOMAINTENANCE" tag, visible in the online store missing content.`);
    console.log(`📄 CSV written to ${outputPath}`);
  } catch (error) {
    console.error('❌ Failed to fetch products:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  listProductsMissingExtraInfo();
}

export {listProductsMissingExtraInfo}; 