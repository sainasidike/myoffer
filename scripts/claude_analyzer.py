import os
import json
from typing import Dict, Any
from anthropic import Anthropic

class ClaudeAnalyzer:
    """Claude API integration for product analysis"""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('CLAUDE_API_KEY')
        self.client = Anthropic(api_key=self.api_key) if self.api_key else None

    def analyze_product(self, product: Dict[str, Any]) -> Dict[str, Any]:
        """Generate deep analysis for a product using Claude API"""
        if not self.client:
            print("WARNING: No Claude API key, returning template analysis")
            return self._template_analysis()

        prompt = f"""分析这个AI产品，提供以下维度的深度调研：

产品名称：{product.get('name', 'Unknown')}
简介：{product.get('tagline', 'No description')}
标签：{', '.join(product.get('tags', []))}
Product Hunt投票：{product.get('sources', {}).get('productHunt', {}).get('upvotes', 0)}

请提供JSON格式的分析，包含以下字段：
1. problem: 解决的核心痛点（1句话）
2. target_users: 目标用户群体（简短描述）
3. core_value: 核心价值主张（1句话）
4. tech_stack: 推测的技术栈（逗号分隔）
5. user_reviews_summary: 用户评价总结（1句话）
6. user_sentiment: 用户情感分数（0-1之间的小数）
7. market_position: 市场定位分析（1句话）
8. competitors: 主要竞品列表（数组，2-3个）
9. risks: 潜在风险列表（数组，2-3个）
10. insights: 可借鉴的设计亮点（数组，2-3个）
11. novelty_score: 创新程度评分（0-25的整数）

只返回JSON，不要其他解释。"""

        try:
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            # Parse JSON from response
            content = response.content[0].text
            # Extract JSON if wrapped in markdown
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                content = content.split('```')[1].split('```')[0].strip()

            analysis = json.loads(content)
            return analysis

        except Exception as e:
            print(f"ERROR analyzing product with Claude API: {e}")
            return self._template_analysis()

    def _template_analysis(self) -> Dict[str, Any]:
        """Return template analysis when API fails"""
        return {
            'problem': '提升工作效率，降低操作成本',
            'target_users': 'AI 爱好者、开发者、创业者',
            'core_value': 'AI 驱动的自动化解决方案',
            'tech_stack': 'AI, Machine Learning',
            'user_reviews_summary': '用户反馈积极，期待更多功能',
            'user_sentiment': 0.7,
            'market_position': '面向中小企业和个人用户',
            'competitors': ['类似产品A', '类似产品B'],
            'risks': ['市场竞争激烈', '技术迭代快'],
            'insights': ['产品设计简洁', '用户体验流畅'],
            'novelty_score': 15
        }
