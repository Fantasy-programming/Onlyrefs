import React, { useState } from 'react';
import { Check, Copy, Search, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ColorSwatchDropdownProps {
  color: string;
  percentage?: number;
  onFindSimilar?: (color: string) => void;
  onSetPrimary?: (color: string) => void;
  className?: string;
}

// Helper functions for color conversion
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const rgbToHsl = (
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const rgbToHsv = (
  r: number,
  g: number,
  b: number,
): { h: number; s: number; v: number } => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;

  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
};

const rgbToHwb = (
  r: number,
  g: number,
  b: number,
): { h: number; w: number; b: number } => {
  const { h } = rgbToHsl(r, g, b);
  const w = Math.round((Math.min(r, g, b) / 255) * 100);
  const bl = Math.round((1 - Math.max(r, g, b) / 255) * 100);
  return { h, w, b: bl };
};

const rgbToCmyk = (
  r: number,
  g: number,
  b: number,
): { c: number; m: number; y: number; k: number } => {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  const c = k === 1 ? 0 : Math.round(((1 - rNorm - k) / (1 - k)) * 100);
  const m = k === 1 ? 0 : Math.round(((1 - gNorm - k) / (1 - k)) * 100);
  const y = k === 1 ? 0 : Math.round(((1 - bNorm - k) / (1 - k)) * 100);
  return { c, m, y, k: Math.round(k * 100) };
};

export const ColorSwatchDropdown: React.FC<ColorSwatchDropdownProps> = ({
  color,
  percentage,
  onFindSimilar,
  onSetPrimary,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const rgb = hexToRgb(color);
  if (!rgb) return null;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const hwb = rgbToHwb(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

  const colorFormats = [
    { label: `Copy ${color.toUpperCase()}`, value: color.toUpperCase() },
    {
      label: `Copy rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    },
    {
      label: `Copy rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`,
      value: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`,
    },
    {
      label: `Copy hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    },
    {
      label: `Copy hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
      value: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
    },
    {
      label: `Copy hwb(${hwb.h}, ${hwb.w}%, ${hwb.b}%)`,
      value: `hwb(${hwb.h}, ${hwb.w}%, ${hwb.b}%)`,
    },
    {
      label: `Copy cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
      value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
    },
  ];

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedFormat(value);
    setTimeout(() => setCopiedFormat(null), 1500);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'group focus:ring-primary relative h-5 w-5 rounded-full shadow-sm ring-1 ring-black/5 transition-transform ring-inset hover:scale-110 focus:ring-2 focus:outline-none',
            className,
          )}
          style={{ backgroundColor: color }}
          title={percentage ? `${color} (${percentage.toFixed(1)}%)` : color}
        />
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start" side="bottom">
        {/* Color preview header */}
        <div className="bg-muted/50 mb-1 flex items-center gap-2 rounded-md p-2">
          <div
            className="h-8 w-8 rounded-md shadow-sm ring-1 ring-black/10"
            style={{ backgroundColor: color }}
          />
          <div className="flex flex-col">
            <span className="text-xs font-medium">{color.toUpperCase()}</span>
            {percentage !== undefined && (
              <span className="text-muted-foreground text-[10px]">
                {percentage.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Find similar */}
        {onFindSimilar && (
          <button
            onClick={() => {
              onFindSimilar(color);
              setIsOpen(false);
            }}
            className="hover:bg-muted/50 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors"
          >
            <Search className="text-muted-foreground h-3.5 w-3.5" />
            Find Similar Color Items
          </button>
        )}

        {/* Divider */}
        <div className="bg-border my-1 h-px" />

        {/* Color formats */}
        <div className="space-y-0.5">
          {colorFormats.map((format) => (
            <button
              key={format.value}
              onClick={() => handleCopy(format.value)}
              className="hover:bg-muted/50 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors"
            >
              <span className="text-muted-foreground truncate">
                {format.label}
              </span>
              {copiedFormat === format.value ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="text-muted-foreground h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </button>
          ))}
        </div>

        {/* Set as primary */}
        {onSetPrimary && (
          <>
            <div className="bg-border my-1 h-px" />
            <button
              onClick={() => {
                onSetPrimary(color);
                setIsOpen(false);
              }}
              className="hover:bg-muted/50 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors"
            >
              <Palette className="text-muted-foreground h-3.5 w-3.5" />
              Set As Primary Color
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default ColorSwatchDropdown;
