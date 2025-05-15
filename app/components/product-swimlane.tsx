import {ProductCard} from '~/components/product/product-card';
import {Heading, Section} from '~/components/primatives/text';
import type {ApiAllProductsQuery} from 'types/shopify/storefrontapi.generated';
import {cn} from '~/lib/utils';

type ProductSwimlaneProps = ApiAllProductsQuery & {
  title?: string;
  count?: number;
};

export function ProductSwimlane({
  title,
  products,
  count = 12,
  ...props
}: ProductSwimlaneProps) {
  return (
    <Section padding="y" {...props}>
      {title && (
        <div className="container pb-4">
          <Heading size="lead" >
            {title}
          </Heading>
        </div>
      )}
      <div className="snap-x swimlane hiddenScroll md:scroll-px-8 lg:scroll-px-8 px-4 md:px-6 lg:px-8 xl:px-10">
        {products.nodes.map((product, idx) => (
          <div className="snap-start w-80 min-w-80" key={product.id}>
            <ProductCard
              product={product}
              columns={{
                desktop: 5,
                mobile: 1
              }}
              className="h-full"
            />
          </div>
        ))}
      </div>
    </Section>
  );
}

export function ProductSwimlaneLoading({
  count = 12,
  ...props
}: {count?: number} & React.ComponentProps<typeof Section>) {
  return (
    <Section padding="y" {...props}>
      <div className="snap-x swimlane hiddenScroll md:scroll-px-8 lg:scroll-px-8 px-4 md:px-6 lg:px-8 xl:px-10">
        {Array(count)
          .fill(null)
          .map((_, i) => (
            <div
              key={i}
              className="snap-start w-80 min-w-80 aspect-[4/5] bg-neutral-100 animate-pulse"
            />
          ))}
      </div>
    </Section>
  );
}
