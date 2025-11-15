import json
import pytest


@pytest.mark.django_db
def test_recent_sessions_endpoint(client):
    resp = client.get('/api/analytics/recent-sessions/?last=24h&limit=10')
    assert resp.status_code == 200
    data = resp.json()
    assert 'sessions' in data
    assert isinstance(data['sessions'], list)


@pytest.mark.django_db
def test_recent_events_endpoint(client):
    resp = client.get('/api/analytics/recent-events/?last=24h&limit=5')
    assert resp.status_code == 200
    data = resp.json()
    assert 'events' in data
    assert isinstance(data['events'], list)
