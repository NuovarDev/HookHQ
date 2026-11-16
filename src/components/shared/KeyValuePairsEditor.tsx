"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type KeyValuePair = { key: string; value: string };

export function keyValuePairsFromRecord(record: Record<string, string> | undefined | null): KeyValuePair[] {
  return Object.entries(record ?? {}).map(([key, value]) => ({ key, value }));
}

export function recordFromKeyValuePairs(pairs: KeyValuePair[]): Record<string, string> {
  return Object.fromEntries(pairs.filter(pair => pair.key.trim()).map(pair => [pair.key.trim(), pair.value]));
}

type Props = {
  id: string;
  value: KeyValuePair[];
  onChange: (value: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
};

export default function KeyValuePairsEditor({
  id,
  value,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  addLabel = "Add pair",
}: Props) {
  const pairs = value.length > 0 ? value : [{ key: "", value: "" }];

  function updatePair(index: number, field: keyof KeyValuePair, nextValue: string) {
    onChange(pairs.map((pair, pairIndex) => (pairIndex === index ? { ...pair, [field]: nextValue } : pair)));
  }

  return (
    <div className="space-y-2">
      {pairs.map((pair, index) => (
        <div
          key={`${id}-${index}`}
          className={
            pairs.length === 1 ? "grid grid-cols-2 gap-2" : "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.25rem] gap-2"
          }
        >
          <Input
            aria-label={`${keyPlaceholder} ${index + 1}`}
            value={pair.key}
            onChange={event => updatePair(index, "key", event.target.value)}
            placeholder={keyPlaceholder}
          />
          <Input
            aria-label={`${valuePlaceholder} ${index + 1}`}
            value={pair.value}
            onChange={event => updatePair(index, "value", event.target.value)}
            placeholder={valuePlaceholder}
          />
          {index > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${pair.key || `pair ${index + 1}`}`}
              onClick={() => onChange(pairs.filter((_, pairIndex) => pairIndex !== index))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...pairs, { key: "", value: "" }])}>
        <Plus className="h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}
