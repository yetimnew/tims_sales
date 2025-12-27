import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "database" / "seeders" / "data"

PLACES_PATH = DATA_DIR / "legacy_places.json"
WOREDAS_PATH = DATA_DIR / "legacy_woredas.json"
ZONES_PATH = DATA_DIR / "legacy_zones.json"
REGIONS_PATH = DATA_DIR / "legacy_regions.json"
GEOCODE_CACHE_PATH = DATA_DIR / "geocode_cache.json"

ROUNDING_PRECISION = {
    "region": 7,
    "zone": 7,
    "woreda": 7,
    "place": 8,
}

REGION_PRIORITY_NAMES: Dict[str, List[str]] = {
    "CENTAL": ["Addis Ababa, Ethiopia", "Addise Ababa, Ethiopia", "Addis Ababa"],
    "ADDISABEBA": ["Addis Ababa, Ethiopia", "Addise Ababa, Ethiopia", "Addis Ababa"],
    "ADDISE ABABA": ["Addis Ababa, Ethiopia", "Addise Ababa, Ethiopia", "Addis Ababa"],
    "ADDIS ABABA": ["Addis Ababa, Ethiopia", "Addise Ababa, Ethiopia", "Addis Ababa"],
    "AFAR": ["Semera, Ethiopia", "Afar Region, Ethiopia"],
    "AMARA": ["Bahir Dar, Ethiopia", "Amhara Region, Ethiopia"],
    "AMHARA": ["Bahir Dar, Ethiopia", "Amhara Region, Ethiopia"],
    "BENESHANGUL": ["Assosa, Ethiopia", "Benishangul-Gumuz Region, Ethiopia", "Benshangul Gumuz Region, Ethiopia"],
    "BENSHANGUL GUMUZ": ["Assosa, Ethiopia", "Benishangul-Gumuz Region, Ethiopia", "Benshangul Gumuz Region, Ethiopia"],
    "BORENA": ["Yabelo, Ethiopia"],
    "DIREDAWA": ["Dire Dawa, Ethiopia", "Diredawa, Ethiopia"],
    "DJIBOUTI": ["Djibouti"],
    "GAMBYLA": ["Gambela, Ethiopia", "Gambyla, Ethiopia"],
    "HARERI": ["Harar, Ethiopia", "Harari Region, Ethiopia"],
    "OROMIA": ["Adama, Ethiopia", "Oromia Region, Ethiopia"],
    "SIDAMA": ["Hawassa, Ethiopia", "Hawassa C Zone, Ethiopia", "Sidama Region, Ethiopia"],
    "SNNPR": ["Hawassa, Ethiopia", "Hawassa C Zone, Ethiopia", "Southern Nations Nationalities and Peoples Region"],
    "SOMALI": ["Jijiga, Ethiopia", "Somali Region, Ethiopia"],
    "SOUTH WEST": ["Bonga, Ethiopia", "South West Region, Ethiopia", "South West Ethiopia Peoples Region"],
    "TIGRAY": ["Mekelle, Ethiopia", "Tigray Region, Ethiopia"],
}

ZONE_PRIORITY_NAMES: Dict[str, List[str]] = {}

