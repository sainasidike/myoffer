import os
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any
import time

class TwitterClient:
    """Twitter API v2 client"""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('TWITTER_API_KEY')
        self.base_url = 'https://api.twitter.com/2'
        self.headers = {
            'Authorization': f'Bearer {self.api_key}'
        }

    def fetch_products(self, days: int = 7) -> List[Dict[str, Any]]:
        """Search tweets for AI products in last N days"""
        if not self.api_key:
            print("WARNING: No Twitter API key, returning empty list")
            return []

        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%dT00:00:00Z')

        # Search for AI product-related hashtags
        queries = [
            '#AIProduct',
            '#BuildInPublic AI',
            '#AI tool launch'
        ]

        all_products = {}  # Use dict to deduplicate by URL

        for query in queries:
            try:
                response = requests.get(
                    f'{self.base_url}/tweets/search/recent',
                    params={
                        'query': query,
                        'start_time': start_date,
                        'max_results': 30,
                        'tweet.fields': 'created_at,public_metrics,entities'
                    },
                    headers=self.headers,
                    timeout=30
                )

                if response.status_code == 429:  # Rate limit
                    print("WARNING: Twitter rate limit hit, waiting...")
                    time.sleep(60)
                    continue

                response.raise_for_status()
                data = response.json()

                for tweet in data.get('data', []):
                    # Extract URLs from tweet
                    urls = []
                    if 'entities' in tweet and 'urls' in tweet['entities']:
                        urls = [u['expanded_url'] for u in tweet['entities']['urls']]

                    if not urls:
                        continue

                    url = urls[0]  # Use first URL as identifier

                    if url not in all_products:
                        all_products[url] = {
                            'id': f"tw_{tweet['id']}",
                            'name': '',  # Will be enriched later
                            'tagline': tweet['text'][:100],
                            'tags': [],
                            'sources': {
                                'twitter': {
                                    'mentions': 0,
                                    'sentiment': 0.5,  # Neutral default
                                    'sample_tweets': []
                                }
                            }
                        }

                    # Aggregate metrics
                    metrics = tweet.get('public_metrics', {})
                    all_products[url]['sources']['twitter']['mentions'] += (
                        metrics.get('like_count', 0) +
                        metrics.get('retweet_count', 0)
                    )

                time.sleep(1)  # Rate limit protection

            except Exception as e:
                print(f"ERROR fetching Twitter data for query '{query}': {e}")
                continue

        return list(all_products.values())
