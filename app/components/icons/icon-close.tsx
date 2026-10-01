import type {IconProps} from '.';

import {Icon} from '.';

export function IconClose(props: IconProps) {
  return (
    <Icon {...props} fill="none" stroke={props.stroke || 'currentColor'}>
      <title>Close</title>
      {/*
        A symmetric X centred in the base Icon's 20x20 viewBox.

        The previous path ("M11.928 1.044L1 13m13-1.24L1.857 1") was drawn for a
        ~14x14 artboard, so inside a 20x20 viewBox it sat off-centre — and its two
        strokes were never symmetric: they ran at 132.4° and -138.5° (rather than
        ±135°) and crossed at two different midpoints, which is what made the X
        look skewed. These two lines share a centre and are exact mirrors.
      */}
      <path d="M4 4 L16 16 M16 4 L4 16" stroke="#514F4F" strokeLinecap="round" />
    </Icon>
  );
}
