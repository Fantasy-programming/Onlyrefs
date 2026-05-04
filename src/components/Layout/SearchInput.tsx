import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import {
  RiText,
  RiPriceTag3Line,
  RiLinkM,
  RiChat3Line,
  RiFileTextLine,
} from 'react-icons/ri';
import { LuFileType } from 'react-icons/lu';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { SearchScope } from '@/state/hook';
import { Ref } from '@/lib/types';

// Search scope options with icons
const SEARCH_SCOPES: {
  value: SearchScope;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: 'name', label: 'Name', icon: <RiText className="h-4 w-4" /> },
  {
    value: 'extension',
    label: 'Extension',
    icon: <LuFileType className="h-4 w-4" />,
  },
  {
    value: 'tags',
    label: 'Tags',
    icon: <RiPriceTag3Line className="h-4 w-4" />,
  },
  { value: 'url', label: 'URL', icon: <RiLinkM className="h-4 w-4" /> },
  {
    value: 'comment',
    label: 'Comment',
    icon: <RiChat3Line className="h-4 w-4" />,
  },
  {
    value: 'note',
    label: 'Note',
    icon: <RiFileTextLine className="h-4 w-4" />,
  },
];

interface SearchInputProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchScope: SearchScope;
  onSearchScopeChange: (scope: SearchScope) => void;
  // For autocomplete suggestions
  items?: Ref[];
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  searchTerm,
  onSearchChange,
  searchScope,
  onSearchScopeChange,
  items = [],
  className,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const currentScope = SEARCH_SCOPES.find((s) => s.value === searchScope);

  // Generate autocomplete suggestions based on search term and scope
  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];

    const term = searchTerm.toLowerCase();
    const results = new Set<string>();

    items.forEach((item) => {
      const metadata = item.metadata;
      const refType = metadata.ref_type;

      switch (searchScope) {
        case 'name':
          if (metadata.name?.toLowerCase().includes(term)) {
            results.add(metadata.name);
          }
          break;
        case 'extension':
          // Check file_name for extension
          if ('file_name' in metadata && metadata.file_name) {
            const ext = metadata.file_name.split('.').pop()?.toLowerCase();
            if (ext && ext.includes(term)) {
              results.add(ext);
            }
          }
          break;
        case 'tags':
          if (metadata.tags) {
            metadata.tags.forEach((tag) => {
              if (tag.toLowerCase().includes(term)) {
                results.add(tag);
              }
            });
          }
          break;
        case 'url':
          // Check source_url or source_uri
          if (
            'source_url' in metadata &&
            metadata.source_url?.toLowerCase().includes(term)
          ) {
            results.add(metadata.source_url);
          }
          if (
            'source_uri' in metadata &&
            metadata.source_uri?.toLowerCase().includes(term)
          ) {
            results.add(metadata.source_uri);
          }
          break;
        case 'comment':
          // Check note_text (annotation/comment field)
          if (metadata.note_text?.toLowerCase().includes(term)) {
            results.add(metadata.note_text.slice(0, 50));
          }
          break;
        case 'note':
          // For note refs, check the content field on the ref itself
          if (refType === 'note' && 'content' in item) {
            const noteContent = (item as { content: string }).content;
            if (noteContent?.toLowerCase().includes(term)) {
              results.add(noteContent.slice(0, 50));
            }
          }
          break;
      }
    });

    return Array.from(results).slice(0, 8);
  }, [searchTerm, searchScope, items]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          onSearchChange(suggestions[selectedIndex]);
          setShowSuggestions(false);
          setSelectedIndex(-1);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Highlight matching text in suggestions
  const highlightMatch = (text: string, query: string) => {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <span className="text-primary font-medium">
          {text.slice(index, index + query.length)}
        </span>
        {text.slice(index + query.length)}
      </>
    );
  };

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'bg-muted/50 flex items-center rounded-full transition-all',
          isFocused && 'bg-background ring-2 ring-blue-500/20',
          isFocused ? 'w-[280px]' : 'w-[200px]',
        )}
      >
        {/* Search Scope Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="text-muted-foreground hover:text-foreground flex items-center gap-0.5 py-2 pr-1 pl-3 transition-colors focus:outline-none"
              type="button"
            >
              <FiSearch className="h-4 w-4" />
              <ChevronDownIcon className="h-3 w-3 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-xs">
              Search Scope:
            </DropdownMenuLabel>
            {SEARCH_SCOPES.map((scope) => (
              <DropdownMenuItem
                key={scope.value}
                onClick={() => onSearchScopeChange(scope.value)}
                className="flex items-center gap-2"
              >
                {scope.icon}
                <span>{scope.label}</span>
                {searchScope === scope.value && (
                  <CheckIcon className="ml-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search Input */}
        <Input
          ref={inputRef}
          type="text"
          placeholder={`Search by ${currentScope?.label.toLowerCase()}...`}
          value={searchTerm}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            setIsFocused(true);
            if (searchTerm.length >= 2) setShowSuggestions(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          className="h-8 flex-1 border-0 bg-transparent pr-8 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
        />

        {/* Clear Button */}
        {searchTerm && (
          <button
            onClick={() => {
              onSearchChange('');
              setShowSuggestions(false);
              inputRef.current?.focus();
            }}
            className="text-muted-foreground hover:text-foreground absolute right-3 p-0.5"
            type="button"
          >
            <FiX className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="bg-popover border-border absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-md border shadow-md"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                onSearchChange(suggestion);
                setShowSuggestions(false);
                setSelectedIndex(-1);
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                index === selectedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-muted/50',
              )}
            >
              {currentScope?.icon}
              <span className="truncate">
                {highlightMatch(suggestion, searchTerm)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