RAW_ZONE_ADMIN_CENTER_OVERRIDES: Dict[str, str] = {
    "A/MENCHI": "Mizan Aman",
    "ADDISE ABABA": "Addis Ababa",
    "AFDER": "Hargele",
    "AFDERA": "Afdera",
    "AFEDIRA": "Afdera",
    "AGNEWAK": "Gambela",
    "ARSI": "Asella",
    "AWSI RASU": "Asayita",
    "BALE": "Robe",
    "BALY": "Robe",
    "BORENA": "Yabelo",
    "BUNA BEDLY": "Bedele",
    "CENTI": "Bonga",
    "CENTIRAL ETHI": "Bonga",
    "CENTRAL GONDER": "Gondar",
    "CENTRAL TIGRAI": "Axum",
    "CENTRAL TIGRAY": "Axum",
    "DUBT": "Semera",
    "E/SHWA": "Adama",
    "E/WOLGA": "Nekemte",
    "EAST GOJAM": "Debre Markos",
    "EASTERN TIGRAY": "Adigrat",
    "FAFAN": "Jijiga",
    "FAFEM": "Jijiga",
    "FANTI RASU": "Teru",
    "FINFINE ZURIA": "Addis Ababa",
    "GABBI RASU": "Awash",
    "GAMO GOFA": "Arba Minch",
    "GOFA": "Sawla",
    "GURAGE": "Welkite",
    "HADIYA": "Hosaena",
    "HARER": "Harar",
    "HARI RASU": "Yallo",
    "HARO GUDERU": "Shambu",
    "HAWI GUDERU": "Shambu",
    "HORO GUDURU": "Shambu",
    "HUMERA": "Humera",
    "ILUBABOR": "Metu",
    "JARAR": "Degehabur",
    "JIMMA": "Jimma",
    "JIMA": "Jimma",
    "KALBATI RASU": "Semera",
    "KEFA & KONTA": "Bonga",
    "KEFFA": "Bonga",
    "KELEM WELLEGA": "Dembidolo",
    "KIBLATI RASU": "Semera",
    "KORAHEY": "Kebri Dehar",
    "LIBEN": "Filtu",
    "MEKELE": "Mekelle",
    "METEKEL": "Gilgel Beles",
    "MITSEBRI": "May Tsebri",
    "NORTH GONDER": "Gondar",
    "NORTH WESTERN TIGRAI": "Shire",
    "NORTH WOLLO": "Woldiya",
    "OMO KURAZ": "Kangaton",
    "OROMIA": "Kemise",
    "RAYA": "Maychew",
    "S/SHWA": "Batu",
    "S/WOLLO": "Dessie",
    "SHAPEL": "Gode",
    "SHEKA": "Masha",
    "SHKA": "Masha",
    "SHINILE": "Shinile",
    "SIDAMA": "Hawassa",
    "SILTIY": "Worabe",
    "SITI": "Shinile",
    "SOUTH GONDER": "Debre Tabor",
    "SOUTH OMO": "Jinka",
    "SOUTH TEGERAYE": "Maychew",
    "SOUTH WEST SHEWA": "Waliso",
    "SOUTH WEST TIGRAY": "May Tsebri",
    "SOUTH WOLLO": "Dessie",
    "W/ARISI": "Shashamane",
    "W/ARSI": "Shashamane",
    "W/GUJI": "Bule Hora",
    "W/HARER": "Chiro",
    "W/SHWA": "Ambo",
    "W/TEGRAYE": "Shire",
    "W/WOLGA": "Gimbi",
    "WAG HEMERA": "Sekota",
    "WEAST WOLEGA": "Gimbi",
    "WEST GOJAM": "Finote Selam",
    "WEST GONDER": "Metema",
    "WOLAYTA": "Sodo",
    "WORETA": "Woreta",
    "YANGUDI RASU": "Weranso",
    "ZONE 1": "Asayita",
    "ZONE 2": "Semera",
    "ZONE 3": "Awash",
    "ZONE 14": "Addis Ababa",
}

WOREDA_PRIORITY_NAMES: Dict[str, List[str]] = {}

RAW_WOREDA_ADMIN_CENTER_OVERRIDES: Dict[str, str] = {}

REGION_ALIAS_CANDIDATES: Dict[str, List[str]] = {
    "Cental": ["Addis Ababa, Ethiopia", "Addise Ababa, Ethiopia"],
    "ADDISABEBA": ["Addis Ababa, Ethiopia", "Addise Ababa, Ethiopia"],
    "Addis Abeba": ["Addis Ababa, Ethiopia", "Addise Ababa, Ethiopia"],
    "ADDISE ABABA": ["Addis Ababa, Ethiopia", "Addise Ababa, Ethiopia"],
    "AFAR": ["Semera, Ethiopia", "Afar Region, Ethiopia"],
    "AMARA": ["Bahir Dar, Ethiopia", "Amhara Region, Ethiopia"],
    "AMHARA": ["Bahir Dar, Ethiopia", "Amhara Region, Ethiopia"],
    "BENESHANGUL": ["Assosa, Ethiopia", "Benishangul-Gumuz Region, Ethiopia", "Benshangul Gumuz Region, Ethiopia"],
    "BENSHANGUL GUMUZ": ["Assosa, Ethiopia", "Benishangul-Gumuz Region, Ethiopia", "Benshangul Gumuz Region, Ethiopia"],
    "BORENA": ["Yabelo, Ethiopia"],
    "DIREDAWA": ["Dire Dawa, Ethiopia", "Diredawa, Ethiopia"],
    "DJIBOUTI": ["Djibouti"],
    "GAMBYLA": ["Gambela, Ethiopia", "Gambyla, Ethiopia"],
    "HARERI": ["Harari Region, Ethiopia", "Harar, Ethiopia"],
    "OROMIA": ["Adama, Ethiopia", "Oromia Region, Ethiopia"],
    "SIDAMA": ["Hawassa, Ethiopia", "Hawassa C Zone, Ethiopia", "Sidama Region, Ethiopia"],
    "SNNPR": ["Hawassa, Ethiopia", "Hawassa C Zone, Ethiopia", "Southern Nations Nationalities and Peoples Region"],
    "SOMALI": ["Jijiga, Ethiopia", "Somali Region, Ethiopia"],
    "SOUTH WEST": ["Bonga, Ethiopia", "South West Region, Ethiopia", "South West Ethiopia Peoples Region"],
    "TIGRAY": ["Mekelle, Ethiopia", "Tigray Region, Ethiopia"],
}

