import type {SectionOfType} from 'types';
import type {Product as ProductType} from '@shopify/hydrogen-react/storefront-api-types';

import {PortableText} from '@portabletext/react';
import type {PortableTextBlock, PortableTextMarkComponentProps} from '@portabletext/react';
import {useProduct} from '@shopify/hydrogen-react';
import {DEFAULT_LOCALE} from 'countries';

import {portableTextMarks} from '../sanity/richtext/components/portableTextMarks';
import {ExternalLinkAnnotation} from '../sanity/richtext/components/external-link-annotation';
import {InternalLinkAnnotation} from '../sanity/richtext/components/internal-link-annotation';
import {useRootLoaderData} from '~/root';

// TODO: Find a better place for this type, perhaps types/sanity.d.ts
type InternationalizedArrayRichtextValue = {
  _key: string;
  _type: 'internationalizedArrayRichtextValue';
  locale?: string;
  value: PortableTextBlock[];
};

type InternationalizedArrayRichtext = InternationalizedArrayRichtextValue[];

interface ProductWithExtraInformation extends ProductType {
  extraProductInformation?: InternationalizedArrayRichtext;
}

export type ProductDetailsBlockProps = NonNullable<
  SectionOfType<'productInformationSection'>['richtext']
>[number] & {
  _type: 'productDetails';
};

export function ProductDetailsBlock(props: ProductDetailsBlockProps) {
  const {product} = useProduct();
  const rootData = useRootLoaderData();
  const extraProductInformation = (product as ProductWithExtraInformation)?.extraProductInformation;
  const currentLocale = rootData?.locale?.language?.toLowerCase();
  const defaultLocale = DEFAULT_LOCALE.language.toLowerCase();

  const localizedContent =
    extraProductInformation?.find(
      (item) => item.locale === currentLocale || item._key === currentLocale,
    ) ||
    extraProductInformation?.find(
      (item) => item.locale === defaultLocale || item._key === defaultLocale,
    ) ||
    extraProductInformation?.[0];

  if (!product || !localizedContent?.value?.length) {
    return null;
  }

  return (
    <div className="py-2 prose max-w-none [&_p]:mt-0 [&_a]:text-primary touch:[&_a]:active:underline notouch:[&_a]:hover:underline [&_a]:underline-offset-4">
      <PortableText 
        value={localizedContent.value} 
        components={{
          marks: {
            ...portableTextMarks,
            externalLink: (props: PortableTextMarkComponentProps<any>) => {
              return (
                <ExternalLinkAnnotation {...props.value}>
                  {props.children}
                </ExternalLinkAnnotation>
              );
            },
            internalLink: (props: PortableTextMarkComponentProps<any>) => {
              return (
                <InternalLinkAnnotation {...props.value}>
                  {props.children}
                </InternalLinkAnnotation>
              );
            },
          },
        }} 
      />
    </div>
  );
} 
