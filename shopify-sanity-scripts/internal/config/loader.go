package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	SanityAccessToken  string `env:"SANITY_ACCESS_TOKEN"`
	SanityProjectId    string `env:"SANITY_PROJECT_ID"`
	SanityDataset      string `env:"SANITY_DATASET"`
	SanityApiVersion   string `env:"SANITY_API_VERSION"`
	SanityApiUrl       string `env:"SANITY_API_URL"`
	SanityApiKey       string `env:"SANITY_API_KEY"`
	ShopifyApiKey      string `env:"SHOPIFY_ADMIN_API_KEY"`
	ShopifyApiSecret   string `env:"SHOPIFY_ADMIN_API_SECRET"`
	ShopifyAccessToken string `env:"SHOPIFY_ADMIN_ACCESS_TOKEN"`
	ShopifyShopName    string `env:"SHOPIFY_SHOP_NAME"`
}

func LoadConfig() (*Config, error) {
	// Try to load parent .env file first (ignore errors if file doesn't exist or has parsing issues)
	_ = godotenv.Load("../.env")

	// Load local .env file (this one should succeed)
	if err := godotenv.Load(".env"); err != nil {
		return nil, err
	}

	cfg := &Config{
		SanityAccessToken:  os.Getenv("SANITY_ACCESS_TOKEN"),
		SanityProjectId:    os.Getenv("SANITY_PROJECT_ID"),
		SanityDataset:      os.Getenv("SANITY_DATASET"),
		SanityApiVersion:   os.Getenv("SANITY_API_VERSION"),
		SanityApiUrl:       os.Getenv("SANITY_API_URL"),
		SanityApiKey:       os.Getenv("SANITY_API_KEY"),
		ShopifyApiKey:      os.Getenv("SHOPIFY_ADMIN_API_KEY"),
		ShopifyApiSecret:   os.Getenv("SHOPIFY_ADMIN_API_SECRET"),
		ShopifyAccessToken: os.Getenv("SHOPIFY_ADMIN_ACCESS_TOKEN"),
		ShopifyShopName:    os.Getenv("SHOPIFY_SHOP_NAME"),
	}

	return cfg, nil
}
