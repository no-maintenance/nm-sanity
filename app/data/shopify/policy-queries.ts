export const SHOP_POLICIES_QUERY = `#graphql
  query ShopPolicies(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy {
        id
        title
        body
        handle
        url
      }
      shippingPolicy {
        id
        title
        body
        handle
        url
      }
      refundPolicy {
        id
        title
        body
        handle
        url
      }
      termsOfService {
        id
        title
        body
        handle
        url
      }
      subscriptionPolicy {
        id
        title
        body
        handle
        url
      }
    }
  }
` as const;

// We can't query a policy by handle directly - so we'll fetch all policies
// and filter them on the client side based on the policy type
export const SHOP_POLICY_BY_TYPE_QUERY = `#graphql
  query ShopPolicies(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy {
        id
        title
        body
        handle
        url
      }
      shippingPolicy {
        id
        title
        body
        handle
        url
      }
      refundPolicy {
        id
        title
        body
        handle
        url
      }
      termsOfService {
        id
        title
        body
        handle
        url
      }
      subscriptionPolicy {
        id
        title
        body
        handle
        url
      }
    }
  }
` as const;
