import ast
import json
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List

ROOT = Path(__file__).resolve().parents[1]
SQL_CANDIDATES = [
    ROOT / "eletderashcom_tims (3).sql",
    ROOT / "database" / "eletderashcom_tims_12_19.sql",
    ROOT / "eletderashcom_tims.sql" / "eletderashcom_tims.sql",
    ROOT / "eletderashcom_tims (1).sql",
]
SQL_DUMP = next((path for path in SQL_CANDIDATES if path.exists()), None)

if SQL_DUMP is None:
    raise FileNotFoundError("No SQL dump found. Expected one of: " + ", ".join(str(path) for path in SQL_CANDIDATES))
OUTPUT_DIR = ROOT / "database" / "seeders" / "data"


def main() -> None:
    sql = SQL_DUMP.read_text(encoding="utf-8")

    trucks_rows = parse_inserts(sql, "trucks")
    drivers_rows = parse_inserts(sql, "drivers")
    assignments_rows = parse_inserts(sql, "driver_truck")
    customers_rows = parse_inserts(sql, "customers")
    operations_rows = parse_inserts(sql, "operations")
    performances_rows = parse_inserts(sql, "performances")
    outsources_rows = parse_inserts(sql, "outsources")
    outsource_performances_rows = parse_inserts(sql, "outsource_performances")
    users_rows = parse_inserts(sql, "users")
    places_rows = parse_inserts(sql, "places")

    trucks_payload = [transform_truck(row) for row in trucks_rows]
    drivers_payload = [transform_driver(row) for row in drivers_rows]
    assignments_payload = [transform_driver_truck(row) for row in assignments_rows]
    customers_payload = [transform_customer(row) for row in customers_rows]
    operation_id_map = build_operation_id_map(operations_rows)
    operations_payload = deduplicate_operations(
        [transform_operation(row) for row in operations_rows]
    )
    performances_payload = [
        transform_performance(row, operation_id_map) for row in performances_rows
    ]
    outsources_payload = [transform_outsource(row) for row in outsources_rows]
    outsource_performances_payload = [
        transform_outsource_performance(row) for row in outsource_performances_rows
    ]
    users_payload = [transform_user(row) for row in users_rows]
    places_payload = [transform_place(row) for row in places_rows]

    write_json("legacy_trucks.json", trucks_payload)
    write_json("legacy_drivers.json", drivers_payload)
    write_json("legacy_driver_trucks.json", assignments_payload)
    write_json("legacy_customers.json", customers_payload)
    write_json("legacy_operations.json", operations_payload)
    write_json("legacy_performances.json", performances_payload)
    write_json("legacy_users.json", users_payload)
    write_json("legacy_outsources.json", outsources_payload)
    write_json("legacy_outsource_performances.json", outsource_performances_payload)
    write_json("legacy_places.json", places_payload)

    print(f"Exported {len(trucks_payload)} trucks")
    print(f"Exported {len(drivers_payload)} drivers")
    print(f"Exported {len(assignments_payload)} driver-truck assignments")
    print(f"Exported {len(customers_payload)} customers")
    print(f"Exported {len(operations_payload)} operations")
    print(f"Exported {len(performances_payload)} performances")
    print(f"Exported {len(users_payload)} users")
    print(f"Exported {len(outsources_payload)} outsources")
    print(f"Exported {len(outsource_performances_payload)} outsource performances")
    print(f"Exported {len(places_payload)} places")


def parse_inserts(sql: str, table: str) -> List[Dict[str, Any]]:
    pattern = re.compile(
        rf"INSERT INTO `{table}`\s*\((.*?)\)\s+VALUES\s*(.*?);",
        re.DOTALL | re.IGNORECASE,
    )
    rows: List[Dict[str, Any]] = []

    for match in pattern.finditer(sql):
        columns = [col.strip().strip("`") for col in match.group(1).split(",")]
        values_segment = match.group(2).strip()

        for record_str in split_records(values_segment):
            python_ready = re.sub(r"\bNULL\b", "None", record_str)
            row = ast.literal_eval(python_ready)
            rows.append(dict(zip(columns, row)))

    return rows


