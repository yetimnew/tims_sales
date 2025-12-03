#!/usr/bin/env python3
"""Align performance dispatch dates with the prior returned date.

Usage:
    python scripts/align_performance_dispatch_dates.py --input database/seeders/data/legacy_performances.json \
        --output database/seeders/data/legacy_performances_aligned.json

For each driver_truck_id, performances are sorted by dispatch_date (and created_at as
secondary). Every subsequent record with a `returned_date` will have its `dispatch_date`
set to the previous record's `returned_date` to create a continuous timeline.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

DatetimePair = Tuple[int, Dict[str, Any]]

DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Align performance dispatch dates.")
    parser.add_argument(
        "--input",
        required=True,
        type=Path,
        help="Path to the input performances JSON file.",
    )
    parser.add_argument(
        "--output",
        required=False,
        type=Path,
        help="Path to write the aligned JSON file. Defaults to overwriting the input file.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without writing a file.",
    )
    return parser.parse_args()


def parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if value is None:
        return None

    value = value.strip()
    if not value:
        return None

    try:
        return datetime.strptime(value, DATE_FORMAT)
    except ValueError:
        return None


def align_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    grouped: Dict[Any, List[DatetimePair]] = defaultdict(list)

    for index, record in enumerate(records):
        driver_truck_id = record.get("driver_truck_id")
        grouped[driver_truck_id].append((index, record))

    result = deepcopy(records)

    for entries in grouped.values():
        entries.sort(key=lambda item: (
            parse_datetime(item[1].get("dispatch_date")) or datetime.min,
            parse_datetime(item[1].get("created_at")) or datetime.min,
            item[0],
        ))

        previous_return: Optional[datetime] = None

        for position, record in entries:
            dispatch_dt = parse_datetime(record.get("dispatch_date"))
            returned_dt = parse_datetime(record.get("returned_date"))
            is_returned = record.get("is_returned")

            if previous_return and (dispatch_dt is None or dispatch_dt != previous_return):
                result[position]["dispatch_date"] = previous_return.strftime(DATE_FORMAT)

            if is_returned and returned_dt:
                previous_return = returned_dt

    return result


def main() -> int:
    args = parse_args()

    if not args.input.exists():
        print(f"Input file not found: {args.input}", file=sys.stderr)
        return 1

    with args.input.open("r", encoding="utf-8") as raw:
        records = json.load(raw)

    if not isinstance(records, list):
        print("Expected the JSON file to contain a list of records.", file=sys.stderr)
        return 1

    aligned_records = align_records(records)

    if args.dry_run:
        total_adjusted = sum(
            1
            for before, after in zip(records, aligned_records)
            if before.get("dispatch_date") != after.get("dispatch_date")
        )
        print(f"Dry run: {total_adjusted} dispatch dates would be adjusted.")
        return 0

    output_path = args.output or args.input
    with output_path.open("w", encoding="utf-8") as writer:
        json.dump(aligned_records, writer, ensure_ascii=False, indent=2)
        writer.write("\n")

    print(f"Aligned performances written to {output_path}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
