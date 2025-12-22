from __future__ import annotations

import json
import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path
from typing import Iterable, Callable

SQL_CANDIDATES = [
    Path(__file__).resolve().parent.parent / "performances.sql",
    Path(__file__).resolve().parent.parent / "perfornces.sql",
    Path(__file__).resolve().parent.parent / "operations.sql",
    Path(__file__).resolve().parent.parent / "eletderashcom_tims (1).sql",
    Path(__file__).resolve().parent.parent / "eletderashcom_tims.sql" / "eletderashcom_tims.sql",
]
PERFORMANCES_JSON_PATH = Path(__file__).resolve().parent.parent / "database/seeders/data/legacy_performances.json"
OUTSOURCE_JSON_PATH = Path(__file__).resolve().parent.parent / "database/seeders/data/legacy_outsource_performances.json"
OPERATIONS_JSON_PATH = Path(__file__).resolve().parent.parent / "database/seeders/data/legacy_operations.json"

INSERT_PATTERN = re.compile(
    r"INSERT INTO `(?P<table>[^`]+)`\s*\((?P<columns>[^)]+)\)\s*VALUES\s*(?P<values>.*?);",
    re.DOTALL,
)


@dataclass
class InsertStatement:
    table: str
    columns: list[str]
    rows: list[list[str | None]]


def main() -> None:
    record_sets: dict[str, dict[int, dict[str, object]]] = {
        "performances": {},
        "outsource_performances": {},
        "operations": {},
    }

    builders: dict[str, Callable[[InsertStatement], list[dict[str, object]]]] = {
        "performances": build_performance_payloads,
        "outsource_performances": build_outsource_payloads,
        "operations": build_operations_payloads,
    }

    for path in SQL_CANDIDATES:
        if not path.exists():
            continue

        sql_text = path.read_text(encoding="utf-8")
        for statement in parse_insert_statements(sql_text):
            builder = builders.get(statement.table)
            if builder is None:
                continue

            target = record_sets[statement.table]
            for payload in builder(statement):
                target[int(payload["legacy_id"])] = payload

    if not record_sets["performances"]:
        raise SystemExit("No performance records were parsed from the available SQL dumps.")

    if not record_sets["outsource_performances"]:
        raise SystemExit("No outsource performance records were parsed from the available SQL dumps.")

    write_json(
        PERFORMANCES_JSON_PATH,
        [payload for _, payload in sorted(record_sets["performances"].items())],
    )

    write_json(
        OUTSOURCE_JSON_PATH,
        [payload for _, payload in sorted(record_sets["outsource_performances"].items())],
    )

    if record_sets["operations"]:
        write_json(
            OPERATIONS_JSON_PATH,
            [payload for _, payload in sorted(record_sets["operations"].items())],
        )


def parse_insert_statements(sql_text: str) -> Iterable[InsertStatement]:
    for match in INSERT_PATTERN.finditer(sql_text):
        table = match.group("table")
        columns = [col.strip().strip("`") for col in match.group("columns").split(",")]
        values_block = match.group("values").strip()
        rows = [
            [normalize_token(token) for token in split_row(row)]
            for row in split_rows(values_block)
        ]
        yield InsertStatement(table=table, columns=columns, rows=rows)


def split_rows(values_block: str) -> list[str]:
    rows: list[str] = []
    current: list[str] = []
    depth = 0
    in_string = False
    escape_next = False

    for char in values_block:
        if in_string:
            current.append(char)
            if escape_next:
                escape_next = False
            elif char == "\\":
                escape_next = True
            elif char == "'":
                in_string = False
            continue

        if char == "'":
            in_string = True
            current.append(char)
            continue

        if char == "(":
            depth += 1
            current.append(char)
            continue

        if char == ")":
            depth -= 1
            current.append(char)
            if depth == 0:
                row_text = "".join(current).strip()
                if row_text:
                    rows.append(row_text)
                current = []
            continue

        if depth == 0:
            continue

        current.append(char)

    return rows


def split_row(row_text: str) -> list[str]:
    inner = row_text.strip()
    if inner.startswith("(") and inner.endswith(")"):
        inner = inner[1:-1]

    tokens: list[str] = []
    current: list[str] = []
    in_string = False
    escape_next = False

    for char in inner:
        if in_string:
            current.append(char)
            if escape_next:
                escape_next = False
            elif char == "\\":
                escape_next = True
            elif char == "'":
                in_string = False
            continue

        if char == "'":
            in_string = True
            current.append(char)
            continue

        if char == ",":
            tokens.append("".join(current).strip())
            current = []
            continue

        current.append(char)

    if current:
        tokens.append("".join(current).strip())

    return tokens


def normalize_token(token: str) -> str | None:
    if token.upper() == "NULL":
        return None

    if token.startswith("'") and token.endswith("'"):
        stripped = token[1:-1]
        return stripped.replace("''", "'")

    return token


