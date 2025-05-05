import type {IconProps} from '.';

import {Icon} from '.';

export function IconAccount(props: IconProps) {
  return (
    <Icon
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      {...props}
    >
      <title>Account</title>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
      ></path>
    </Icon>
  );
}