def split_records(values_segment: str) -> Iterable[str]:
    records: List[str] = []
    current: List[str] = []
    depth = 0
    in_string = False
    escape = False

    for char in values_segment:
        current.append(char)

        if escape:
            escape = False
            continue

        if char == "\\":
            escape = True
            continue

        if char == "'":
            in_string = not in_string
            continue

        if not in_string:
            if char == "(":
                depth += 1
                continue
            if char == ")":
                depth -= 1
                continue
            if char == "," and depth == 0:
                record = "".join(current).strip().rstrip(",").strip()
                if record:
                    records.append(record)
                current = []

    final = "".join(current).strip().rstrip(",").strip()
    if final:
        records.append(final)

    return records


def transform_truck(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "legacy_id": row["id"],
        "plate": row["plate"],
        "vehicle_type_legacy_id": row["vehecletype_id"],
        "chasis_number": normalize_string(row.get("chasisNumber")),
        "engine_number": normalize_string(row.get("engineNumber")),
        "tyre_size": to_optional_string(row.get("tyreSyze")),
        "service_interval_km": to_optional_int(row.get("serviceIntervalKM")),
        "purchase_price": to_decimal_string(row.get("purchasePrice")),
        "production_date": normalize_date(row.get("productionDate")),
        "service_start_date": normalize_date(row.get("serviceStartDate")),
        "status": row.get("status"),
        "deleted_at": normalize_timestamp(row.get("deleted_at")),
        "created_at": normalize_timestamp(row.get("created_at")),
        "updated_at": normalize_timestamp(row.get("updated_at")),
    }


def transform_driver(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "legacy_id": row["id"],
        "driverid": normalize_string(row.get("driverid"), strict=False),
        "name": normalize_string(row.get("name"), strict=False),
        "sex": normalize_sex(row.get("sex")),
        "birthdate": normalize_date(row.get("birthdate")),
        "zone": normalize_string(row.get("zone")),
        "woreda": normalize_string(row.get("woreda")),
        "kebele": normalize_string(row.get("kebele")),
        "housenumber": normalize_string(row.get("housenumber")),
        "mobile": normalize_string(row.get("mobile")),
        "hireddate": normalize_date(row.get("hireddate")),
        "status": row.get("status"),
        "deleted_at": normalize_timestamp(row.get("deleted_at")),
        "created_at": normalize_timestamp(row.get("created_at")),
        "updated_at": normalize_timestamp(row.get("updated_at")),
    }


def transform_driver_truck(row: Dict[str, Any]) -> Dict[str, Any]:
    date_recived = normalize_date(row.get("date_recived"))
    date_detach = normalize_date(row.get("date_detach"))

    return {
        "legacy_id": row["id"],
        "driver_id": row["driver_id"],
        "truck_id": row["truck_id"],
        "driverid": normalize_string(row.get("driverid")),
        "plate": normalize_string(row.get("plate")),
        "assigned_date": date_recived,
        "unassigned_date": date_detach,
        "date_recived": date_recived,
        "date_detach": date_detach,
        "reason": normalize_string(row.get("reason")),
        "is_attached": to_bool(row.get("is_attached")),
        "user_id": row.get("user_id"),
        "status": row.get("status"),
        "deleted_at": normalize_timestamp(row.get("deleted_at")),
        "created_at": normalize_timestamp(row.get("created_at")),
        "updated_at": normalize_timestamp(row.get("updated_at")),
    }


def transform_customer(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "legacy_id": row["id"],
        "name": normalize_string(row.get("name"), strict=False),
        "address": normalize_string(row.get("address"), strict=False),
        "office_number": to_optional_string(row.get("officenumber")),
        "mobile": to_optional_string(row.get("mobile")),
        "remark": normalize_string(row.get("remark"), strict=False),
        "status": row.get("status"),
        "deleted_at": normalize_timestamp(row.get("deleted_at")),
        "created_at": normalize_timestamp(row.get("created_at")),
        "updated_at": normalize_timestamp(row.get("updated_at")),
    }


