import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';

// Branded entry point for account creation / sign-in.
// Shopify's New Customer Accounts uses a single passwordless (email code)
// flow for both signing up and logging in, so this mirrors /account/login
// and simply hands off to Shopify's hosted authentication page.
export async function loader({context}: LoaderFunctionArgs) {
  return context.customerAccount.login();
}
