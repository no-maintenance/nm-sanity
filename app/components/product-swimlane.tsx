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
        <Heading size="lead" className={cn('px-gutter pb-gutter')}>
          {title}
        </Heading>
      )}
      <div className="swimlane hiddenScroll md:scroll-px-8 lg:scroll-px-8 px-4 md:px-6 lg:px-8 xl:px-10">
        {products.nodes.map((product, idx) => (
          <ProductCard
            product={product}
            key={product.id}
            className="snap-start w-80"
          />
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
      <div className="swimlane hiddenScroll md:scroll-px-8 lg:scroll-px-8 px-4 md:px-6 lg:px-8 xl:px-10">
        {Array(count)
          .fill(null)
          .map((_, i) => (
            <div
              key={i}
              className="snap-start w-80 aspect-[4/5] bg-neutral-100 animate-pulse"
            />
          ))}
      </div>
    </Section>
  );
}
