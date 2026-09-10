from app.utils.geo import haversine_distance


def test_haversine_distance_same_point():
    d = haversine_distance(11.095, 77.300, 11.095, 77.300)
    assert d == 0.0


def test_haversine_distance_known_coordinates():
    # Distance between PHC001 (11.095, 77.300) and H001 (11.1085, 77.3411)
    # Approx 4.7 km
    d = haversine_distance(11.095, 77.300, 11.1085, 77.3411)
    assert 4.0 <= d <= 5.5
