import json
import re
from collections import Counter
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "database" / "seeders" / "data"

PLACES_PATH = DATA_DIR / "legacy_places.json"
WOREDAS_PATH = DATA_DIR / "legacy_woredas.json"
ZONES_PATH = DATA_DIR / "legacy_zones.json"
REGIONS_PATH = DATA_DIR / "legacy_regions.json"
GEOCODE_CACHE_PATH = DATA_DIR / "geocode_cache.json"

REGION_ALIAS_CANDIDATES: dict[str, list[str]] = {
    "Cental": ["Addis Ababa, Ethiopia"],
    "ADDISABEBA": ["Addis Ababa, Ethiopia"],
    "ADDISE ABABA": ["Addis Ababa, Ethiopia"],
    "SNNPR": ["Sidama, Ethiopia", "Sidama Zone, Ethiopia", "South West Region, Ethiopia"],
    "BENESHANGUL": ["Benishangul-Gumuz Region, Ethiopia", "Benishangul, Ethiopia"],
    "BENSHANGUL GUMUZ": ["Benishangul-Gumuz Region, Ethiopia", "Benishangul, Ethiopia"],
    "BORENA": ["Borena, Ethiopia"],
    "GAMBYLA": ["Gambyla Region, Ethiopia", "Gambela, Ethiopia"],
    "DJIBOUTI": ["Djibouti"],
    "SOMALI": ["Somali Region, Ethiopia", "Somali, Ethiopia"],
    "HARERI": ["Harari Region, Ethiopia", "Harari, Ethiopia"],
    "SIDAMA": ["Sidama, Ethiopia", "Sidama Zone, Ethiopia"],
    "SOUTH WEST": ["South West Region, Ethiopia"],
}

ZONE_ALIAS_CANDIDATES: dict[str, list[str]] = {
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
}

WOREDO_ALIAS_CANDIDATES: dict[str, list[str]] = {
    "W/SHWA": ["West Shewa, Ethiopia"],
}

