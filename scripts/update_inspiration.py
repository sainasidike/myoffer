"""
Main script to update AI inspiration library
Orchestrates data fetching, analysis, scoring, and output
"""
import sys
from datetime import datetime
from typing import List, Dict, Any
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.api_clients.producthunt import ProductHuntClient
from scripts.api_clients.twitter import TwitterClient
from scripts.api_clients.reddit import RedditClient
from scripts.claude_analyzer import ClaudeAnalyzer
from scripts.scoring import calculate_composite_score
from scripts.utils import load_json, save_json, days_since

def merge_products(ph_products: List, tw_products: List, rd_products: List) -> List[Dict]:
    """Merge products from multiple platforms, deduplicating by name similarity"""
    merged = {}

    # Primary source: Product Hunt (has best structure)
    for product in ph_products:
        key = product['name'].lower().strip()
        merged[key] = product

    # Merge Twitter data
    for product in tw_products:
        key = product['name'].lower().strip() if product['name'] else product['tagline'][:50].lower()
        if key in merged:
            # Merge sources
            if 'twitter' in product['sources']:
                merged[key]['sources']['twitter'] = product['sources']['twitter']
        else:
            merged[key] = product

    # Merge Reddit data
    for product in rd_products:
        key = product['name'].lower().strip()
        if key in merged:
            if 'reddit' in product['sources']:
                merged[key]['sources']['reddit'] = product['sources']['reddit']
        else:
            merged[key] = product

    return list(merged.values())

def filter_history(products: List[Dict], history: Dict) -> List[Dict]:
    """Filter out products that have already been displayed"""
    displayed_ids = {p['id'] for p in history['displayed_products']}
    return [p for p in products if p['id'] not in displayed_ids]

def main():
    print(f"[{datetime.now()}] Starting AI inspiration library update...")

    # Load history
    history = load_json('inspiration-history.json')

    # Fetch from all platforms (7 days window)
    print("Fetching Product Hunt data...")
    ph_client = ProductHuntClient()
    ph_products = ph_client.fetch_products(days=7)
    print(f"  Found {len(ph_products)} products from Product Hunt")

    print("Fetching Twitter data...")
    tw_client = TwitterClient()
    tw_products = tw_client.fetch_products(days=7)
    print(f"  Found {len(tw_products)} products from Twitter")

    print("Fetching Reddit data...")
    rd_client = RedditClient()
    rd_products = rd_client.fetch_products(days=7)
    print(f"  Found {len(rd_products)} products from Reddit")

    # Merge and deduplicate
    print("Merging products...")
    all_products = merge_products(ph_products, tw_products, rd_products)
    print(f"  Merged to {len(all_products)} unique products")

    # Filter out historical products
    print("Filtering history...")
    new_products = filter_history(all_products, history)
    print(f"  {len(new_products)} new products after history filter")

    # If too few, expand time window
    if len(new_products) < 10:
        print("Too few new products, expanding to 10 days...")
        ph_products = ph_client.fetch_products(days=10)
        tw_products = tw_client.fetch_products(days=10)
        rd_products = rd_client.fetch_products(days=10)
        all_products = merge_products(ph_products, tw_products, rd_products)
        new_products = filter_history(all_products, history)
        print(f"  Now have {len(new_products)} products")

    # Generate AI analysis for each product
    print("Generating AI analysis...")
    analyzer = ClaudeAnalyzer()
    for i, product in enumerate(new_products, 1):
        print(f"  Analyzing {i}/{len(new_products)}: {product['name']}")
        product['analysis'] = analyzer.analyze_product(product)
        product['novelty_score'] = product['analysis'].get('novelty_score', 15)

    # Calculate scores
    print("Calculating composite scores...")
    for product in new_products:
        product['score'] = calculate_composite_score(product)

    # Sort and take top 30
    new_products.sort(key=lambda x: x['score'], reverse=True)
    top_products = new_products[:30]

    print(f"Selected top {len(top_products)} products")

    # Add rank
    for i, product in enumerate(top_products, 1):
        product['rank'] = i
        product['first_seen'] = datetime.now().strftime('%Y-%m-%d')

    # Save output data
    output = {
        'generated_at': datetime.now().isoformat(),
        'count': len(top_products),
        'products': top_products
    }
    save_json(output, 'inspiration-data.json')
    print("Saved inspiration-data.json")

    # Update history
    for product in top_products:
        history['displayed_products'].append({
            'id': product['id'],
            'first_shown': product['first_seen'],
            'score': product['score']
        })

    history['total_products_tracked'] = len(history['displayed_products'])

    # Cleanup old history (90 days) if it's the 1st of month
    if datetime.now().day == 1:
        print("Cleaning up old history...")
        history['displayed_products'] = [
            p for p in history['displayed_products']
            if days_since(p['first_shown']) <= 90
        ]
        history['last_cleanup'] = datetime.now().strftime('%Y-%m-%d')

    save_json(history, 'inspiration-history.json')
    print("Updated inspiration-history.json")

    print(f"[{datetime.now()}] Update complete!")
    print(f"Top 3 products:")
    for product in top_products[:3]:
        print(f"  {product['rank']}. {product['name']} (score: {product['score']})")

if __name__ == '__main__':
    main()
