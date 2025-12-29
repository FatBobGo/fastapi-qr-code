def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_generate_qr_code(client):
    payload = {
        "url": "https://example.com",
        "box_size": 10,
        "fill_color": "black",
        "back_color": "white",
    }
    response = client.post("/qr/generate", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert len(response.content) > 0


def test_generate_qr_code_invalid_params(client):
    payload = {
        "url": "https://example.com",
        "box_size": 100,  # Invalid, max is 50
    }
    response = client.post("/qr/generate", json=payload)
    assert response.status_code == 422


def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "<!DOCTYPE html>" in response.text


def test_get_stats(client):
    # Initial stats check
    response = client.get("/stats/")
    assert response.status_code == 200
    initial_count = response.json()["total_qr_generated"]
    assert isinstance(initial_count, int)

    # Generate a QR code
    payload = {"url": "https://stats-test.com", "box_size": 10}
    client.post("/qr/generate", json=payload)

    # Check stats incremented
    response_after = client.get("/stats/")
    assert response_after.json()["total_qr_generated"] == initial_count + 1
