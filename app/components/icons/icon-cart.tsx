import type {IconProps} from '.';

import {Icon} from '.';

export function IconCart(props: IconProps) {
  return (
    <Icon {...props}
    viewBox = '0 0 24 24'
    fill="transparent"
    >
      <title>Cart</title>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 22a1 1 0 100-2 1 1 0 000 2zM20 22a1 1 0 100-2 1 1 0 000 2zM1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
      ></path>
    </Icon>
  );
}
