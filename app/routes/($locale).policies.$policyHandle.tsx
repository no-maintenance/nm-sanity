import type {LoaderFunctionArgs, MetaFunction} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {DEFAULT_LOCALE} from 'countries';
import {json} from '@shopify/remix-oxygen';

import {CmsSection} from '~/components/cms-section';
import {STORE_POLICY_QUERY} from '~/data/sanity/policies';
import {SHOP_POLICY_BY_TYPE_QUERY} from '~/data/shopify/policy-queries';
import {mergeMeta} from '~/lib/meta';
import {getSeoMetaFromMatches} from '~/lib/seo';
import {seoPayload} from '~/lib/seo.server';

export const meta: MetaFunction<typeof loader> = mergeMeta(({matches}) =>
  getSeoMetaFromMatches(matches),
);

export async function loader({context, params, request}: LoaderFunctionArgs) {
  const {env, locale, sanity, storefront} = context;
  const {policyHandle} = params;
  const language = locale?.language.toLowerCase();

  if (!policyHandle) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    });
  }

  // Load the store policy document from Sanity
  const storePolicy = await sanity.loadQuery(
    STORE_POLICY_QUERY,
    {
      defaultLanguage: DEFAULT_LOCALE.language.toLowerCase(),
      handle: policyHandle,
      language,
    },
  );

  if (!storePolicy.data) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    });
  }

  // Map policy type to Shopify policy handle
  const policyTypes: Record<string, string> = {
    privacyPolicy: 'privacy-policy',
    shippingPolicy: 'shipping-policy',
    refundPolicy: 'refund-policy',
    termsOfService: 'terms-of-service',
    legalNotice: 'legal-notice',
  };

  // Get all Shopify policies
  const {shop} = await storefront.query(SHOP_POLICY_BY_TYPE_QUERY, {
    variables: {
      country: locale.country,
      language: locale.language,
    },
  });

  // Find the matching policy based on the policy type
  let policy;
  
  if (storePolicy.data.policyType === 'privacyPolicy') {
    policy = shop.privacyPolicy;
  } else if (storePolicy.data.policyType === 'shippingPolicy') {
    policy = shop.shippingPolicy;
  } else if (storePolicy.data.policyType === 'refundPolicy') {
    policy = shop.refundPolicy;
  } else if (storePolicy.data.policyType === 'termsOfService') {
    policy = shop.termsOfService;
  } else if (storePolicy.data.policyType === 'legalNotice') {
    // Legal notice might not exist in all Shopify stores
    policy = shop.subscriptionPolicy;
  }

  // If we couldn't find a matching policy, throw a 404
  if (!policy) {
    throw new Response(null, {
      status: 404,
      statusText: 'Policy Not Found',
    });
  }

  // Prepare SEO data
  const seo = seoPayload.policy({
    policy: {
      title: storePolicy.data.title || policy.title,
      body: policy.body,
    },
    url: request.url,
  });

  return json({
    policyHandle,
    policy,
    storePolicy: storePolicy.data,
    seo,
  });
}

export default function PolicyPage() {
  const {policy, storePolicy} = useLoaderData<typeof loader>();

  return (
    <div className="my-16 px-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-normal mb-4">{storePolicy.title || policy.title}</h1>
        
        {/* Additional CMS content before policy */}
        {storePolicy.additionalContent && (
          <div className="mb-8" 
               dangerouslySetInnerHTML={{__html: storePolicy.additionalContent}} />
        )}
        
        {/* Shopify Policy Content */}
        <div className="prose max-w-none mb-16"
             dangerouslySetInnerHTML={{__html: policy.body}} />
             
        {/* Additional CMS sections */}
        {storePolicy.sections && storePolicy.sections.length > 0 && (
          <div className="mt-8">
            {storePolicy.sections.map((section: any, index: number) => (
              <CmsSection data={section} index={index} key={section._key} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
