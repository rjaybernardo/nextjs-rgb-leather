import { describe, expect, it } from "vitest";

import { csvCell, toCsv } from "@/lib/csv";

describe("csvCell", () => {
  it("quotes values and doubles inner quotes", () => {
    expect(csvCell('Juan "JDC" dela Cruz')).toBe('"Juan ""JDC"" dela Cruz"');
    expect(csvCell("Quezon City, Metro Manila")).toBe('"Quezon City, Metro Manila"');
  });

  it("writes empty cells for null and undefined", () => {
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
  });

  it.each(["=HYPERLINK(\"x\")", "+639171234567", "-2", "@SUM(A1)"])(
    "neutralizes formula-like value %s",
    (value) => {
      expect(csvCell(value).startsWith(`"'`)).toBe(true);
    },
  );
});

describe("toCsv", () => {
  it("starts with a BOM and uses CRLF line endings", () => {
    const csv = toCsv([
      ["Name", "Total"],
      ["Peñaflor", 1449],
    ]);

    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toBe('﻿"Name","Total"\r\n"Peñaflor","1449"');
  });
});
