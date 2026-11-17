"use client";

import { useState } from "react";
import { parseRollNumber } from "@/lib/fast";

/** Roll number input that shows the campus and batch it reads from it. */
export function RollField({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const roll = parseRollNumber(value);
  const showHint = value.trim().length >= 6;

  return (
    <label className="grid gap-1 text-sm font-medium">
      Roll number
      <input
        name="roll_number"
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="23I-0567"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        aria-describedby="roll-hint"
        className="field uppercase tabular-nums"
      />
      <span id="roll-hint" className="min-h-5 font-normal" aria-live="polite">
        {roll ? (
          <span className="text-ok">
            {roll.value}: {roll.campus.name} campus, batch {roll.year}
          </span>
        ) : showHint ? (
          <span className="text-margin">
            Use the format on your student card, such as 23I-0567.
          </span>
        ) : (
          <span className="text-ink-soft">
            Your campus and batch are filled in from it.
          </span>
        )}
      </span>
    </label>
  );
}