ZONE_ALIAS_CANDIDATES: Dict[str, List[str]] = {
    "W/SHWA": ["West Shewa, Ethiopia"],
    "E/SHWA": ["East Shewa, Ethiopia"],
    "S/SHWA": ["South Shewa, Ethiopia"],
    "W/GUJI": ["West Guji Zone, Ethiopia", "West Guji, Ethiopia"],
    "E/HARERE": ["East Hararghe, Ethiopia", "East Harerge, Ethiopia"],
    "W/ARSI": ["West Arsi, Ethiopia"],
    "W/WOLGA": ["West Wollega, Ethiopia"],
    "E/WOLGA": ["East Wollega, Ethiopia"],
    "S/WEST SHEWA": ["South West Shewa, Ethiopia"],
    "S/GONDAR": ["South Gondar, Ethiopia"],
    "SIDAMA": ["Sidama Zone, Ethiopia", "Hawassa, Ethiopia"],
}

WOREDO_ALIAS_CANDIDATES: Dict[str, List[str]] = {
    "W/SHWA": ["West Shewa, Ethiopia"],
}

EXTRA_FALLBACKS: Dict[str, Tuple[float, float]] = {
    "ethiopia": (9.145, 40.489673),
    "addisababaethiopia": (8.9806, 38.7578),
    "addiseababaethiopia": (8.9806, 38.7578),
    "hawassaethiopia": (7.06205, 38.47635),
    "hawassaczoneethiopia": (7.06205, 38.47635),
    "assosaethiopia": (10.0667, 34.5333),
    "bongaethiopia": (7.2667, 36.2333),
    "southwestregionethiopia": (7.2667, 36.2333),
    "southwestethiopiapeoplesregion": (7.2667, 36.2333),
    "gambelaethiopia": (8.25, 34.5833),
    "jijigaethiopia": (9.3508, 42.7999),
    "mekelleethiopia": (13.4967, 39.4767),
    "diredawaethiopia": (9.5931, 41.8664),
    "semeraethiopia": (11.7207, 41.059),
}


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, payload) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")


def normalize(value: str) -> str:
    return "".join(ch for ch in value.lower() if ch.isalnum())


def normalize_key(value: str) -> str:
    return " ".join(value.upper().split())


def to_title_words(value: str) -> str:
    words = re.split(r"[\s/,-]+", value)
    return " ".join(word.capitalize() for word in words if word)


ZONE_ADMIN_CENTER_OVERRIDES: Dict[str, str] = {
    normalize_key(key): value
    for key, value in RAW_ZONE_ADMIN_CENTER_OVERRIDES.items()
}

for override_key, center in ZONE_ADMIN_CENTER_OVERRIDES.items():
    ZONE_PRIORITY_NAMES[override_key] = [f"{center}, Ethiopia", center]

PLACE_CENTER_KEYWORDS: Tuple[str, ...] = ("capital", "center", "town", "city", "head")

WOREDA_ADMIN_CENTER_OVERRIDES: Dict[str, str] = {
    normalize_key(key): value
    for key, value in RAW_WOREDA_ADMIN_CENTER_OVERRIDES.items()
}

for override_key, center in WOREDA_ADMIN_CENTER_OVERRIDES.items():
    WOREDA_PRIORITY_NAMES[override_key] = [f"{center}, Ethiopia", center]


def build_variants(label: str) -> List[str]:
    cleaned = label.strip()
    if not cleaned:
        return []

    variants: List[str] = []
    variants.append(cleaned)
    variants.append(cleaned.replace("/", " "))
    variants.append(cleaned.replace("-", " "))
    variants.append(cleaned.replace("'", " "))
    variants.append(to_title_words(cleaned))

    if "," in cleaned:
        variants.append(cleaned.split(",", 1)[0].strip())

    stripped_words = re.sub(r"\b(woreda|zone|region|regional|state|city|administration)\b", " ", cleaned, flags=re.IGNORECASE)
    variants.append(stripped_words)

    variants.append(cleaned.lower())
    variants.append(cleaned.upper())

    expanded: List[str] = []
    for item in variants:
        normalized = " ".join(item.split())
        if not normalized:
            continue
        expanded.append(normalized)
        expanded.append(f"{normalized}, Ethiopia")
        expanded.append(f"{normalized} Ethiopia")

    seen: set[str] = set()
    ordered: List[str] = []
    for item in expanded:
        key = normalize(item)
        if not key or key in seen:
            continue
        seen.add(key)
        ordered.append(item)

    return ordered


def build_geocode_lookup(dataset: Dict[str, Dict[str, float]]):
    lookup: Dict[str, Tuple[float, float]] = {}

    for key, coords in dataset.items():
        lat = coords.get("lat")
        lon = coords.get("lon")
        if lat is None or lon is None:
            continue

        for variant in build_variants(key):
            normalized = normalize(variant)
            if not normalized or normalized in lookup:
                continue
            lookup[normalized] = (float(lat), float(lon))

    def register_aliases(candidates: Dict[str, List[str]]):
        for alias, values in candidates.items():
            alias_key = normalize(alias)
            for candidate in values:
                for variant in build_variants(candidate):
                    source_key = normalize(variant)
                    if source_key in lookup:
                        lookup[alias_key] = lookup[source_key]
                        break
                if alias_key in lookup:
                    break

    register_aliases(REGION_ALIAS_CANDIDATES)
    register_aliases(ZONE_ALIAS_CANDIDATES)
    register_aliases(WOREDO_ALIAS_CANDIDATES)

    for alias, coords in EXTRA_FALLBACKS.items():
        lookup[normalize(alias)] = coords

    return lookup


