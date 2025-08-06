import type {LoaderFunctionArgs, MetaFunction} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';

import {SanityImage} from '~/components/sanity/sanity-image';
import {BLOG_POSTS_QUERY} from '~/data/sanity/blog';

const DEFAULT_LOCALE = {
  language: 'EN',
  country: 'US',
};

export const meta: MetaFunction = () => [
  {title: 'Editorials'},
  {name: 'description', content: 'Explore our latest editorial content and fashion stories.'},
];

export async function loader({context}: LoaderFunctionArgs) {
  const {locale, sanity} = context;
  const language = locale?.language.toLowerCase();

  const queryParams = {
    defaultLanguage: DEFAULT_LOCALE.language.toLowerCase(),
    language,
  };

  const editorials = await sanity.loadQuery(
    BLOG_POSTS_QUERY,
    queryParams,
  );

  return {
    editorials,
  };
}

export default function EditorialsIndex() {
  const {editorials: {data}} = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="my-16 px-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Editorials</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Explore our latest editorial content, fashion stories, and creative collaborations.
          </p>
        </div>
      </header>

      {/* Editorial Grid */}
      <main className="px-4 pb-16">
        <div className="mx-auto max-w-7xl">
          {data && data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.map((editorial: any) => (
                <Link
                  key={editorial._id}
                  to={`/editorials/${editorial.slug}`}
                  className="group block"
                >
                  <article className="space-y-4">
                    {/* Featured Image */}
                    {editorial.featuredImage && (
                      <div className="aspect-[4/3] overflow-hidden rounded-lg">
                        <SanityImage
                          data={editorial.featuredImage}
                          alt={editorial.featuredImage.alt || editorial.title || 'Editorial'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="space-y-2">
                      {/* Season */}
                      {editorial.season && (
                        <div className="text-xs font-medium text-gray-600">
                          {editorial.season}
                        </div>
                      )}
                      
                      {/* Title */}
                      <h2 className="text-xl font-bold group-hover:text-gray-600 transition-colors">
                        {editorial.title}
                      </h2>
                      
                      {/* Location */}
                      {editorial.location && (
                        <div className="text-sm text-gray-500">
                          {editorial.location}
                        </div>
                      )}
                      
                      {/* Excerpt */}
                      {editorial.excerpt && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {editorial.excerpt}
                        </p>
                      )}
                      
                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        {editorial.publishedAt && (
                          <time dateTime={editorial.publishedAt}>
                            {new Date(editorial.publishedAt).toLocaleDateString()}
                          </time>
                        )}
                        
                        {editorial.categories && editorial.categories.length > 0 && (
                          <div className="flex gap-1">
                            {editorial.categories.slice(0, 2).map((category: any) => (
                              <span
                                key={category._id}
                                className="px-2 py-1 bg-gray-100 rounded-full"
                                style={
                                  category.color?.hex
                                    ? {
                                        backgroundColor: `${category.color.hex}20`,
                                        color: category.color.hex,
                                      }
                                    : undefined
                                }
                              >
                                {category.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold text-gray-400 mb-4">No editorials yet</h2>
              <p className="text-gray-600">Check back soon for new editorial content.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}