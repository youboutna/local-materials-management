import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AutocompleteOption {
  id: string;
  label: string;
  category?: string;
  subtitle?: string;
}

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (option: AutocompleteOption) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxSuggestions?: number;
  minSearchLength?: number;
  showClearButton?: boolean;
}

const Autocomplete: React.FC<AutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  options,
  placeholder = "Rechercher...",
  className,
  disabled = false,
  maxSuggestions = 8,
  minSearchLength = 2,
  showClearButton = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter options based on search value
  const filteredOptions = React.useMemo(() => {
    if (!value || value.length < minSearchLength) return [];
    
    const query = value.toLowerCase().trim();
    return options
      .filter(option => 
        option.label.toLowerCase().includes(query) ||
        option.subtitle?.toLowerCase().includes(query)
      )
      .slice(0, maxSuggestions);
  }, [value, options, minSearchLength, maxSuggestions]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  // Handle option selection
  const handleOptionSelect = (option: AutocompleteOption) => {
    onChange(option.label);
    onSelect?.(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredOptions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle clear
  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node) &&
          listRef.current && !listRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  const showSuggestions = isOpen && filteredOptions.length > 0 && value.length >= minSearchLength;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= minSearchLength && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pl-10",
            showClearButton && value && "pr-10"
          )}
          autoComplete="off"
        />
        {showClearButton && value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <ul
            ref={listRef}
            className="bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
            role="listbox"
          >
            {filteredOptions.map((option, index) => (
              <li
                key={option.id}
                onClick={() => handleOptionSelect(option)}
                className={cn(
                  "px-3 py-2 cursor-pointer transition-colors border-b border-border/50 last:border-b-0",
                  index === highlightedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  {option.subtitle && (
                    <span className="text-sm text-muted-foreground">{option.subtitle}</span>
                  )}
                  {option.category && (
                    <span className="text-xs text-muted-foreground mt-1">
                      {option.category}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Autocomplete;