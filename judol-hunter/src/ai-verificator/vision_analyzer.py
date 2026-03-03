"""
Vision Analyzer for gambling image detection
"""

import os
import cv2
import numpy as np
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class VisionAnalyzer:
    def __init__(self):
        self.gambling_elements = [
            'slot_machine', 'roulette_wheel', 'playing_card',
            'dice', 'poker_chip', 'casino_logo', 'jackpot_counter'
        ]
    
    async def analyze(self, image_path: str) -> Dict[str, Any]:
        if not os.path.exists(image_path):
            return {'score': 0, 'error': 'Image not found', 'elements_found': []}
        
        image = cv2.imread(image_path)
        if image is None:
            return {'score': 0, 'error': 'Failed to read image', 'elements_found': []}
        
        result = self._opencv_analysis(image)
        score = self._calculate_score(result)
        
        return {
            'score': score,
            'confidence': result.get('confidence', 0),
            'elements_found': result.get('elements', []),
            'element_count': len(result.get('elements', [])),
            'image_dimensions': f"{image.shape[1]}x{image.shape[0]}"
        }
    
    def _opencv_analysis(self, image: np.ndarray) -> Dict[str, Any]:
        elements = []
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        height, width = image.shape[:2]
        
        red_mask = cv2.inRange(image, (0, 0, 100), (50, 50, 255))
        red_pixels = cv2.countNonZero(red_mask)
        red_ratio = red_pixels / (width * height)
        
        if red_ratio > 0.3:
            elements.append({
                'element': 'casino_color_scheme',
                'confidence': red_ratio * 100,
                'method': 'color_analysis'
            })
        
        return {
            'elements': elements,
            'confidence': sum(e.get('confidence', 0) for e in elements) / max(1, len(elements)),
            'method': 'opencv'
        }
    
    def _calculate_score(self, analysis_result: Dict[str, Any]) -> float:
        elements = analysis_result.get('elements', [])
        if not elements:
            return 0
        base_score = min(50, len(elements) * 10)
        confidence_score = analysis_result.get('confidence', 0)
        final_score = base_score + (confidence_score * 0.5)
        return min(100, final_score)