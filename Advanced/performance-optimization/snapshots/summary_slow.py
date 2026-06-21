"""Pre-optimization baseline of GET /api/summary — the NAIVE ORM version.

This is the code path the A6 optimization replaced. It loads **every** Expense
row into a fully instrumented SQLAlchemy ORM object and then sums in Python.
For N=50k rows that is 50,000 object materializations + ~2 instrumented
attribute reads per row, dominated by ORM hydration rather than the database.

It is kept here as an *executable snapshot* so ``bench_summary.py
--compare-before`` can measure the real before/after delta on the SAME machine
and Python version — instead of quoting stale numbers from a different run.

This module is NOT wired into the live app; it exists only for benchmarking.
The current (fast) endpoint lives in ``app/routes.py`` and aggregates with a
SQL ``GROUP BY`` over the indexed ``amount_cents`` integer column.
"""

from app.models import Expense  # imported lazily by the bench harness (path set up first)


def summary_slow(db) -> dict:
    """Naive O(N) summary: hydrate all rows, then sum/group in Python.

    Returns the same numeric shape as the optimized endpoint
    (``{total, count, by_category}``) so the benchmark can assert byte-equal
    correctness between the slow and fast paths.
    """
    expenses = db.query(Expense).all()          # hydrate ALL rows as ORM objects
    total = sum(e.amount for e in expenses)      # .amount = amount_cents / 100 (property)
    by_category: dict = {}
    for e in expenses:                           # 2nd full pass + instrumented attr reads
        by_category[e.category] = by_category.get(e.category, 0) + e.amount
    return {
        "total": total,
        "count": len(expenses),
        "by_category": by_category,
    }
