import type {SectionOfType} from 'types';
import type {Product as ProductType} from '@shopify/hydrogen-react/storefront-api-types';

import {PortableText} from '@portabletext/react';
import type {PortableTextBlock, PortableTextMarkComponentProps} from '@portabletext/react';
import {useProduct} from '@shopify/hydrogen-react';

import {portableTextMarks} from '../sanity/richtext/components/portableTextMarks';
import {ExternalLinkAnnotation} from '../sanity/richtext/components/external-link-annotation';
import {InternalLinkAnnotation} from '../sanity/richtext/components/internal-link-annotation';

// TODO: Find a better place for this type, perhaps types/sanity.d.ts
type InternationalizedArrayRichtextValue = {
  _key: string;
  _type: 'internationalizedArrayRichtextValue';
  locale: string;
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
  const extraProductInformation = (product as ProductWithExtraInformation)?.extraProductInformation;
   
  if (!product || !extraProductInformation?.[0]?.value) {
    return null;
  }

  return (
    <div className="py-2 prose max-w-none [&_p]:mt-0 [&_a]:text-primary touch:[&_a]:active:underline notouch:[&_a]:hover:underline [&_a]:underline-offset-4">
      <PortableText 
        value={extraProductInformation[0].value} 
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