def ordered_region(entry: dict) -> dict:
    ordered: dict = {}
    for key in ["legacy_id", "name", "code", "description", "status", "latitude", "longitude"]:
        if key in entry:
            ordered[key] = entry[key]
    for key, value in entry.items():
        if key not in ordered:
            ordered[key] = value
    return ordered


def ordered_zone(entry: dict) -> dict:
    ordered: dict = {}
    for key in ["legacy_id", "name", "region_legacy_id", "comment", "administrative_center", "status", "latitude", "longitude"]:
        if key in entry:
            ordered[key] = entry[key]
    for key, value in entry.items():
        if key not in ordered:
            ordered[key] = value
    return ordered


def ordered_woreda(entry: dict) -> dict:
    ordered: dict = {}
    for key in ["legacy_id", "name", "zone_legacy_id", "comment", "administrative_center", "status", "latitude", "longitude"]:
        if key in entry:
            ordered[key] = entry[key]
    for key, value in entry.items():
        if key not in ordered:
            ordered[key] = value
    return ordered


def ordered_place(entry: dict) -> dict:
    ordered: dict = {}
    for key in ["legacy_id", "name", "woreda_legacy_id", "comment", "status", "latitude", "longitude"]:
        if key in entry:
            ordered[key] = entry[key]
    for key, value in entry.items():
        if key not in ordered:
            ordered[key] = value
    return ordered


def resolve_candidates(*candidates: Optional[str]) -> List[str]:
    resolved: List[str] = []
    for candidate in candidates:
        if candidate is None:
            continue
        candidate = candidate.strip()
        if not candidate:
            continue
        resolved.extend(build_variants(candidate))
    return resolved


def format_name(raw: Optional[str]) -> Optional[str]:
    if raw is None:
        return None
    text = " ".join(raw.strip().split())
    return text if text else None


def round_pair(coords: Tuple[float, float], decimals: int) -> Tuple[float, float]:
    return round(coords[0], decimals), round(coords[1], decimals)


def average_coords(points: Iterable[Tuple[float, float]]) -> Optional[Tuple[float, float]]:
    latitudes: List[float] = []
    longitudes: List[float] = []
    for lat, lon in points:
        latitudes.append(float(lat))
        longitudes.append(float(lon))
    if not latitudes or not longitudes:
        return None
    return sum(latitudes) / len(latitudes), sum(longitudes) / len(longitudes)

def squared_distance(origin: Tuple[float, float], target: Tuple[float, float]) -> float:
    return (origin[0] - target[0]) ** 2 + (origin[1] - target[1]) ** 2


def apply_zone_admin_overrides(zones: List[dict]) -> int:
    applied = 0
    for entry in zones:
        name = format_name(entry.get("name"))
        if not name:
            continue
        override = ZONE_ADMIN_CENTER_OVERRIDES.get(normalize_key(name))
        if override is None:
            continue
        if entry.get("administrative_center") == override:
            continue
        entry["administrative_center"] = override
        applied += 1
    return applied


def apply_woreda_admin_overrides(woredas: List[dict]) -> int:
    applied = 0
    for entry in woredas:
        name = format_name(entry.get("name"))
        if not name:
            continue
        override = WOREDA_ADMIN_CENTER_OVERRIDES.get(normalize_key(name))
        if override is None:
            continue
        if entry.get("administrative_center") == override:
            continue
        entry["administrative_center"] = override
        applied += 1
    return applied


def assign_zone_administrative_centers(
    zones: List[dict],
    woredas: List[dict],
    places: List[dict],
) -> Counter:
    woreda_to_zone = {
        int(woreda.get("legacy_id", 0)): int(woreda.get("zone_legacy_id", 0))
        for woreda in woredas
        if woreda.get("zone_legacy_id") is not None
    }

    zone_places: Dict[int, List[dict]] = defaultdict(list)
    for place in places:
        woreda_legacy_id = int(place.get("woreda_legacy_id", 0))
        zone_legacy_id = woreda_to_zone.get(woreda_legacy_id)
        if not zone_legacy_id:
            continue
        lat = place.get("latitude")
        lon = place.get("longitude")
        if lat is None or lon is None:
            continue
        zone_places[zone_legacy_id].append(place)

    stats: Counter = Counter()

    for zone in zones:
        name = format_name(zone.get("name"))
        if not name:
            continue
        if format_name(zone.get("administrative_center")):
            continue

        legacy_id = int(zone.get("legacy_id", 0))
        candidates = zone_places.get(legacy_id, [])
        if not candidates:
            continue

        normalized_zone_name = normalize_key(name)

        # Exact place name match to the zone name.
        for place in candidates:
            place_name = format_name(place.get("name"))
            if place_name and normalize_key(place_name) == normalized_zone_name:
                zone["administrative_center"] = place_name
                stats["direct"] += 1
                break

        if format_name(zone.get("administrative_center")):
            continue

        # Look for hints in the place comment.
        for place in candidates:
            comment = place.get("comment")
            if not comment:
                continue
            lowered = comment.lower()
            if any(keyword in lowered for keyword in PLACE_CENTER_KEYWORDS):
                place_name = format_name(place.get("name"))
                if place_name:
                    zone["administrative_center"] = place_name
                    stats["comment"] += 1
                    break

        if format_name(zone.get("administrative_center")):
            continue

        zone_lat = zone.get("latitude")
        zone_lon = zone.get("longitude")
        if zone_lat is None or zone_lon is None:
            continue

        zone_point = (float(zone_lat), float(zone_lon))
        best_place: Optional[dict] = None
        best_distance: Optional[float] = None

        for place in candidates:
            place_lat = place.get("latitude")
            place_lon = place.get("longitude")
            if place_lat is None or place_lon is None:
                continue
            target_point = (float(place_lat), float(place_lon))
            distance = squared_distance(zone_point, target_point)
            if best_distance is None or distance < best_distance:
                best_distance = distance
                best_place = place

        if best_place is None:
            continue

        place_name = format_name(best_place.get("name"))
        if not place_name:
            continue

        zone["administrative_center"] = place_name
        stats["proximity"] += 1

    stats["total"] = stats.get("direct", 0) + stats.get("comment", 0) + stats.get("proximity", 0)
    return stats


