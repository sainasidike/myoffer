import os
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any

class ProductHuntClient:
    """Product Hunt GraphQL API client"""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('PRODUCTHUNT_API_KEY')
        self.base_url = 'https://api.producthunt.com/v2/api/graphql'
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

    def fetch_products(self, days: int = 7) -> List[Dict[str, Any]]:
        """Fetch products from last N days"""
        if not self.api_key:
            print("WARNING: No Product Hunt API key, returning empty list")
            return []

        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

        query = """
        query($postedAfter: DateTime!) {
          posts(postedAfter: $postedAfter, first: 50) {
            edges {
              node {
                id
                name
                tagline
                votesCount
                commentsCount
                createdAt
                url
                topics {
                  edges {
                    node {
                      name
                    }
                  }
                }
              }
            }
          }
        }
        """

        try:
            response = requests.post(
                self.base_url,
                json={
                    'query': query,
                    'variables': {'postedAfter': f'{start_date}T00:00:00Z'}
                },
                headers=self.headers,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()

            products = []
            for edge in data.get('data', {}).get('posts', {}).get('edges', []):
                node = edge['node']
                products.append({
                    'id': f"ph_{node['id']}",
                    'name': node['name'],
                    'tagline': node['tagline'],
                    'tags': [t['node']['name'] for t in node.get('topics', {}).get('edges', [])],
                    'sources': {
                        'productHunt': {
                            'url': node['url'],
                            'upvotes': node['votesCount'],
                            'comments': node['commentsCount'],
                            'launched_at': node['createdAt'],
                            'tags': [t['node']['name'] for t in node.get('topics', {}).get('edges', [])]
                        }
                    }
                })

            return products

        except Exception as e:
            print(f"ERROR fetching Product Hunt data: {e}")
            return []
