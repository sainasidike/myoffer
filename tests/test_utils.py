import json
import tempfile
from pathlib import Path
from scripts.utils import load_json, save_json, days_since


def test_load_json_success():
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
        json.dump({'test': 'data'}, f)
        temp_path = f.name

    result = load_json(temp_path)
    assert result == {'test': 'data'}
    Path(temp_path).unlink()


def test_save_json_success():
    with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as f:
        temp_path = f.name

    data = {'test': 'data'}
    save_json(data, temp_path)

    with open(temp_path, 'r') as f:
        result = json.load(f)

    assert result == data
    Path(temp_path).unlink()


def test_days_since():
    from datetime import datetime, timedelta
    past_date = (datetime.now() - timedelta(days=5)).strftime('%Y-%m-%d')
    assert days_since(past_date) == 5
