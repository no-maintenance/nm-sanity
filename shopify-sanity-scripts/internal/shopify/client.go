package shopify

import (
	"fmt"
	"os"

	shopify "github.com/therealchrisrock/go-shopify-graphql"
	"github.com/therealchrisrock/shopify-sanity-scripts/internal/config"
)

func NewShopifyClient(cfg *config.Config) (*shopify.Client, error) {
	var env *config.Config
	var err error
	if cfg != nil {
		env = cfg
	} else {
		env, err = config.LoadConfig()
		if err != nil {
			return nil, err
		}
	}

	fmt.Printf("Debug: Shop Name: %s\n", env.ShopifyShopName)
	fmt.Printf("Debug: Access Token: %s\n", env.ShopifyAccessToken[:8]+"...")

	// Create GraphQL client using NewDefaultClient or custom options
	if os.Getenv("STORE_NAME") != "" && os.Getenv("STORE_PASSWORD") != "" {
		// Use environment variables if available (matches the GraphQL library's expectations)
		client := shopify.NewDefaultClient()
		return client, nil
	}

	// Use custom client with our config
	client := shopify.NewClient(env.ShopifyApiKey, env.ShopifyAccessToken, env.ShopifyShopName)

	return client, nil
}