def transform_operation(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "legacy_id": row["id"],
        "operationid": normalize_string(row.get("operationid"), strict=False),
        "customer_id": row.get("customer_id"),
        "startdate": normalize_date(row.get("startdate")),
        "region_id": row.get("region_id"),
        "volume": to_decimal_string(row.get("volume")),
        "cargotype": row.get("cargotype"),
        "km": to_decimal_string(row.get("km")),
        "tariff": to_decimal_string(row.get("tariff")),
        "status": row.get("status"),
        "closed": row.get("closed"),
        "enddate": normalize_date(row.get("enddate")),
        "remark": normalize_string(row.get("remark"), strict=False),
        "user_id": row.get("user_id"),
        "deleted_at": normalize_timestamp(row.get("deleted_at")),
        "created_at": normalize_timestamp(row.get("created_at")),
        "updated_at": normalize_timestamp(row.get("updated_at")),
    }


def build_operation_id_map(rows: List[Dict[str, Any]]) -> Dict[int, int]:
    mapping: Dict[int, int] = {}
    canonical_by_code: Dict[str, int] = {}

    for row in rows:
        legacy_id = int(row["id"])
        operation_code = normalize_string(row.get("operationid"), strict=False)

        if not operation_code:
            mapping[legacy_id] = legacy_id
            continue

        normalized = str(operation_code).strip().upper()

        if normalized not in canonical_by_code:
            canonical_by_code[normalized] = legacy_id

        mapping[legacy_id] = canonical_by_code[normalized]

    return mapping


def transform_performance(row: Dict[str, Any], operation_id_map: Dict[int, int]) -> Dict[str, Any]:
    load_phase = None
    trip = row.get("trip")
    if trip in {1, "1", True}:
        load_phase = "main"
    elif trip in {0, "0", False}:
        load_phase = "return"

    load_completion = None
    load_type = row.get("LoadType")
    if load_type in {1, "1", True}:
        load_completion = "full"
    elif load_type in {0, "0", False}:
        load_completion = "partial"

    return {
        "legacy_id": row["id"],
        "load_phase": load_phase,
        "load_completion": load_completion,
        "fo_number": normalize_string(row.get("FOnumber"), strict=False),
        "operation_id": operation_id_map.get(int(row.get("operation_id") or 0), row.get("operation_id")),
        "driver_truck_id": row.get("driver_truck_id"),
        "dispatch_date": normalize_date(row.get("DateDispach")),
        "origin_id": row.get("orgion_id"),
        "destination_id": row.get("destination_id"),
        "distance_with_cargo": to_decimal_string(row.get("DistanceWCargo")),
        "tonkm": to_decimal_string(row.get("tonkm")),
        "distance_without_cargo": to_decimal_string(row.get("DistanceWOCargo")),
        "cargo_volume_mt": to_decimal_string(row.get("CargoVolumMT")),
        "fuel_in_liter": to_decimal_string(row.get("fuelInLitter")),
        "fuel_in_birr": to_decimal_string(row.get("fuelInBirr")),
        "perdiem": to_decimal_string(row.get("perdiem")),
        "work_on_going": to_decimal_string(row.get("workOnGoing")),
        "other": to_decimal_string(row.get("other")),
        "comment": normalize_string(row.get("comment"), strict=False),
        "status": row.get("satus"),
        "is_returned": to_bool(row.get("is_returned")),
        "returned_date": normalize_date(row.get("returned_date")),
        "user_id": row.get("user_id"),
        "deleted_at": normalize_timestamp(row.get("deleted_at")),
        "created_at": normalize_timestamp(row.get("created_at")),
        "updated_at": normalize_timestamp(row.get("updated_at")),
    }


def transform_outsource(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "legacy_id": row["id"],
        "name": normalize_string(row.get("name"), strict=False),
        "address": normalize_string(row.get("address"), strict=False),
        "office_number": to_optional_string(row.get("officenumber")),
        "mobile": to_optional_string(row.get("mobile")),
        "remark": normalize_string(row.get("remark"), strict=False),
        "status": row.get("status"),
        "deleted_at": normalize_timestamp(row.get("deleted_at")),
        "created_at": normalize_timestamp(row.get("created_at")),
        "updated_at": normalize_timestamp(row.get("updated_at")),
    }