def assign_woreda_administrative_centers(woredas: List[dict], places: List[dict]) -> Counter:
    places_by_woreda: Dict[int, List[dict]] = defaultdict(list)
    for place in places:
        lat = place.get("latitude")
        lon = place.get("longitude")
        if lat is None or lon is None:
            continue
        woreda_legacy_id = int(place.get("woreda_legacy_id", 0))
        if woreda_legacy_id:
            places_by_woreda[woreda_legacy_id].append(place)

    stats: Counter = Counter()

    for woreda in woredas:
        name = format_name(woreda.get("name"))
        if not name:
            continue
        if format_name(woreda.get("administrative_center")):
            continue

        legacy_id = int(woreda.get("legacy_id", 0))
        candidates = places_by_woreda.get(legacy_id, [])
        if not candidates:
            continue

        normalized_woreda_name = normalize_key(name)

        for place in candidates:
            place_name = format_name(place.get("name"))
            if place_name and normalize_key(place_name) == normalized_woreda_name:
                woreda["administrative_center"] = place_name
                stats["direct"] += 1
                break

        if format_name(woreda.get("administrative_center")):
            continue

        for place in candidates:
            comment = place.get("comment")
            if not comment:
                continue
            lowered = comment.lower()
            if any(keyword in lowered for keyword in PLACE_CENTER_KEYWORDS):
                place_name = format_name(place.get("name"))
                if place_name:
                    woreda["administrative_center"] = place_name
                    stats["comment"] += 1
                    break

        if format_name(woreda.get("administrative_center")):
            continue

        woreda_lat = woreda.get("latitude")
        woreda_lon = woreda.get("longitude")
        if woreda_lat is None or woreda_lon is None:
            continue

        woreda_point = (float(woreda_lat), float(woreda_lon))
        best_place: Optional[dict] = None
        best_distance: Optional[float] = None

        for place in candidates:
            place_lat = place.get("latitude")
            place_lon = place.get("longitude")
            if place_lat is None or place_lon is None:
                continue
            target_point = (float(place_lat), float(place_lon))
            distance = squared_distance(woreda_point, target_point)
            if best_distance is None or distance < best_distance:
                best_distance = distance
                best_place = place

        if best_place is None:
            continue

        place_name = format_name(best_place.get("name"))
        if not place_name:
            continue

        woreda["administrative_center"] = place_name
        stats["proximity"] += 1

    stats["total"] = stats.get("direct", 0) + stats.get("comment", 0) + stats.get("proximity", 0)
    return stats


def find_coordinates(candidates: List[Tuple[str, str]], lookup: Dict[str, Tuple[float, float]]):
    checked: set[str] = set()
    for candidate, level in candidates:
        if candidate is None:
            continue
        for variant in resolve_candidates(candidate):
            key = normalize(variant)
            if not key or key in checked:
                continue
            checked.add(key)
            coords = lookup.get(key)
            if coords is not None:
                return coords, level
    return None, None


def build_region_candidates(entry: dict) -> List[Tuple[str, str]]:
    name = format_name(entry.get("name"))
    candidates: List[Tuple[str, str]] = []
    if name:
        normalized = normalize_key(name)
        for preferred in REGION_PRIORITY_NAMES.get(normalized, []):
            candidates.append((preferred, "capital"))
        candidates.extend([
            (name, "region"),
            (f"{name} Region", "region"),
            (f"{name} Regional State", "region"),
            (f"{name} State", "region"),
        ])
    candidates.append(("Ethiopia", "fallback"))
    return candidates


