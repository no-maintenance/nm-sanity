import type {Anchor} from 'types/sanity/sanity.generated';

import {Link} from '@remix-run/react';
import {stegaClean} from '@sanity/client/stega';

import {cn} from '~/lib/utils';
import {useRootLoaderData} from '~/root';

type Slug = null | {
  _type: 'slug';
  current?: null | string;
};

type SanityInternalLinkDataProps = {
  _key: null | string;
  _type: 'internalLink';
  anchor?: Anchor | null;
  link?:
    | null
    | {
        documentType: 'blogPost';
        slug: Slug;
      }
    | {
        documentType: 'collection';
        slug: Slug;
      }
    | {
        documentType: 'home';
        slug: Slug;
      }
    | {
        documentType: 'page';
        slug: Slug;
      }
    | {
        documentType: 'product';
        slug: Slug;
      }
    | {
        documentType: 'storePolicy';
        slug: Slug;
      };
  name: null | string;
};

export function SanityInternalLink(props: {
  children?: React.ReactNode;
  className?: string;
  data?: SanityInternalLinkDataProps;
  id?: string;
  onClick?: () => void;
  reloadDocument?: boolean;
}) {
  const {locale} = useRootLoaderData();
  const {children, className, data, id} = props;

  if (!data) return null;

  const {link, name} = data;

  const documentType = link?.documentType;
  const slug = link?.slug?.current;
  const anchor = data.anchor ? `#${data.anchor}` : '';

  const path: () => string = () => {
    switch (documentType) {
      case 'blogPost':
        return `${locale.pathPrefix}/blog/${slug}`;
      case 'collection':
        return `${locale.pathPrefix}/collections/${slug}`;
      case 'home':
        return locale.pathPrefix || '/';
      case 'page':
        return `${locale.pathPrefix}/${slug}`;
      case 'product':
        return `${locale.pathPrefix}/products/${slug}`;
      case 'storePolicy':
        return `${locale.pathPrefix}/policies/${slug}`;
      default:
        return '';
    }
  };

  // Remove encode stega data from url
  const url = stegaClean(`${path()}${anchor}`);

  // Collection→collection client navigation hangs under v3_singleFetch, so
  // force a full document load for collection links (and anywhere the caller
  // explicitly opts in). This matches the collection category bar.
  const reloadDocument = props.reloadDocument || documentType === 'collection';

  // Todo: add Navlink support
  return (
    <Link
      className={cn([documentType,
        'focus-visible:ring-ring focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden',
        className,
      ])}
      id={id}
      onClick={props.onClick}
      prefetch={reloadDocument ? 'none' : 'intent'}
      reloadDocument={reloadDocument}
      to={url}
    >
      {children ? children : name}
    </Link>
  );
}
