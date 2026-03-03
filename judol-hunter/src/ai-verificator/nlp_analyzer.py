"""
NLP Analyzer for gambling text detection
"""

import os
import re
import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class NLPAnalyzer:
    def __init__(self):
        self.gambling_keywords = {
            'slot': ['slot', 'gacor', 'jackpot', 'spinning', 'slot88', 'pragmatic'],
            'casino': ['casino', 'roulette', 'blackjack', 'baccarat', 'sicbo'],
            'poker': ['poker', 'domino', 'bandarq', 'aduq', 'capsa'],
            'togel': ['togel', 'toto', '4d', '3d', '2d', 'colok bebas'],
            'sports': ['sportsbook', 'sbobet', 'maxbet', 'ibcbet'],
            'payment': ['deposit', 'withdraw', 'transfer', 'pulsa', 'dana', 'ovo', 'gopay'],
            'promo': ['bonus', 'cashback', 'new member', 'referral', 'komisi']
        }
    
    async def analyze(self, html_content: str) -> Dict[str, Any]:
        text = self._extract_text(html_content)
        result = self._rule_based_analysis(text)
        return result
    
    def _extract_text(self, html: str) -> str:
        html = re.sub(r'<script.*?>.*?</script>', '', html, flags=re.DOTALL)
        html = re.sub(r'<style.*?>.*?</style>', '', html, flags=re.DOTALL)
        html = re.sub(r'<.*?>', ' ', html)
        html = re.sub(r'\s+', ' ', html)
        return html.strip().lower()
    
    def _rule_based_analysis(self, text: str) -> Dict[str, Any]:
        keywords_found = []
        total_weight = 0
        max_possible = 0
        
        for category, keywords in self.gambling_keywords.items():
            category_weight = 1.0
            for keyword in keywords:
                max_possible += category_weight
                if keyword in text:
                    keywords_found.append({
                        'keyword': keyword,
                        'category': category,
                        'weight': category_weight
                    })
                    total_weight += category_weight
        
        score = min(100, (total_weight / max(1, max_possible)) * 100)
        confidence = min(100, len(keywords_found) * 10)
        
        return {
            'score': score,
            'confidence': confidence,
            'keywords_found': keywords_found,
            'keyword_count': len(keywords_found)
        }