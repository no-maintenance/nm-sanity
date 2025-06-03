package main

import (
	"fmt"
	"log"
	"os"

	shopify "github.com/therealchrisrock/go-shopify-graphql"
)

func main() {
	// Create GraphQL client using environment variables
	if os.Getenv("STORE_NAME") != "" && os.Getenv("STORE_PASSWORD") != "" {
		client := shopify.NewDefaultClient()

		fmt.Println("Fetching all products from Shopify...")

		// Fetch all products using GraphQL
		allProducts, err := client.Product.ListAll()
		if err != nil {
			log.Fatal(err)
		}

		fmt.Printf("Successfully fetched %d total products\n", len(allProducts))

		// Process products
		for i, product := range allProducts {
			fmt.Printf("%d. Product: %s (ID: %s)\n", i+1, product.Title, product.ID)
		}
	} else {
		log.Fatal("Please set STORE_NAME and STORE_PASSWORD environment variables")
	}
}
