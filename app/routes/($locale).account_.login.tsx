import type {MetaFunction} from '@remix-run/react';
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
} from '@shopify/remix-oxygen';

import {SignupExperience} from '~/components/signup/signup-experience';

// Branded account page: a LOGIN column (email → Shopify's secure/passwordless
// login) beside a CREATE ACCOUNT column (the Klaviyo newsletter form). Renders
// inside the normal site layout (announcement bar + header + footer stay
// visible), same as /subscription. Separate from the /subscription marketing
// page, which is untouched.
export const meta: MetaFunction = () => {
  return [{title: 'Account | No Maintenance'}];
};

// Already-signed-in customers skip straight to their account dashboard.
export async function loader({context}: LoaderFunctionArgs) {
  if (await context.customerAccount.isLoggedIn()) {
    return redirect('/account');
  }
  return null;
}

// The "Sign In" button posts here → Shopify's secure login (Customer Account
// API OAuth). Shopify collects the password on its own page, then redirects
// back through /account/authorize.
export async function action({context}: ActionFunctionArgs) {
  return context.customerAccount.login();
}

export default function AccountLogin() {
  return <SignupExperience variant="account" embedded />;
}