def build_zone_candidates(entry: dict, regions_by_legacy: Dict[int, dict]) -> List[Tuple[str, str]]:
    name = format_name(entry.get("name"))
    region_entry = regions_by_legacy.get(int(entry.get("region_legacy_id", 0)))
    region_name = format_name(region_entry.get("name")) if region_entry else None
    candidates: List[Tuple[str, str]] = []

    admin_center = format_name(entry.get("administrative_center"))
    if admin_center:
        candidates.append((admin_center, "admin-center"))

    if name:
        normalized = normalize_key(name)
        for preferred in ZONE_PRIORITY_NAMES.get(normalized, []):
            candidates.append((preferred, "admin-center"))
        candidates.extend([
            (name, "zone"),
            (f"{name} Zone", "zone"),
            (f"{name} Administrative Zone", "zone"),
        ])
    if name and region_name:
        candidates.append((f"{name}, {region_name}", "zone-region"))
    if region_name:
        candidates.append((region_name, "region"))
    candidates.append(("Ethiopia", "fallback"))
    return candidates


def build_woreda_candidates(entry: dict, zones_by_legacy: Dict[int, dict], regions_by_legacy: Dict[int, dict]) -> List[Tuple[str, str]]:
    name = format_name(entry.get("name"))
    zone_entry = zones_by_legacy.get(int(entry.get("zone_legacy_id", 0)))
    zone_name = format_name(zone_entry.get("name")) if zone_entry else None
    region_entry = None
    if zone_entry:
        region_entry = regions_by_legacy.get(int(zone_entry.get("region_legacy_id", 0)))
    region_name = format_name(region_entry.get("name")) if region_entry else None

    candidates: List[Tuple[str, str]] = []

    admin_center = format_name(entry.get("administrative_center"))
    if admin_center:
        candidates.append((admin_center, "admin-center"))

    if name:
        normalized = normalize_key(name)
        for preferred in WOREDA_PRIORITY_NAMES.get(normalized, []):
            candidates.append((preferred, "admin-center"))
        candidates.extend([
            (name, "woreda"),
            (f"{name} Woreda", "woreda"),
        ])
    if zone_name:
        candidates.extend([
            (zone_name, "zone"),
            (f"{zone_name} Zone", "zone"),
        ])
    if region_name:
        candidates.extend([
            (region_name, "region"),
            (f"{region_name} Region", "region"),
        ])
    candidates.append(("Ethiopia", "fallback"))
    return candidates


def build_place_candidates(
    entry: dict,
    woredas_by_legacy: Dict[int, dict],
    zones_by_legacy: Dict[int, dict],
    regions_by_legacy: Dict[int, dict],
) -> List[Tuple[str, str]]:
    place_name = format_name(entry.get("name"))
    woreda_entry = woredas_by_legacy.get(int(entry.get("woreda_legacy_id", 0)))
    zone_entry = None
    region_entry = None

    if woreda_entry:
        zone_entry = zones_by_legacy.get(int(woreda_entry.get("zone_legacy_id", 0)))
        if zone_entry:
            region_entry = regions_by_legacy.get(int(zone_entry.get("region_legacy_id", 0)))
    elif entry.get("region_legacy_id"):
        region_entry = regions_by_legacy.get(int(entry["region_legacy_id"]))

    candidates: List[Tuple[str, str]] = []

    if place_name:
        candidates.append((place_name, "place"))

    woreda_name = format_name(woreda_entry.get("name")) if woreda_entry else None
    if woreda_name:
        candidates.extend([
            (woreda_name, "woreda"),
            (f"{woreda_name} Woreda", "woreda"),
        ])

    zone_name = format_name(zone_entry.get("name")) if zone_entry else None
    if zone_name:
        candidates.extend([
            (zone_name, "zone"),
            (f"{zone_name} Zone", "zone"),
        ])

    region_name = format_name(region_entry.get("name")) if region_entry else None
    if region_name:
        candidates.extend([
            (region_name, "region"),
            (f"{region_name} Region", "region"),
        ])

    candidates.append(("Ethiopia", "fallback"))
    return candidates


def enrich_regions(regions: List[dict], lookup: Dict[str, Tuple[float, float]]):
    stats = Counter()
    missing: List[Tuple[int, str]] = []
    coords_by_legacy: Dict[int, Tuple[float, float]] = {}

    for entry in regions:
        legacy_id = int(entry.get("legacy_id", 0))
        name = format_name(entry.get("name")) or "UNKNOWN"
        candidates = build_region_candidates(entry)
        coords, level = find_coordinates(candidates, lookup)

        if coords is None:
            missing.append((legacy_id, name))
            entry["latitude"] = entry.get("latitude")
            entry["longitude"] = entry.get("longitude")
            continue

        stats[level] += 1
        lat, lon = round_pair(coords, ROUNDING_PRECISION["region"])
        entry["latitude"] = lat
        entry["longitude"] = lon
        coords_by_legacy[legacy_id] = (lat, lon)

    return coords_by_legacy, stats, missing


