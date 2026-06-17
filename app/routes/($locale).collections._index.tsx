import {type LoaderFunctionArgs, redirect} from '@shopify/remix-oxygen';

/**
 * The collections index page is retired — redirect /collections (and any
 * localized /<locale>/collections) to that locale's homepage.
 */
export async function loader({context}: LoaderFunctionArgs) {
  const {locale} = context;
  return redirect(locale.default ? '/' : locale.pathPrefix);
}
