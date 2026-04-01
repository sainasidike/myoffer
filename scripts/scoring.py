from typing import Dict, Any, List

AI_KEYWORDS = [
    'ai', 'ml', 'llm', 'gpt', 'claude', 'machine learning',
    'deep learning', 'neural network', 'artificial intelligence'
]

def calculate_hotness_score(sources: Dict[str, Any]) -> float:
    """Calculate cross-platform hotness score (0-40 points)"""
    ph_score = 0
    tw_score = 0
    rd_score = 0

    if 'productHunt' in sources and sources['productHunt']:
        ph_score = min(sources['productHunt'].get('upvotes', 0) / 10, 40)

    if 'twitter' in sources and sources['twitter']:
        tw_score = min(sources['twitter'].get('mentions', 0) / 50, 30)

    if 'reddit' in sources and sources['reddit']:
        rd_score = min(sources['reddit'].get('upvotes', 0) / 20, 30)

    # Normalize to 0-40
    total = ph_score + tw_score + rd_score
    return min(total / 2.5, 40)

def calculate_ai_relevance(product: Dict[str, Any]) -> float:
    """Calculate AI relevance score (0-20 points)"""
    score = 0
    text = (
        product.get('name', '') + ' ' +
        product.get('tagline', '') + ' ' +
        ' '.join(product.get('tags', []))
    ).lower()

    for keyword in AI_KEYWORDS:
        if keyword in text:
            score += 5

    return min(score, 20)

def calculate_discussion_quality(sources: Dict[str, Any]) -> float:
    """Calculate discussion quality score (0-15 points)"""
    depth_score = 0
    sentiment_score = 0

    if 'reddit' in sources and sources['reddit']:
        avg_length = sources['reddit'].get('avg_comment_length', 0)
        depth_score = min(avg_length / 50, 7)

    if 'twitter' in sources and sources['twitter']:
        sentiment = sources['twitter'].get('sentiment', 0)
        sentiment_score = sentiment * 8

    return depth_score + sentiment_score

def calculate_composite_score(product: Dict[str, Any]) -> int:
    """
    Calculate composite score (0-100 points)
    Formula: (hotness × 0.4) + (novelty × 0.25) + (ai_relevance × 0.2) + (discussion × 0.15)
    """
    sources = product.get('sources', {})

    hotness = calculate_hotness_score(sources)
    novelty = product.get('novelty_score', 0)  # From Claude API
    ai_relevance = calculate_ai_relevance(product)
    discussion = calculate_discussion_quality(sources)

    composite = (
        hotness * 0.4 +
        novelty * 0.25 +
        ai_relevance * 0.2 +
        discussion * 0.15
    )

    return int(round(composite))
