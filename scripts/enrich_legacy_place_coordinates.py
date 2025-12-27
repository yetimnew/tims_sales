import json
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

BASE_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "react-starter-kit-geocoder/1.0 (contact: ops@react-starter-kit.local)"
REQUEST_DELAY_SECONDS = 1.1
DATA_DIR = Path(__file__).resolve().parents[1] / "database" / "seeders" / "data"
CACHE_PATH = DATA_DIR / "geocode_cache.json"


@dataclass(frozen=True)
class GeoQuery:
    query: str
    scope: str


def load_json(path: Path) -> List[Dict[str, object]]:
    if not path.exists():
        raise FileNotFoundError(f"Missing data file: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_name(value: Optional[object]) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    text = text.replace("/", " ")
    text = text.replace("-", " ")
    text = " ".join(part for part in text.split() if part)
    if not text:
        return None
    return text.title()


def build_geocode_queries(name: str, *, zone: Optional[str], region: Optional[str]) -> Iterable[GeoQuery]:
    cleaned_zone = zone if zone else None
    cleaned_region = region if region else None
    base_variants = [name]

    if cleaned_zone:
        base_variants.append(f"{name}, {cleaned_zone} Zone")
    if cleaned_region:
        base_variants.append(f"{name}, {cleaned_region} Region")
    if cleaned_zone and cleaned_region:
        base_variants.append(f"{name}, {cleaned_zone} Zone, {cleaned_region} Region")

    for variant in base_variants:
        yield GeoQuery(query=f"{variant}, Ethiopia", scope="with-context")

    if cleaned_zone:
        yield GeoQuery(query=f"{cleaned_zone} Zone, Ethiopia", scope="zone-fallback")
    if cleaned_region:
        yield GeoQuery(query=f"{cleaned_region} Region, Ethiopia", scope="region-fallback")


def geocode(query: GeoQuery, cache: Dict[str, Tuple[float, float]]) -> Optional[Tuple[float, float]]:
    if query.query in cache:
        return cache[query.query]

    params = urllib.parse.urlencode(
        {
            "q": query.query,
            "format": "json",
            "limit": "1",
            "countrycodes": "et",
        }
    )
    url = f"{BASE_URL}?{params}"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        print(f"[error] {exc} while fetching {query.query!r}")
        return None

    time.sleep(REQUEST_DELAY_SECONDS)

    if not payload:
        print(f"[miss] no result for {query.query!r} ({query.scope})")
        return None

    result = payload[0]
    try:
        latitude = float(result["lat"])
        longitude = float(result["lon"])
    except (KeyError, TypeError, ValueError):
        print(f"[miss] invalid payload for {query.query!r} ({query.scope})")
        return None

    cache[query.query] = (latitude, longitude)
    print(f"[hit] {query.query!r} -> ({latitude}, {longitude})")
    return latitude, longitude


def persist_cache(cache: Dict[str, Tuple[float, float]]) -> None:
    serializable = {key: {"lat": lat, "lon": lon} for key, (lat, lon) in cache.items()}
    CACHE_PATH.write_text(json.dumps(serializable, indent=2, sort_keys=True), encoding="utf-8")


def load_cache() -> Dict[str, Tuple[float, float]]:
    if not CACHE_PATH.exists():
        return {}

    raw = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    cache: Dict[str, Tuple[float, float]] = {}
    for key, value in raw.items():
        try:
            cache[key] = (float(value["lat"]), float(value["lon"]))
        except (KeyError, TypeError, ValueError):
            continue
    return cache


def enrich_places() -> None:
    places = load_json(DATA_DIR / "legacy_places.json")
    woredas = {int(item["legacy_id"]): item for item in load_json(DATA_DIR / "legacy_woredas.json")}
    zones = {int(item["legacy_id"]): item for item in load_json(DATA_DIR / "legacy_zones.json")}
    regions = {int(item["legacy_id"]): item for item in load_json(DATA_DIR / "legacy_regions.json")}

    zone_to_region = {
        legacy_id: regions.get(int(item["region_legacy_id"]))
        for legacy_id, item in zones.items()
        if item.get("region_legacy_id") is not None
    }

    cache = load_cache()
    updated = 0
    missing = 0

    woreda_coordinates: Dict[int, Tuple[float, float]] = {}

    for woreda_id, woreda in woredas.items():
        name = normalize_name(woreda.get("name"))
        if not name:
            continue

        zone = zones.get(int(woreda.get("zone_legacy_id") or 0))
        zone_name = normalize_name(zone.get("name")) if zone else None
        region = None
        if zone:
            region = zone_to_region.get(int(zone.get("legacy_id")))
        region_name = normalize_name(region.get("name")) if region else None

        coordinate: Optional[Tuple[float, float]] = None

        for query in build_geocode_queries(name, zone=zone_name, region=region_name):
            coordinate = geocode(query, cache)
            if coordinate:
                break

        if coordinate is None and region_name:
            coordinate = geocode(
                GeoQuery(query=f"{region_name}, Ethiopia", scope="region-direct"),
                cache,
            )

        if coordinate:
            woreda_coordinates[woreda_id] = coordinate
        else:
            missing += 1
            print(f"[warn] no coordinates resolved for woreda {woreda_id} ({name})")
            continue

        if updated % 25 == 0:
            persist_cache(cache)
        updated += 1

    persist_cache(cache)

    print(f"Resolved coordinates for {len(woreda_coordinates)} woredas. Missing {missing}.")

    zone_coordinates: Dict[int, Tuple[float, float]] = {}
    for zone_id, zone in zones.items():
        name = normalize_name(zone.get("name"))
        if not name:
            continue

        region = zone_to_region.get(zone_id)
        region_name = normalize_name(region.get("name")) if region else None

        coordinate: Optional[Tuple[float, float]] = None

        direct_queries: List[GeoQuery] = [
            GeoQuery(query=f"{name} Zone, Ethiopia", scope="zone-direct"),
        ]

        if region_name:
            direct_queries.append(
                GeoQuery(
                    query=f"{name} Zone, {region_name} Region, Ethiopia",
                    scope="zone-region",
                )
            )

        for query in direct_queries:
            coordinate = geocode(query, cache)
            if coordinate:
                break

        if not coordinate and region_name:
            coordinate = geocode(
                GeoQuery(query=f"{region_name} Region, Ethiopia", scope="zone-region-fallback"),
                cache,
            )

        if coordinate:
            zone_coordinates[zone_id] = coordinate

    region_coordinates: Dict[int, Tuple[float, float]] = {}
    for region_id, region in regions.items():
        name = normalize_name(region.get("name"))
        if not name:
            continue

        coordinate = geocode(
            GeoQuery(query=f"{name} Region, Ethiopia", scope="region-direct"),
            cache,
        )

        if coordinate:
            region_coordinates[region_id] = coordinate

    persist_cache(cache)

    enriched: List[Dict[str, object]] = []
    fallback_missing = 0

    for place in places:
        woreda_id_raw = place.get("woreda_legacy_id")
        woreda_id = int(woreda_id_raw) if woreda_id_raw not in (None, "") else None
        latitude = None
        longitude = None
        resolved = False

        if woreda_id and woreda_id in woreda_coordinates:
            latitude, longitude = woreda_coordinates[woreda_id]
            resolved = True
        elif woreda_id:
            zone_id_raw = woredas.get(woreda_id, {}).get("zone_legacy_id")
            zone_id = int(zone_id_raw) if zone_id_raw not in (None, "") else None

            if zone_id and zone_id in zone_coordinates:
                latitude, longitude = zone_coordinates[zone_id]
                resolved = True
            else:
                region = None
                if zone_id and zone_id in zone_to_region:
                    region = zone_to_region[zone_id]

                region_id = int(region.get("legacy_id")) if region else None

                if region_id and region_id in region_coordinates:
                    latitude, longitude = region_coordinates[region_id]
                    resolved = True

        enriched_place = {
            "legacy_id": place.get("legacy_id"),
            "name": place.get("name"),
            "woreda_legacy_id": woreda_id_raw,
            "comment": place.get("comment"),
            "status": place.get("status"),
            "latitude": round(latitude, 6) if latitude is not None else None,
            "longitude": round(longitude, 6) if longitude is not None else None,
        }
        enriched.append(enriched_place)

        if not resolved:
            fallback_missing += 1

    if fallback_missing:
        print(f"[warn] {fallback_missing} places are still missing coordinates")

    DATA_DIR.joinpath("legacy_places.json").write_text(
        json.dumps(enriched, indent=2),
        encoding="utf-8",
    )
    print("legacy_places.json updated with coordinates")


if __name__ == "__main__":
    enrich_places()