def transform_outsource_performance(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "legacy_id": row["id"],
        "outsource_id": row.get("outsource_id"),
        "trip": row.get("trip"),
        "load_type": row.get("LoadType"),
        "fo_number": normalize_string(row.get("fonumber"), strict=False),
        "operation_id": row.get("operation_id"),
        "driver_name": normalize_string(row.get("driver_name"), strict=False),
        "plate_number": normalize_string(row.get("plate_number"), strict=False),
        "dispatch_date": normalize_date(row.get("DateDispach")),
        "origin_id": row.get("orgion_id"),
        "destination_id": row.get("destination_id"),
        "tonkm": to_decimal_string(row.get("tonkm")),
        "tariff": to_decimal_string(row.get("tariff")),
        "distance_with_cargo": to_decimal_string(row.get("DistanceWCargo")),
        "distance_without_cargo": to_decimal_string(row.get("DistanceWOCargo")),
        "cargo_volume_mt": to_decimal_string(row.get("CargoVolumMT")),
        "comment": normalize_string(row.get("comment"), strict=False),
        "status": row.get("satus"),
        "user_id": row.get("user_id"),
        "deleted_at": normalize_timestamp(row.get("deleted_at")),
        "created_at": normalize_timestamp(row.get("created_at")),
        "updated_at": normalize_timestamp(row.get("updated_at")),
    }


def transform_user(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "legacy_id": row["id"],
        "name": normalize_string(row.get("name"), strict=False),
        "email": normalize_string(row.get("email")),
        "email_verified_at": normalize_timestamp(row.get("email_verified_at")),
        "password": row.get("password"),
        "remember_token": to_optional_string(row.get("remember_token")),
        "created_at": normalize_timestamp(row.get("created_at")),
        "updated_at": normalize_timestamp(row.get("updated_at")),
    }


def transform_place(row: Dict[str, Any]) -> Dict[str, Any]:
    woreda_id = row.get("woreda_id")

    return {
        "legacy_id": row["id"],
        "name": normalize_string(row.get("name"), strict=False),
        "woreda_legacy_id": int(woreda_id) if woreda_id not in (None, "") else None,
        "comment": normalize_string(row.get("comment"), strict=False),
        "status": row.get("status"),
    }


def normalize_string(value: Any, *, strict: bool = True) -> Any:
    if value in (None, ""):
        return None

    text = str(value).strip()
    if not text:
        return None

    return text if not strict else " ".join(text.split())


def to_optional_string(value: Any) -> Any:
    if value in (None, ""):
        return None
    return str(value).strip()


def to_optional_int(value: Any) -> Any:
    if value in (None, ""):
        return None
    return int(round(float(value)))


def to_decimal_string(value: Any) -> Any:
    if value in (None, ""):
        return None
    return f"{float(value):.2f}"


def normalize_date(value: Any) -> Any:
    if value in (None, ""):
        return None

    text = str(value).strip()
    if not text or text.startswith("0000-00-00"):
        return None
    if text.endswith("-00"):
        return None

    return text


def normalize_timestamp(value: Any) -> Any:
    if value in (None, ""):
        return None

    text = str(value).strip()
    if not text or text == "0000-00-00 00:00:00":
        return None

    return text


def normalize_sex(value: Any) -> Any:
    if value in (None, ""):
        return None

    if isinstance(value, (int, float)):
        return "male" if int(value) == 1 else "female"

    text = str(value).strip().lower()
    if text in {"1", "male", "m"}:
        return "male"
    if text in {"0", "female", "f"}:
        return "female"

    return text


def to_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return int(value) == 1
    if value in (None, ""):
        return False

    text = str(value).strip().lower()
    if text in {"", "0", "false", "no"}:
        return False
    return True


def write_json(filename: str, payload: List[Dict[str, Any]]) -> None:
    path = OUTPUT_DIR / filename
    formatted = json.dumps(payload, indent=2, ensure_ascii=False)
    path.write_text(f"{formatted}\n", encoding="utf-8")


def deduplicate_operations(operations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen: set[str] = set()
    deduped: List[Dict[str, Any]] = []
    duplicates: List[str] = []

    for operation in operations:
        raw_operation_id = operation.get("operationid")
        operation_id = (raw_operation_id or "").strip()

        if not operation_id:
            deduped.append(operation)
            continue

        normalized = operation_id.upper()

        if normalized in seen:
            duplicates.append(f"{operation_id}#{operation.get('legacy_id')}")
            continue

        seen.add(normalized)
        deduped.append(operation)

    if duplicates:
        print(
            "Skipped"
            f" {len(duplicates)} duplicate operations based on operationid: {', '.join(duplicates)}"
        )

    return deduped


if __name__ == "__main__":
    main()
