import ast
import json
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List

ROOT = Path(__file__).resolve().parents[1]
SQL_DUMP = ROOT / "eletderashcom_tims.sql" / "eletderashcom_tims.sql"
OUTPUT_DIR = ROOT / "database" / "seeders" / "data"


def main() -> None:
    sql = SQL_DUMP.read_text(encoding="utf-8")

    trucks_rows = parse_inserts(sql, "trucks")
    drivers_rows = parse_inserts(sql, "drivers")
    assignments_rows = parse_inserts(sql, "driver_truck")

    trucks_payload = [transform_truck(row) for row in trucks_rows]
    drivers_payload = [transform_driver(row) for row in drivers_rows]
    assignments_payload = [transform_driver_truck(row) for row in assignments_rows]

    write_json("legacy_trucks.json", trucks_payload)
    write_json("legacy_drivers.json", drivers_payload)
    write_json("legacy_driver_trucks.json", assignments_payload)

    print(f"Exported {len(trucks_payload)} trucks")
    print(f"Exported {len(drivers_payload)} drivers")
    print(f"Exported {len(assignments_payload)} driver-truck assignments")


def parse_inserts(sql: str, table: str) -> List[Dict[str, Any]]:
    pattern = re.compile(rf"INSERT INTO `{table}` \((.*?)\) VALUES (.*?);", re.DOTALL)
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
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