def enrich_zones(zones: List[dict], regions_by_legacy: Dict[int, dict], lookup: Dict[str, Tuple[float, float]]):
    stats = Counter()
    missing: List[Tuple[int, str]] = []
    coords_by_legacy: Dict[int, Tuple[float, float]] = {}

    for entry in zones:
        legacy_id = int(entry.get("legacy_id", 0))
        name = format_name(entry.get("name")) or "UNKNOWN"
        candidates = build_zone_candidates(entry, regions_by_legacy)
        coords, level = find_coordinates(candidates, lookup)

        if coords is None:
            missing.append((legacy_id, name))
            entry["latitude"] = entry.get("latitude")
            entry["longitude"] = entry.get("longitude")
            continue

        stats[level] += 1
        lat, lon = round_pair(coords, ROUNDING_PRECISION["zone"])
        entry["latitude"] = lat
        entry["longitude"] = lon
        coords_by_legacy[legacy_id] = (lat, lon)

    return coords_by_legacy, stats, missing


def enrich_woredas(
    woredas: List[dict],
    zones_by_legacy: Dict[int, dict],
    regions_by_legacy: Dict[int, dict],
    lookup: Dict[str, Tuple[float, float]],
):
    stats = Counter()
    missing: List[Tuple[int, str]] = []
    coords_by_legacy: Dict[int, Tuple[float, float]] = {}

    for entry in woredas:
        legacy_id = int(entry.get("legacy_id", 0))
        name = format_name(entry.get("name")) or "UNKNOWN"
        candidates = build_woreda_candidates(entry, zones_by_legacy, regions_by_legacy)
        coords, level = find_coordinates(candidates, lookup)

        if coords is None:
            missing.append((legacy_id, name))
            entry["latitude"] = entry.get("latitude")
            entry["longitude"] = entry.get("longitude")
            continue

        stats[level] += 1
        lat, lon = round_pair(coords, ROUNDING_PRECISION["woreda"])
        entry["latitude"] = lat
        entry["longitude"] = lon
        coords_by_legacy[legacy_id] = (lat, lon)

    return coords_by_legacy, stats, missing


def enrich_places(
    places: List[dict],
    woredas_by_legacy: Dict[int, dict],
    zones_by_legacy: Dict[int, dict],
    regions_by_legacy: Dict[int, dict],
    lookup: Dict[str, Tuple[float, float]],
):
    stats = Counter()
    missing: List[Tuple[int, str]] = []

    for entry in places:
        legacy_id = int(entry.get("legacy_id", 0))
        place_name = format_name(entry.get("name")) or "UNKNOWN"
        candidates = build_place_candidates(entry, woredas_by_legacy, zones_by_legacy, regions_by_legacy)
        coords, level = find_coordinates(candidates, lookup)

        if coords is None:
            missing.append((legacy_id, place_name))
            entry["latitude"] = None
            entry["longitude"] = None
            continue

        stats[level] += 1
        lat, lon = round_pair(coords, ROUNDING_PRECISION["place"])
        entry["latitude"] = lat
        entry["longitude"] = lon

    return stats, missing


def update_woredas_from_places(
    woredas: List[dict],
    places: List[dict],
) -> int:
    places_by_woreda: Dict[int, List[Tuple[float, float]]] = defaultdict(list)

    for place in places:
        lat = place.get("latitude")
        lon = place.get("longitude")
        if lat is None or lon is None:
            continue
        woreda_legacy_id = int(place.get("woreda_legacy_id", 0))
        places_by_woreda[woreda_legacy_id].append((float(lat), float(lon)))

    updates = 0

    for entry in woredas:
        legacy_id = int(entry.get("legacy_id", 0))
        coords: Optional[Tuple[float, float]] = None

        place_matches = places_by_woreda.get(legacy_id)
        if place_matches:
            woreda_name = format_name(entry.get("name"))
            if woreda_name:
                normalized_woreda = normalize_key(woreda_name)
                for place in places:
                    if int(place.get("woreda_legacy_id", 0)) != legacy_id:
                        continue
                    place_name = format_name(place.get("name"))
                    if place_name and normalize_key(place_name) == normalized_woreda:
                        coords = (float(place["latitude"]), float(place["longitude"]))
                        break
            if coords is None:
                coords = average_coords(place_matches)

        if coords is None:
            continue

        lat, lon = round_pair(coords, ROUNDING_PRECISION["woreda"])
        entry["latitude"] = lat
        entry["longitude"] = lon
        updates += 1

    return updates


def update_zones_from_woredas(zones: List[dict], woredas: List[dict]) -> int:
    woredas_by_zone: Dict[int, List[Tuple[float, float]]] = defaultdict(list)

    for woreda in woredas:
        lat = woreda.get("latitude")
        lon = woreda.get("longitude")
        if lat is None or lon is None:
            continue
        zone_legacy_id = int(woreda.get("zone_legacy_id", 0))
        woredas_by_zone[zone_legacy_id].append((float(lat), float(lon)))

    updates = 0

    for zone in zones:
        legacy_id = int(zone.get("legacy_id", 0))
        coords = average_coords(woredas_by_zone.get(legacy_id, []))
        if coords is None:
            continue
        if zone.get("latitude") is not None and zone.get("longitude") is not None:
            continue
        lat, lon = round_pair(coords, ROUNDING_PRECISION["zone"])
        zone["latitude"] = lat
        zone["longitude"] = lon
        updates += 1

    return updates


