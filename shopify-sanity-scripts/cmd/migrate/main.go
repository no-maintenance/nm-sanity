package main

import (
	"fmt"
	"log"
	"time"

	shopify "github.com/therealchrisrock/go-shopify-graphql"
	shopifyhelper "github.com/therealchrisrock/shopify-sanity-scripts/internal/shopify"
)

// ConcurrencyConfig holds configuration for concurrent processing
type ConcurrencyConfig struct {
	MaxWorkers int           // Number of concurrent workers
	RateLimit  time.Duration // Delay between API calls per worker
	BatchSize  int           // Number of products to process in each batch
}

func main() {
	client, err := shopifyhelper.NewShopifyClient(nil)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Fetching all products from Shopify...")

	// Fetch all products using GraphQL
	allProducts, err := client.Product.ListAll()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Successfully fetched %d total products\n", len(allProducts))

	// Process filtered products here
	for i, product := range allProducts {
		fmt.Printf("%d. Product: %s (ID: %s)\n", i+1, product.Title, product.ID)
	}
}

// ProductResult holds a product and whether it has the required metafield
type ProductResult struct {
	Product     *shopify.Product
	WorkerID    int
	ProcessTime time.Duration
}

// // filterProductsWithMetafieldConcurrent filters products using concurrent metafield checks
// func filterProductsWithMetafieldConcurrent(client *shopify.Client, products []*shopify.Product, namespaceKey string, config ConcurrencyConfig) []*shopify.Product {
// 	// Create channels for work distribution and results
// 	productChan := make(chan *shopify.Product, len(products))
// 	resultChan := make(chan ProductResult, len(products))

// 	// Start worker goroutines
// 	var wg sync.WaitGroup
// 	for i := 0; i < config.MaxWorkers; i++ {
// 		wg.Add(1)
// 		go func(workerID int) {
// 			defer wg.Done()
// 			processedCount := 0

// 			for product := range productChan {
// 				start := time.Now()
// 				processingTime := time.Since(start)

// 				resultChan <- ProductResult{
// 					Product:      product,
// 					WorkerID:     workerID,
// 					ProcessTime:  processingTime,
// 				}

// 				processedCount++

// 				// Rate limiting - delay between API calls
// 				if processedCount > 0 && config.RateLimit > 0 {
// 					time.Sleep(config.RateLimit)
// 				}
// 			}

// 			fmt.Printf("[Worker %d] Completed processing %d products\n", workerID, processedCount)
// 		}(i)
// 	}

// 	// Send all products to workers
// 	go func() {
// 		for _, product := range products {
// 			productChan <- product
// 		}
// 		close(productChan)
// 	}()

// 	// Wait for workers to complete and close result channel
// 	go func() {
// 		wg.Wait()
// 		close(resultChan)
// 	}()

// 	// Collect results and maintain order
// 	var filteredProducts []*shopify.Product
// 	processedCount := 0
// 	totalProcessingTime := time.Duration(0)

// 	for result := range resultChan {
// 		if result.HasMetafield {
// 			filteredProducts = append(filteredProducts, result.Product)
// 		}
// 		processedCount++
// 		totalProcessingTime += result.ProcessTime

// 		// Progress indicator
// 		if processedCount%10 == 0 {
// 			fmt.Printf("Progress: %d/%d products processed\n", processedCount, len(products))
// 		}
// 	}

// 	avgProcessingTime := totalProcessingTime / time.Duration(processedCount)
// 	fmt.Printf("Average processing time per product: %v\n", avgProcessingTime)

// 	return filteredProducts
// }

// fetchAllProducts fetches all products using GraphQL ListAll method
func fetchAllProducts(client *shopify.Client) ([]*shopify.Product, error) {
	fmt.Println("Using GraphQL to fetch all products...")

	// The GraphQL client provides a ListAll method that handles pagination automatically
	products, err := client.Product.ListAll()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch products: %v", err)
	}

	fmt.Printf("GraphQL ListAll returned %d products\n", len(products))
	return products, nil
}

// // hasMetafield checks if a product has a specific metafield using GraphQL
// func hasMetafield(client *shopify.Client, productID graphql.ID, namespaceKey string) bool {
// 	// Parse namespace.key format (e.g., "product_tab.details")
// 	parts := strings.Split(namespaceKey, ".")
// 	if len(parts) != 2 {
// 		fmt.Printf("Invalid namespace.key format: %s (expected 'namespace.key')\n", namespaceKey)
// 		return false
// 	}
// 	namespace := parts[0]
// 	key := parts[1]

// 	// Get the product with metafields using GraphQL
// 	product, err := client.Product.Get(productID)
// 	if err != nil {
// 		fmt.Printf("Error fetching product %s: %v\n", productID, err)
// 		return false
// 	}

// 	// Check if the product has metafields
// 	if len(product.Metafields) == 0 {
// 		return false
// 	}

// 	// Check if any metafield matches our criteria and has non-empty value
// 	for _, metafield := range product.Metafields {
// 		if string(metafield.Namespace) == namespace &&
// 			string(metafield.Key) == key &&
// 			string(metafield.Value) != "" {
// 			return true
// 		}
// 	}

// 	return false
// }
