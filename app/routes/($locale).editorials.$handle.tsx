import type {LoaderFunctionArgs, MetaFunction} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import invariant from 'tiny-invariant';

import {CmsSection} from '~/components/cms-section';
import {EditorialGridToggle} from '~/components/editorial-grid-toggle';
import {SanityImage} from '~/components/sanity/sanity-image';
import {BLOG_POST_QUERY} from '~/data/sanity/blog';
import {seoPayload} from '~/lib/seo.server';
import {getSeoMetaFromMatches} from '~/lib/seo';

const DEFAULT_LOCALE = {
  language: 'EN',
  country: 'US',
};

export const meta: MetaFunction<typeof loader> = ({matches}) =>
  getSeoMetaFromMatches(matches);

export async function loader({context, params, request}: LoaderFunctionArgs) {
  const {handle} = params;
  const {env, locale, sanity} = context;
  const language = locale?.language.toLowerCase();

  invariant(handle, 'Missing handle param, check route filename');

  const queryParams = {
    defaultLanguage: DEFAULT_LOCALE.language.toLowerCase(),
    handle,
    language,
  };

  const editorial = await sanity.loadQuery(
    BLOG_POST_QUERY,
    queryParams,
  );

  if (!editorial.data) {
    throw new Response('Editorial not found', {status: 404});
  }

  const seo = seoPayload.editorial({
    editorial: editorial.data,
    sanity: {
      dataset: env.PUBLIC_SANITY_STUDIO_DATASET,
      projectId: env.PUBLIC_SANITY_STUDIO_PROJECT_ID,
    },
    url: request.url,
  });

  return {
    editorial,
    seo,
  };
}

export default function Editorial() {
  const {editorial: {data}} = useLoaderData<typeof loader>();
  if (!data) {
    return <div>Editorial not found</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="pt-8 pb-0">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl uppercase">
            {data.title}
          </h1>
          {data.location && (
            <div className="text-sm text-gray-600 uppercase tracking-wide">
              {data.location}
            </div>
          )}
        </div>
        {/* <EditorialGridToggle /> */}
        
        {data.featuredImage && (
          <div className="px-4 md:px-8">
            <SanityImage
              data={data.featuredImage}
              alt={data.featuredImage.alt || data.title || 'Editorial image'}
              className="w-full h-auto"
              sizes="100vw"
            />
          </div>
        )}
      </header>

      {/* Editorial Content Sections */}
      {data.sections && data.sections.length > 0 && (
        <main className="px-4 md:px-8">
          {data.sections.map((section: any, index: number) => (
            <CmsSection data={section} index={index} key={section._key} />
          ))}
        </main>
      )}

      {/* Credits Section */}
      {data.credits && data.credits.length > 0 && (
        <footer className="px-4 md:px-8 ">
          <div className="text-base uppercase space-y-1 text-gray-700">
            {data.credits.map((credit: any, index: number) => (
              <div key={credit._key || `${credit.role}-${credit.name}-${index}`} className="flex justify-center">
                <span className=" font-medium">{credit.role}:</span>
                <span className="ml-2">{credit.name}</span>
              </div>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}

