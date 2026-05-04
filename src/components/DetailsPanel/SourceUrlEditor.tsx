import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface SourceUrlEditorProps {
  url: string | null | undefined;
  onChange: (url: string | null) => void;
  placeholder?: string;
  className?: string;
}

export const SourceUrlEditor: React.FC<SourceUrlEditorProps> = ({
  url,
  onChange,
  placeholder = 'https://...',
  className,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(url || '');

  // Sync with external changes
  useEffect(() => {
    setValue(url || '');
  }, [url]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed !== (url || '')) {
      onChange(trimmed || null);
    }
    setIsEditing(false);
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank');
    }
  };

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setValue(url || '');
              setIsEditing(false);
            }
          }}
          className="h-7 flex-1 text-xs"
          placeholder={placeholder}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-1.5 rounded-md transition-colors',
        className,
      )}
    >
      <button
        onClick={() => setIsEditing(true)}
        className={cn(
          'bg-muted/30 hover:bg-muted/50 flex-1 truncate rounded-md px-2 py-1.5 text-left text-xs transition-colors',
          !url && 'text-muted-foreground',
        )}
      >
        {url || placeholder}
      </button>
      {url && isValidUrl(url) && (
        <button
          onClick={handleOpenLink}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md p-1.5 transition-colors"
          title="Open Link in Browser"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default SourceUrlEditor;
