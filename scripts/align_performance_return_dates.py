#!/usr/bin/env python3
"""Set performance return dates to the next dispatch date within each driver assignment.

Usage:
    python scripts/align_performance_return_dates.py --input database/seeders/data/legacy_performances.json \
        [--output database/seeders/data/legacy_performances_aligned_returns.json]

For every driver_truck_id, this script sorts performances by dispatch_date (and created_at as
secondary key), then assigns:

- is_returned = true for every record.
- returned_date = the next record's dispatch_date.

The final record in each sequence keeps its existing returned_date. Use --fill-last to set the
final record's returned_date to its own dispatch_date when missing.
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

DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

Record = Dict[str, Any]
GroupedRecord = Tuple[int, Record]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Align performance return dates with next dispatch dates.")
    parser.add_argument("--input", required=True, type=Path, help="Path to the performances JSON file.")
    parser.add_argument("--output", type=Path, help="Destination file. Defaults to overwriting the input file.")
    parser.add_argument("--dry-run", action="store_true", help="Preview adjustments without writing.")
    parser.add_argument(
        "--fill-last",
        action="store_true",
        help="When the last record in a sequence has no returned_date, set it to its own dispatch_date.",
    )
    return parser.parse_args()


def parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if value is None:
        return None

    value = value.strip()
    if not value:
        return None

    for fmt in (DATE_FORMAT, "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue

    return None


def as_timestamp_string(dt: Optional[datetime], fallback: Optional[str] = None) -> Optional[str]:
    if dt is None:
        return fallback

    return dt.strftime(DATE_FORMAT)


def align_returns(records: List[Record], fill_last: bool) -> List[Record]:
    grouped: Dict[Any, List[GroupedRecord]] = defaultdict(list)

    for index, record in enumerate(records):
        grouped[record.get("driver_truck_id")].append((index, record))

    updated = deepcopy(records)
    adjustments = 0

    for entries in grouped.values():
        entries.sort(key=lambda pair: (
            parse_datetime(pair[1].get("dispatch_date")) or datetime.min,
            parse_datetime(pair[1].get("created_at")) or datetime.min,
            pair[0],
        ))

        for offset, (original_index, current) in enumerate(entries):
            next_record: Optional[GroupedRecord] = entries[offset + 1] if offset + 1 < len(entries) else None
            next_dispatch = parse_datetime(next_record[1].get("dispatch_date")) if next_record else None

            if not next_record and fill_last and parse_datetime(current.get("returned_date")) is None:
                next_dispatch = parse_datetime(current.get("dispatch_date"))

            prev_return = updated[original_index].get("returned_date")
            new_return = as_timestamp_string(next_dispatch, prev_return)

            if new_return != prev_return:
                updated[original_index]["returned_date"] = new_return
                adjustments += 1

            if updated[original_index].get("is_returned") is not True:
                updated[original_index]["is_returned"] = True
                adjustments += 1

    return updated, adjustments


def main() -> int:
    args = parse_args()

    if not args.input.exists():
        print(f"Input file not found: {args.input}", file=sys.stderr)
        return 1

    with args.input.open("r", encoding="utf-8") as handle:
        records = json.load(handle)

    if not isinstance(records, list):
        print("Input JSON must be a list of performance objects.", file=sys.stderr)
        return 1

    updated_records, adjustments = align_returns(records, args.fill_last)

    if args.dry_run:
        changed = sum(1 for before, after in zip(records, updated_records) if before != after)
        print(f"Dry run: {changed} records would be modified across {adjustments} field assignments.")
        return 0

    output_path = args.output or args.input
    with output_path.open("w", encoding="utf-8") as out:
        json.dump(updated_records, out, ensure_ascii=False, indent=2)
        out.write("\n")

    print(f"Aligned return dates written to {output_path} ({adjustments} field adjustments).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
