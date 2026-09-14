import type {MetaFunction} from '@remix-run/react';
import {SignupExperience} from '~/components/signup/signup-experience';

// Branded account/newsletter signup landing. Renders full-bleed over a slowly
// drifting background image (see MinimalLayout wiring in root.tsx). Existing
// customers can hand off to Shopify's hosted sign-in via the "Sign In" link.
export const meta: MetaFunction = () => {
  return [{title: 'Sign Up | No Maintenance'}];
};

export default function Signup() {
  return <SignupExperience />;
}
