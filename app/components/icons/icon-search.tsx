import type {IconProps} from '.';

import {Icon} from '.';

export function IconSearch(props: IconProps) {
  return (
    <Icon {...props} viewBox="0 0 24 24" fill="transparent">
      <title>Search</title>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35"
      ></path>
    </Icon>
  );
}
