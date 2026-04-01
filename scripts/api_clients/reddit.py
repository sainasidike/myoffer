import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any
import time

class RedditClient:
    """Reddit JSON API client (no auth required)"""

    def __init__(self):
        self.base_url = 'https://www.reddit.com'
        self.headers = {
            'User-Agent': 'AI-Inspiration-Bot/1.0'
        }
        self.subreddits = ['SideProject', 'artificial', 'MachineLearning']

    def fetch_products(self, days: int = 7) -> List[Dict[str, Any]]:
        """Fetch AI product posts from relevant subreddits"""
        all_products = []
        cutoff_timestamp = (datetime.now() - timedelta(days=days)).timestamp()

        for subreddit in self.subreddits:
            try:
                response = requests.get(
                    f'{self.base_url}/r/{subreddit}/hot.json',
                    params={'limit': 50},
                    headers=self.headers,
                    timeout=30
                )
                response.raise_for_status()
                data = response.json()

                for post in data.get('data', {}).get('children', []):
                    post_data = post['data']

                    # Filter by date
                    if post_data['created_utc'] < cutoff_timestamp:
                        continue

                    # Filter AI-related posts
                    title = post_data['title'].lower()
                    selftext = post_data.get('selftext', '').lower()
                    if not any(kw in title + selftext for kw in ['ai', 'ml', 'machine learning', 'llm', 'gpt']):
                        continue

                    all_products.append({
                        'id': f"rd_{post_data['id']}",
                        'name': post_data['title'][:100],
                        'tagline': post_data.get('selftext', '')[:200],
                        'tags': [],
                        'sources': {
                            'reddit': {
                                'upvotes': post_data['ups'],
                                'comments': post_data['num_comments'],
                                'subreddits': [subreddit],
                                'avg_comment_length': 100  # Placeholder, would need comment API
                            }
                        }
                    })

                time.sleep(2)  # Rate limit protection

            except Exception as e:
                print(f"ERROR fetching Reddit data for r/{subreddit}: {e}")
                continue

        return all_products