def build_performance_payloads(statement: InsertStatement) -> list[dict[str, object]]:
    column_index = {name: idx for idx, name in enumerate(statement.columns)}

    def get(row: list[str | None], key: str) -> str | None:
        idx = column_index[key]
        return row[idx]

    payloads: list[dict[str, object]] = []
    for row in statement.rows:
        payloads.append(
            {
                "legacy_id": int(get(row, "id")),
                "load_phase": map_load_phase(get(row, "trip")),
                "load_completion": map_load_completion(get(row, "LoadType")),
                "fo_number": safe_string(get(row, "FOnumber")),
                "operation_id": maybe_int(get(row, "operation_id")),
                "driver_truck_id": maybe_int(get(row, "driver_truck_id")),
                "dispatch_date": safe_string(get(row, "DateDispach")),
                "origin_id": maybe_int(get(row, "orgion_id")),
                "destination_id": maybe_int(get(row, "destination_id")),
                "distance_with_cargo": format_decimal(get(row, "DistanceWCargo")),
                "tonkm": format_decimal(get(row, "tonkm")),
                "distance_without_cargo": format_decimal(get(row, "DistanceWOCargo")),
                "cargo_volume_mt": format_decimal(get(row, "CargoVolumMT")),
                "fuel_in_liter": format_decimal(get(row, "fuelInLitter")),
                "fuel_in_birr": format_decimal(get(row, "fuelInBirr")),
                "perdiem": format_decimal(get(row, "perdiem")),
                "work_on_going": format_decimal(get(row, "workOnGoing")),
                "other": format_decimal(get(row, "other")),
                "comment": nullable_trimmed_string(get(row, "comment")),
                "status": maybe_int(get(row, "satus")),
                "is_returned": bool((maybe_int(get(row, "is_returned")) or 0) == 1),
                "returned_date": safe_string(get(row, "returned_date")),
                "user_id": maybe_int(get(row, "user_id")),
                "deleted_at": safe_string(get(row, "deleted_at")),
                "created_at": safe_string(get(row, "created_at")),
                "updated_at": safe_string(get(row, "updated_at")),
            }
        )

    return payloads


def build_outsource_payloads(statement: InsertStatement) -> list[dict[str, object]]:
    column_index = {name: idx for idx, name in enumerate(statement.columns)}

    def get(row: list[str | None], key: str) -> str | None:
        idx = column_index[key]
        return row[idx]

    payloads: list[dict[str, object]] = []
    for row in statement.rows:
        payloads.append(
            {
                "legacy_id": int(get(row, "id")),
                "outsource_id": maybe_int(get(row, "outsource_id")),
                "trip": maybe_int(get(row, "trip")),
                "load_type": maybe_int(get(row, "LoadType")),
                "fo_number": safe_string(get(row, "fonumber")),
                "operation_id": maybe_int(get(row, "operation_id")),
                "driver_name": nullable_trimmed_string(get(row, "driver_name")),
                "plate_number": nullable_trimmed_string(get(row, "plate_number")),
                "dispatch_date": safe_string(get(row, "DateDispach")),
                "origin_id": maybe_int(get(row, "orgion_id")),
                "destination_id": maybe_int(get(row, "destination_id")),
                "tonkm": format_decimal(get(row, "tonkm")),
                "tariff": format_decimal(get(row, "tariff")),
                "distance_with_cargo": format_decimal(get(row, "DistanceWCargo")),
                "distance_without_cargo": format_decimal(get(row, "DistanceWOCargo")),
                "cargo_volume_mt": format_decimal(get(row, "CargoVolumMT")),
                "comment": nullable_trimmed_string(get(row, "comment")),
                "status": maybe_int(get(row, "satus")),
                "user_id": maybe_int(get(row, "user_id")),
                "deleted_at": safe_string(get(row, "deleted_at")),
                "created_at": safe_string(get(row, "created_at")),
                "updated_at": safe_string(get(row, "updated_at")),
            }
        )

    return payloads


def build_operations_payloads(statement: InsertStatement) -> list[dict[str, object]]:
    column_index = {name: idx for idx, name in enumerate(statement.columns)}

    def get(row: list[str | None], key: str) -> str | None:
        idx = column_index[key]
        return row[idx]

    payloads: list[dict[str, object]] = []
    for row in statement.rows:
        payloads.append(
            {
                "legacy_id": int(get(row, "id")),
                "operationid": safe_string(get(row, "operationid")),
                "customer_id": maybe_int(get(row, "customer_id")),
                "startdate": safe_string(get(row, "startdate")),
                "region_id": maybe_int(get(row, "region_id")),
                "volume": format_decimal(get(row, "volume")),
                "cargotype": maybe_int(get(row, "cargotype")),
                "km": format_decimal(get(row, "km")),
                "tariff": format_decimal(get(row, "tariff")),
                "status": maybe_int(get(row, "status")),
                "closed": maybe_int(get(row, "closed")),
                "enddate": safe_string(get(row, "enddate")),
                "remark": nullable_trimmed_string(get(row, "remark")),
                "user_id": maybe_int(get(row, "user_id")),
                "deleted_at": safe_string(get(row, "deleted_at")),
                "created_at": safe_string(get(row, "created_at")),
                "updated_at": safe_string(get(row, "updated_at")),
            }
        )

    return payloads


def map_load_phase(value: str | None) -> str | None:
    numeric = maybe_int(value)
    if numeric is not None:
        return "main" if numeric == 1 else "return"

    if value is None:
        return None

    lowered = value.strip().lower()
    if lowered in {"main", "return"}:
        return lowered

    return None


def map_load_completion(value: str | None) -> str | None:
    numeric = maybe_int(value)
    if numeric is not None:
        return "full" if numeric == 1 else "partial"

    if value is None:
        return None

    lowered = value.strip().lower()
    if lowered in {"full", "partial"}:
        return lowered

    return None


def format_decimal(value: str | None) -> str | None:
    if value is None or value == "":
        return None

    try:
        decimal_value = Decimal(str(value))
    except InvalidOperation:
        return None

    quantized = decimal_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return format(quantized, ".2f")


def maybe_int(value: str | None) -> int | None:
    if value is None or value == "":
        return None

    try:
        return int(str(value))
    except ValueError:
        return None


def safe_string(value: str | None) -> str | None:
    if value is None:
        return None

    stripped = value.strip()
    return stripped if stripped else None


def nullable_trimmed_string(value: str | None) -> str | None:
    text = safe_string(value)
    if text is None:
        return None

    return " ".join(text.split())


def write_json(path: Path, payload: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    json_text = json.dumps(payload, indent=2, ensure_ascii=True)
    path.write_text(json_text + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
