import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict


def load_json(file_path: str) -> Dict[str, Any]:
    """Load JSON data from file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(data: Dict[str, Any], file_path: str) -> None:
    """Save data to JSON file"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def days_since(date_string: str) -> int:
    """Calculate days since a date string (YYYY-MM-DD format)"""
    past_date = datetime.strptime(date_string, '%Y-%m-%d')
    now = datetime.now()
    delta = now - past_date
    return delta.days
