from scripts.scoring import (
    calculate_hotness_score,
    calculate_ai_relevance,
    calculate_discussion_quality,
    calculate_composite_score
)

def test_calculate_hotness_score():
    sources = {
        'productHunt': {'upvotes': 500},
        'twitter': {'mentions': 1000},
        'reddit': {'upvotes': 200}
    }
    score = calculate_hotness_score(sources)
    assert 0 <= score <= 40
    assert score > 20  # Should be reasonably high

def test_calculate_ai_relevance():
    product = {
        'name': 'AI Video Generator',
        'tagline': 'Machine learning powered videos',
        'tags': ['ai', 'ml']
    }
    score = calculate_ai_relevance(product)
    assert score == 15  # 3 keywords found (ai, machine learning, ml) = 15 points

def test_calculate_discussion_quality():
    sources = {
        'reddit': {'avg_comment_length': 250},
        'twitter': {'sentiment': 0.8}
    }
    score = calculate_discussion_quality(sources)
    assert 0 <= score <= 15
    assert score > 10  # Should be high given good inputs

def test_calculate_composite_score():
    product = {
        'name': 'AI Tool',
        'tagline': 'Machine learning tool',
        'tags': ['ai'],
        'sources': {
            'productHunt': {'upvotes': 500},
            'twitter': {'mentions': 1000, 'sentiment': 0.85},
            'reddit': {'upvotes': 200, 'avg_comment_length': 200}
        },
        'novelty_score': 20
    }
    score = calculate_composite_score(product)
    assert 0 <= score <= 100
    assert score >= 15  # Should score reasonably well with good inputs