EXTRA_FALLBACKS: dict[str, tuple[float, float]] = {
    "ethiopia": (9.145, 40.489673),
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


def to_title_words(value: str) -> str:
    words = re.split(r"[\s/,-]+", value)
    return " ".join(word.capitalize() for word in words if word)


def build_variants(label: str) -> set[str]:
    cleaned = label.strip()
    if not cleaned:
        return set()

    variants: set[str] = set()
    variants.add(cleaned)
    variants.add(cleaned.replace("/", " "))
    variants.add(cleaned.replace("-", " "))
    variants.add(cleaned.replace("'", " "))
    variants.add(to_title_words(cleaned))

    if "," in cleaned:
        variants.add(cleaned.split(",", 1)[0].strip())

    stripped_words = re.sub(r"\b(woreda|zone|region|regional|state|city|administration)\b", " ", cleaned, flags=re.IGNORECASE)
    variants.add(stripped_words)

    lower = cleaned.lower()
    upper = cleaned.upper()
    variants.add(lower)
    variants.add(upper)

    final: set[str] = set()
    for item in variants:
        normalized = " ".join(item.split())
        if not normalized:
            continue
        final.add(normalized)
        final.add(f"{normalized}, Ethiopia")
        final.add(f"{normalized} Ethiopia")

    return {" ".join(item.split()) for item in final if item}


def build_geocode_lookup(dataset: dict[str, dict[str, float]]):
    lookup: dict[str, tuple[float, float]] = {}
    source: dict[str, str] = {}

    for key, coords in dataset.items():
        lat = coords.get("lat")
        lon = coords.get("lon")
        if lat is None or lon is None:
            continue

        for variant in build_variants(key):
            normalized = normalize(variant)
            if not normalized:
                continue
            if normalized in lookup:
                continue
            lookup[normalized] = (float(lat), float(lon))
            source[normalized] = key

    for alias, values in REGION_ALIAS_CANDIDATES.items():
        for candidate in values:
            for variant in build_variants(candidate):
                normalized = normalize(alias)
                source_norm = normalize(variant)
                if source_norm in lookup:
                    lookup[normalized] = lookup[source_norm]
                    source[normalized] = f"alias:{candidate}"
                    break

    for alias, values in ZONE_ALIAS_CANDIDATES.items():
        for candidate in values:
            for variant in build_variants(candidate):
                normalized = normalize(alias)
                source_norm = normalize(variant)
                if source_norm in lookup:
                    lookup[normalized] = lookup[source_norm]
                    source[normalized] = f"alias:{candidate}"
                    break

    for alias, values in WOREDO_ALIAS_CANDIDATES.items():
        for candidate in values:
            for variant in build_variants(candidate):
                normalized = normalize(alias)
                source_norm = normalize(variant)
                if source_norm in lookup:
                    lookup[normalized] = lookup[source_norm]
                    source[normalized] = f"alias:{candidate}"
                    break

    for alias, coords in EXTRA_FALLBACKS.items():
        lookup[normalize(alias)] = coords
        source[normalize(alias)] = "manual-fallback"

    return lookup, source


def ordered_place(place: dict) -> dict:
    ordered: dict = {}
    for key in ["legacy_id", "name", "woreda_legacy_id", "comment", "status", "latitude", "longitude"]:
        if key in place:
            ordered[key] = place[key]
    for key, value in place.items():
        if key not in ordered:
            ordered[key] = value
    return ordered


def resolve_candidates(*candidates: str) -> list[str]:
    resolved: list[str] = []
    for candidate in candidates:
        if candidate is None:
            continue
        candidate = candidate.strip()
        if not candidate:
            continue
        resolved.extend(sorted(build_variants(candidate), key=len))
    return resolved


def format_name(raw: str | None) -> str | None:
    if raw is None:
        return None
    text = " ".join(raw.strip().split())
    return text


def main() -> None:
    places = load_json(PLACES_PATH)
    woredas = {int(item["legacy_id"]): item for item in load_json(WOREDAS_PATH)}
    zones = {int(item["legacy_id"]): item for item in load_json(ZONES_PATH)}
    regions = {int(item["legacy_id"]): item for item in load_json(REGIONS_PATH)}
    geocode_cache = load_json(GEOCODE_CACHE_PATH)

    lookup, source = build_geocode_lookup(geocode_cache)

    stats = Counter()
    missing: list[tuple[int, str]] = []

    updated_places: list[dict] = []

    for entry in places:
        legacy_id = int(entry.get("legacy_id", 0))
        place_name = format_name(entry.get("name"))
        woreda_entry = woredas.get(int(entry.get("woreda_legacy_id", 0)))
        zone_entry = None
        region_entry = None

        if woreda_entry:
            zone_entry = zones.get(int(woreda_entry.get("zone_legacy_id", 0)))
            if zone_entry:
                region_entry = regions.get(int(zone_entry.get("region_legacy_id", 0)))
        elif entry.get("region_legacy_id"):
            region_entry = regions.get(int(entry["region_legacy_id"]))

        candidates: list[tuple[str, str]] = []

        if place_name:
            candidates.append((place_name, "place"))

        if woreda_entry:
            woreda_name = format_name(woreda_entry.get("name"))
            if woreda_name:
                candidates.append((woreda_name, "woreda"))
                candidates.append((f"{woreda_name} Woreda", "woreda"))

        if zone_entry:
            zone_name = format_name(zone_entry.get("name"))
            if zone_name:
                candidates.append((zone_name, "zone"))
                candidates.append((f"{zone_name} Zone", "zone"))

        if region_entry:
            region_name = format_name(region_entry.get("name"))
            if region_name:
                candidates.append((region_name, "region"))
                candidates.append((f"{region_name} Region", "region"))

        candidates.append(("Ethiopia", "fallback"))

        found_coords = None
        match_level = None

        for candidate, level in candidates:
            for variant in resolve_candidates(candidate):
                normalized = normalize(variant)
                coords = lookup.get(normalized)
                if coords is None:
                    continue
                found_coords = coords
                match_level = level
                break
            if found_coords is not None:
                break

        if found_coords is None:
            missing.append((legacy_id, place_name or "UNKNOWN"))
            entry["latitude"] = None
            entry["longitude"] = None
        else:
            stats[match_level] += 1
            entry["latitude"] = round(found_coords[0], 8)
            entry["longitude"] = round(found_coords[1], 8)

        updated_places.append(ordered_place(entry))

    save_json(PLACES_PATH, updated_places)

    print("Lat/Lon enrichment complete.")
    print("Matches by level:")
    for level, count in stats.most_common():
        print(f"  {level}: {count}")

    if missing:
        print(f"Missing coordinates for {len(missing)} places:")
        for legacy_id, name in missing[:25]:
            print(f"  LEGACY_PLACE_{legacy_id}: {name}")
        if len(missing) > 25:
            print("  ...")
    else:
        print("All places resolved.")


if __name__ == "__main__":
    main()
