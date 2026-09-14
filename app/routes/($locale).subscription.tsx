import type {MetaFunction} from '@remix-run/react';
import {SignupExperience} from '~/components/signup/signup-experience';

// Branded subscription landing at /subscription. Same moving-background signup
// experience as /signup (parallax 3D logo, Klaviyo list), but rendered inside
// the normal site layout — it keeps the announcement bar, header, and footer.
// `embedded` makes the signup a full-height in-page section rather than a fixed
// full-viewport overlay, so the site chrome stays visible above it.
export const meta: MetaFunction = () => {
  return [{title: 'Subscribe | No Maintenance'}];
};

export default function Subscription() {
  return <SignupExperience embedded />;
}
