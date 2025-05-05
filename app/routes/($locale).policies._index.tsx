import type {LoaderFunctionArgs, MetaFunction} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import {json} from '@shopify/remix-oxygen';
import {DEFAULT_LOCALE} from 'countries';

import {ALL_STORE_POLICIES_QUERY} from '~/data/sanity/policies';
import {SHOP_POLICIES_QUERY} from '~/data/shopify/policy-queries';
import {mergeMeta} from '~/lib/meta';
import {getSeoMetaFromMatches} from '~/lib/seo';
import {seoPayload} from '~/lib/seo.server';

export const meta: MetaFunction<typeof loader> = mergeMeta(({matches}) =>
  getSeoMetaFromMatches(matches),
);

export async function loader({context, request}: LoaderFunctionArgs) {
  const {locale, sanity, storefront} = context;
  const language = locale?.language.toLowerCase();

  // Get all store policies from Sanity
  const sanityPolicies = await sanity.loadQuery(
    ALL_STORE_POLICIES_QUERY,
    {
      defaultLanguage: DEFAULT_LOCALE.language.toLowerCase(),
      language,
    },
  );

  // Get all policies from Shopify
  const {shop} = await storefront.query(SHOP_POLICIES_QUERY, {
    variables: {
      country: locale.country,
      language: locale.language,
    },
  });

  // Combine Shopify policies into a flat array
  const shopifyPolicies = [
    shop.privacyPolicy,
    shop.shippingPolicy,
    shop.refundPolicy,
    shop.termsOfService,
    shop.subscriptionPolicy,
  ].filter(Boolean);

  // Prepare SEO data
  const seo = seoPayload.policies({
    policies: shopifyPolicies.map(policy => ({
      handle: policy.handle,
      title: policy.title,
    })),
    url: request.url,
  });

  return json({
    sanityPolicies: sanityPolicies.data,
    shopifyPolicies,
    seo,
  });
}

// Types for our policies
type ShopifyPolicy = {
  id: string;
  title: string;
  body: string;
  handle: string;
  url: string;
};

type SanityPolicy = {
  _id: string;
  _type: string;
  policyType?: string;
  title?: string;
  slug?: string;
};

type DisplayPolicy = {
  title: string;
  slug: string;
  isManaged: boolean;
};

export default function PoliciesIndex() {
  const {sanityPolicies, shopifyPolicies} = useLoaderData<typeof loader>();
  
  // Map to directly identify shopify policies by policy type
  const shopifyPolicyMap: Record<string, ShopifyPolicy | undefined> = {};
  
  // Build our policy map from the flattened shopifyPolicies array
  shopifyPolicies.forEach((policy: ShopifyPolicy) => {
    if (policy.handle === 'privacy-policy') shopifyPolicyMap.privacyPolicy = policy;
    if (policy.handle === 'shipping-policy') shopifyPolicyMap.shippingPolicy = policy;
    if (policy.handle === 'refund-policy') shopifyPolicyMap.refundPolicy = policy;
    if (policy.handle === 'terms-of-service') shopifyPolicyMap.termsOfService = policy;
    if (policy.handle === 'subscription-policy') shopifyPolicyMap.legalNotice = policy;
  });

  // Map policy handles for display
  const policyHandleMap: Record<string, string> = {
    'privacy-policy': 'privacyPolicy',
    'shipping-policy': 'shippingPolicy',
    'refund-policy': 'refundPolicy',
    'terms-of-service': 'termsOfService',
    'legal-notice': 'legalNotice',
  };

  // Create a list of all policies to display
  const displayPolicies: DisplayPolicy[] = (sanityPolicies || []).map((policy: SanityPolicy) => {
    // If we have a matching Shopify policy, return the Sanity policy
    if (policy.policyType && shopifyPolicyMap[policy.policyType]) {
      return {
        title: policy.title || shopifyPolicyMap[policy.policyType]?.title || "Policy",
        slug: policy.slug || "",
        isManaged: true
      };
    }
    return null;
  }).filter(Boolean) as DisplayPolicy[];

  // Add any Shopify policies that don't have a matching Sanity policy
  shopifyPolicies.forEach((policy: ShopifyPolicy) => {
    if (!policy) return; // Skip if the policy doesn't exist

    const policyType = policyHandleMap[policy.handle];
    if (!policyType) return; // Skip if we don't recognize this handle

    const matchingSanityPolicy = (sanityPolicies || []).find(
      (sanityPolicy: SanityPolicy) => sanityPolicy.policyType === policyType
    );

    if (!matchingSanityPolicy) {
      displayPolicies.push({
        title: policy.title,
        slug: policy.handle,
        isManaged: false
      });
    }
  });

  return (
    <div className="my-16 px-4">
      <div className="mx-auto max-w-7xl">
        {/* <h1 className="text-4xl font-bold mb-3">Store Policies</h1> */}
        
        <div className="prose max-w-none mb-16">
          {/* <p className="text-lg mb-8">
            Our store policies provide important information about how we operate.
            Please review these policies to understand your rights and obligations
            when using our services.
          </p>
           */}
          <ul className="space-y-4 list-none pl-0">
            {displayPolicies.map((policy: any, index: number) => (
              <li key={index} className="py-3">
                <Link 
                  to={`/policies/${policy.slug}`}
                  className="text-xl uppercase sm:text-5xl font-medium  transition no-underline"
                >
                  {policy.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
