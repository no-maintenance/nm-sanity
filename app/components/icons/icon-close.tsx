import type {IconProps} from '.';

import {Icon} from '.';

export function IconClose(props: IconProps) {
  return (
    <Icon {...props} stroke={props.stroke || 'currentColor'}>
      <title>Close</title>
      <path stroke="#514F4F" d="M11.928 1.044L1 13m13-1.24L1.857 1"></path>
    </Icon>
  );
}
