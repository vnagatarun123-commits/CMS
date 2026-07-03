"use client";

import { useState } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem } from "./select";

export default function SelectDemo() {
  const [value, setValue] = useState("medium");

  return (
    <div className="flex items-center justify-center min-h-[200px] bg-background p-6 rounded-xl border">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger placeholder="Select size…" />
        <SelectContent>
          <SelectItem index={0} value="small">Small</SelectItem>
          <SelectItem index={1} value="medium">Medium</SelectItem>
          <SelectItem index={2} value="large">Large</SelectItem>
          <SelectItem index={3} value="xl">Extra Large</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
