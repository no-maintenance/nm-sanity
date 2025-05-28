import type {PortableTextComponents} from '@portabletext/react';
import type {SectionOfType} from 'types';

import {PortableText} from '@portabletext/react';
import {useMemo} from 'react';

import {cn} from '~/lib/utils';
import {SanityImage} from '../../sanity-image';
import {RichtextLayout} from '../rich-text-layout';
import {ButtonBlock} from './button-block';
import {FormBlock} from './form-block';
import {CarouselBlock} from './carousel-block';
import {ExternalLinkAnnotation} from './external-link-annotation';
import {InternalLinkAnnotation} from './internal-link-annotation';

export type TwoColumnBlockProps = NonNullable<
  SectionOfType<'richtextSection'>['richtext']
>[number] & {
  _type: 'twoColumnBlock';
};

export function TwoColumnBlock(props: TwoColumnBlockProps) {
  const {
    layout = 'equal',
    verticalAlignment = 'center',
    gap = 'medium',
    leftColumn,
    rightColumn,
  } = props;

  // Grid column classes based on layout
  const getLayoutClasses = () => {
    switch (layout) {
      case 'content-focus':
        return 'lg:grid-cols-[3fr_2fr]';
      case 'media-focus':
        return 'lg:grid-cols-[2fr_3fr]';
      case 'heavy-content':
        return 'lg:grid-cols-[7fr_3fr]';
      case 'heavy-media':
        return 'lg:grid-cols-[3fr_7fr]';
      default:
        return 'lg:grid-cols-2';
    }
  };

  // Gap classes
  const getGapClasses = () => {
    switch (gap) {
      case 'small':
        return 'gap-4 lg:gap-6';
      case 'large':
        return 'gap-8 lg:gap-12';
      default:
        return 'gap-6 lg:gap-8';
    }
  };

  // Vertical alignment classes
  const getAlignmentClasses = () => {
    switch (verticalAlignment) {
      case 'top':
        return 'justify-start';
      case 'bottom':
        return 'justify-end';
      default:
        return 'justify-center';
    }
  };

  // Portable Text components for nested richtext
  const portableTextComponents = useMemo(
    () => ({
      marks: {
        externalLink: (props: {
          children: React.ReactNode;
          value: any;
        }) => (
          <ExternalLinkAnnotation {...props.value}>
            {props.children}
          </ExternalLinkAnnotation>
        ),
        internalLink: (props: {
          children: React.ReactNode;
          value: any;
        }) => (
          <InternalLinkAnnotation {...props.value}>
            {props.children}
          </InternalLinkAnnotation>
        ),
      },
      types: {
        button: (props: {value: any}) => <ButtonBlock {...props.value} />,
        image: (props: {value: any}) => (
          <SanityImage
            data={props.value}
            className="w-full h-auto rounded-lg"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        ),
        form: (props: {value: any}) => <FormBlock {...props.value} />,
      },
    }),
    [],
  );

  const renderColumnContent = (column: any) => {
    if (!column || !column.contentType) return null;

    switch (column.contentType) {
      case 'richtext':
        return column.richtext ? (
          <RichtextLayout maxWidth={700} desktopContentPosition="center">
            <PortableText
              value={column.richtext}
              components={portableTextComponents as PortableTextComponents}
            />
          </RichtextLayout>
        ) : null;

      case 'image':
        return column.image ? (
          <div className="w-full">
            <SanityImage
              data={column.image}
              className="w-full h-auto "
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        ) : null;

      case 'carousel':
        return column.carousel ? (
          <CarouselBlock {...column.carousel} _type="carousel" />
        ) : null;

      case 'form':
        return column.form ? (
          <FormBlock {...column.form} />
        ) : null;

      case 'buttons':
        return column.buttons ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {column.buttons.map((button: any, index: number) => (
              <ButtonBlock key={button._key || index} {...button} />
            ))}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div
      className={cn([
        'grid grid-cols-1 items-stretch',
        getLayoutClasses(),
        getGapClasses(),
        'w-full',
      ])}
    >
      <div className={cn([
        'w-full flex flex-col h-full',
        getAlignmentClasses(),
      ])}>
        {renderColumnContent(leftColumn)}
      </div>
      <div className={cn([
        'w-full flex flex-col h-full',
        getAlignmentClasses(),
      ])}>
        {renderColumnContent(rightColumn)}
      </div>
    </div>
  );
} 