def update_regions_from_zones(regions: List[dict], zones: List[dict]) -> int:
    zones_by_region: Dict[int, List[Tuple[float, float]]] = defaultdict(list)

    for zone in zones:
        lat = zone.get("latitude")
        lon = zone.get("longitude")
        if lat is None or lon is None:
            continue
        region_legacy_id = int(zone.get("region_legacy_id", 0))
        zones_by_region[region_legacy_id].append((float(lat), float(lon)))

    updates = 0

    for region in regions:
        legacy_id = int(region.get("legacy_id", 0))
        if region.get("latitude") is not None and region.get("longitude") is not None:
            continue
        coords = average_coords(zones_by_region.get(legacy_id, []))
        if coords is None:
            continue
        lat, lon = round_pair(coords, ROUNDING_PRECISION["region"])
        region["latitude"] = lat
        region["longitude"] = lon
        updates += 1

    return updates


def main() -> None:
    regions: List[dict] = load_json(REGIONS_PATH)
    zones: List[dict] = load_json(ZONES_PATH)
    woredas: List[dict] = load_json(WOREDAS_PATH)
    places: List[dict] = load_json(PLACES_PATH)
    geocode_cache = load_json(GEOCODE_CACHE_PATH)

    lookup = build_geocode_lookup(geocode_cache)

    regions_by_legacy = {int(item.get("legacy_id", 0)): item for item in regions}
    zones_by_legacy = {int(item.get("legacy_id", 0)): item for item in zones}
    woredas_by_legacy = {int(item.get("legacy_id", 0)): item for item in woredas}

    zone_overrides_applied = apply_zone_admin_overrides(zones)
    woreda_overrides_applied = apply_woreda_admin_overrides(woredas)

    region_coords, region_stats, region_missing = enrich_regions(regions, lookup)
    zone_coords, zone_stats, zone_missing = enrich_zones(zones, regions_by_legacy, lookup)
    woreda_coords, woreda_stats, woreda_missing = enrich_woredas(woredas, zones_by_legacy, regions_by_legacy, lookup)

    place_stats, place_missing = enrich_places(places, woredas_by_legacy, zones_by_legacy, regions_by_legacy, lookup)

    woreda_updates = update_woredas_from_places(woredas, places)
    if woreda_updates:
        woreda_coords = {
            int(item.get("legacy_id", 0)): (item.get("latitude"), item.get("longitude"))
            for item in woredas
            if item.get("latitude") is not None and item.get("longitude") is not None
        }

    zone_updates = update_zones_from_woredas(zones, woredas)
    if zone_updates:
        zone_coords = {
            int(item.get("legacy_id", 0)): (item.get("latitude"), item.get("longitude"))
            for item in zones
            if item.get("latitude") is not None and item.get("longitude") is not None
        }

    region_updates = update_regions_from_zones(regions, zones)
    if region_updates:
        region_coords = {
            int(item.get("legacy_id", 0)): (item.get("latitude"), item.get("longitude"))
            for item in regions
            if item.get("latitude") is not None and item.get("longitude") is not None
        }

    zone_admin_stats = assign_zone_administrative_centers(zones, woredas, places)
    woreda_admin_stats = assign_woreda_administrative_centers(woredas, places)

    save_json(REGIONS_PATH, [ordered_region(entry) for entry in regions])
    save_json(ZONES_PATH, [ordered_zone(entry) for entry in zones])
    save_json(WOREDAS_PATH, [ordered_woreda(entry) for entry in woredas])
    save_json(PLACES_PATH, [ordered_place(entry) for entry in places])

    print("Region matches:")
    for level, count in region_stats.most_common():
        print(f"  {level}: {count}")
    if region_missing:
        print(f"  missing: {len(region_missing)}")

    print("Zone matches:")
    for level, count in zone_stats.most_common():
        print(f"  {level}: {count}")
    if zone_missing:
        print(f"  missing: {len(zone_missing)}")
    if zone_overrides_applied:
        print(f"  admin overrides: {zone_overrides_applied}")
    if zone_admin_stats.get("total"):
        print("  admin inferred:")
        for key in ("direct", "comment", "proximity"):
            if zone_admin_stats.get(key):
                print(f"    {key}: {zone_admin_stats[key]}")

    print("Woreda matches:")
    for level, count in woreda_stats.most_common():
        print(f"  {level}: {count}")
    if woreda_missing:
        print(f"  missing: {len(woreda_missing)}")
    if woreda_updates:
        print(f"  updated from places: {woreda_updates}")
    if woreda_overrides_applied:
        print(f"  admin overrides: {woreda_overrides_applied}")
    if woreda_admin_stats.get("total"):
        print("  admin inferred:")
        for key in ("direct", "comment", "proximity"):
            if woreda_admin_stats.get(key):
                print(f"    {key}: {woreda_admin_stats[key]}")

    print("Place matches:")
    for level, count in place_stats.most_common():
        print(f"  {level}: {count}")
    if place_missing:
        print(f"  missing: {len(place_missing)}")


if __name__ == "__main__":
    main()
