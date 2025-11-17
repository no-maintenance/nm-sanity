import type {ROOT_QUERYResult} from 'types/sanity/sanity.generated';

import {useCallback} from 'react';

import {cn} from '~/lib/utils';

import {SanityExternalLink} from '../sanity/link/sanity-external-link';
import {SanityInternalLink} from '../sanity/link/sanity-internal-link';
import {
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '../ui/navigation-menu';

type NestedNavigationType = NonNullable<
  NonNullable<ROOT_QUERYResult['header']>['menu']
>[number] & {
  _type: 'nestedNavigation';
};

export type SanityNestedNavigationProps = NestedNavigationType;

function isSaleItem(name: string | null | undefined): boolean {
  return name?.toLowerCase().trim() === 'sale';
}

export function NestedNavigation(props: {
  data?: SanityNestedNavigationProps;
  setActiveItem: (item: string) => void;
}) {
  const {data, setActiveItem} = props;

  const handleOpen = useCallback(() => {
    setActiveItem(data?._key || '');
  }, [data, setActiveItem]);

  if (!data) return null;

  const {childLinks} = data;

  return data.name && childLinks && childLinks.length > 0 ? (
    <>
      <NavigationMenuTrigger 
        onClick={handleOpen} 
        onMouseEnter={handleOpen}
        className={isSaleItem(data.name) ? 'text-red-500' : undefined}
      >
        {data.link ? (
          <SanityInternalLink
            className={isSaleItem(data.name) ? 'text-red-500' : undefined}
            data={{
              _key: null,
              _type: 'internalLink',
              anchor: null,
              link: data.link,
              name: null,
            }}
          >
            {data.name}
          </SanityInternalLink>
        ) : (
          data.name
        )}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="m-0 grid w-full gap-1 p-2 lg:w-[var(--dropdown-width)]">
          {childLinks.map((child) => (
            <li key={child._key}>
              <ListItem {...child} />
            </li>
          ))}
        </ul>
      </NavigationMenuContent>
    </>
  ) : data.link && data.name && (!childLinks || childLinks.length === 0) ? (
    // Render internal link if no child links
    <SanityInternalLink
      className={cn(
        navigationMenuTriggerStyle(),
        isSaleItem(data.name) && 'text-red-500'
      )}
      data={{
        _key: data._key,
        _type: 'internalLink',
        anchor: null,
        link: data.link,
        name: data.name,
      }}
    >
      {data.name}
    </SanityInternalLink>
  ) : null;
}

function ListItem(
  props: NonNullable<NestedNavigationType['childLinks']>[number],
) {
  return (
    <NavigationMenuLink asChild>
      <div>
        {props._type === 'internalLink' ? (
          <SanityInternalLink
            className={cn(
              navigationMenuTriggerStyle(),
              'hover:bg-accent w-full justify-start rounded-xs',
              isSaleItem(props.name) && 'text-red-500'
            )}
            data={props}
          />
        ) : props._type === 'externalLink' ? (
          <SanityExternalLink
            className={cn(
              navigationMenuTriggerStyle(),
              'hover:bg-accent w-full justify-start rounded-xs',
              isSaleItem(props.name) && 'text-red-500'
            )}
            data={props}
          />
        ) : null}
      </div>
    </NavigationMenuLink>
  );
}
