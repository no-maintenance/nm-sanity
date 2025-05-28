import type {PortableTextComponents} from '@portabletext/react';
import type {SectionDefaultProps, SectionOfType} from 'types';

import {PortableText} from '@portabletext/react';
import {useMemo} from 'react';

import type {ButtonBlockProps} from '../sanity/richtext/components/button-block';
import type {ExternalLinkAnnotationProps} from '../sanity/richtext/components/external-link-annotation';
import type {ImageBlockProps} from '../sanity/richtext/components/image-block';
import type {InternalLinkAnnotationProps} from '../sanity/richtext/components/internal-link-annotation';
import type {ShopifyAccordionBlockProps} from '../blocks/shopify-accordion-block';
import type {CarouselBlockProps} from '../sanity/richtext/components/carousel-block';
import type {TwoColumnBlockProps} from '../sanity/richtext/components/two-column-block';

import {ButtonBlock} from '../sanity/richtext/components/button-block';
import {ExternalLinkAnnotation} from '../sanity/richtext/components/external-link-annotation';
import {ImageBlock} from '../sanity/richtext/components/image-block';
import {InternalLinkAnnotation} from '../sanity/richtext/components/internal-link-annotation';
import {RichtextLayout} from '../sanity/richtext/rich-text-layout';
import {FormBlock} from '~/components/sanity/richtext/components/form-block';
import {ShopifyAccordionBlock} from '../blocks/shopify-accordion-block';
import {CarouselBlock} from '../sanity/richtext/components/carousel-block';
import {TwoColumnBlock} from '../sanity/richtext/components/two-column-block';

type RichtextSectionProps = SectionOfType<'richtextSection'>;

export function RichtextSection(
  props: SectionDefaultProps & {data: RichtextSectionProps},
) {
  const {data} = props;
  const containerMaxWidth = data.maxWidth;

  const components = useMemo(
    () => ({
      marks: {
        externalLink: (props: {
          children: React.ReactNode;
          value: ExternalLinkAnnotationProps;
        }) => {
          return (
            <ExternalLinkAnnotation {...props.value}>
              {props.children}
            </ExternalLinkAnnotation>
          );
        },
        internalLink: (props: {
          children: React.ReactNode;
          value: InternalLinkAnnotationProps;
        }) => {
          return (
            <InternalLinkAnnotation {...props.value}>
              {props.children}
            </InternalLinkAnnotation>
          );
        },
      },
      types: {
        button: (props: {value: ButtonBlockProps}) => (
          <ButtonBlock {...props.value} />
        ),
        image: (props: {value: ImageBlockProps}) => (
          <ImageBlock containerMaxWidth={containerMaxWidth} {...props.value} />
        ),
        form: (props: {value: {formType: 'newsletter' | 'contact' | 'appointment'; title?: string; description?: string}}) => (
          <FormBlock {...props.value} />
        ),
        carousel: (props: {value: CarouselBlockProps}) => (
          <CarouselBlock {...props.value} />
        ),
        twoColumnBlock: (props: {value: TwoColumnBlockProps}) => (
          <TwoColumnBlock {...props.value} />
        ),
        shopifyAccordion: (props: {value: ShopifyAccordionBlockProps}) => (
          <ShopifyAccordionBlock {...props.value} />
        ),
      },
    }),
    [containerMaxWidth],
  );

  return (
    <section className="">
      <div className="mx-auto container">
        <RichtextLayout
          contentAligment={props.data.contentAlignment}
          desktopContentPosition={props.data.desktopContentPosition}
          maxWidth={containerMaxWidth}
        >
          {data.richtext && (
            <PortableText
              components={components as PortableTextComponents}
              value={data.richtext}
            />
          )}
        </RichtextLayout>
      </div>
    </section>
  );
}
