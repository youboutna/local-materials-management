import React, { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, RotateCcw, X } from "lucide-react";
import Autocomplete, { AutocompleteOption } from "@/components/ui/autocomplete";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterField {
  key: string;
  label: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export interface ResponsiveFiltersProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void; // New prop for Enter key press
  searchPlaceholder?: string;
  filters: FilterField[];
  onReset: () => void;
  resultCount?: number;
  className?: string;
  showMobileDropdown?: boolean;
  autocompleteOptions?: AutocompleteOption[];
  onAutocompleteSelect?: (option: AutocompleteOption) => void;
}

const ResponsiveFilters: React.FC<ResponsiveFiltersProps> = ({
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Rechercher...",
  filters,
  onReset,
  resultCount,
  className = "",
  showMobileDropdown = true,
  autocompleteOptions = [],
  onAutocompleteSelect,
}) => {
  // Handle search input change - pass through immediately
  const handleSearchChange = useCallback(
    (value: string) => {
      if (onSearchChange) {
        onSearchChange(value);
      }
    },
    [onSearchChange]
  );

  // Handle Enter key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onSearchSubmit) {
        onSearchSubmit();
      }
    },
    [onSearchSubmit]
  );

  // Handle autocomplete selection
  const handleAutocompleteSelect = useCallback(
    (option: AutocompleteOption) => {
      onAutocompleteSelect?.(option);
    },
    [onAutocompleteSelect]
  );

  const activeFiltersCount = filters.filter(
    (f) => f.value && f.value !== "all"
  ).length;
  const hasActiveFilters =
    activeFiltersCount > 0 || (searchValue && searchValue.trim().length > 0);

  // Desktop View
  const DesktopFilters = () => (
    <Card className={`hidden md:block ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          {resultCount !== undefined && (
            <span className="text-sm text-muted-foreground">
              {resultCount} résultat{resultCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={`grid gap-4 ${
            filters.length <= 2
              ? "grid-cols-1 lg:grid-cols-3"
              : filters.length === 3
              ? "grid-cols-1 lg:grid-cols-4"
              : "grid-cols-1 lg:grid-cols-5"
          }`}
        >
          {onSearchChange && (
            <div className="relative">
              {autocompleteOptions.length > 0 ? (
                <Autocomplete
                  value={searchValue}
                  onChange={handleSearchChange} // This now only updates local state
                  onSelect={(option) => {
                    // This is called only when an option is selected or Enter is pressed
                    if (onSearchChange) {
                      onSearchChange(option.label);
                    }
                    // Trigger the search
                    if (onSearchSubmit) {
                      onSearchSubmit();
                    }
                    onAutocompleteSelect?.(option);
                  }}
                  options={autocompleteOptions}
                  placeholder={searchPlaceholder}
                  minSearchLength={1}
                  maxSuggestions={6}
                />
              ) : (
                <>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10"
                    autoFocus={true}
                  />
                </>
              )}
            </div>
          )}

          {filters.map((filter) => (
            <Select
              key={filter.key}
              value={filter.value}
              onValueChange={filter.onChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={filter.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {!filter.options.find((opt) => opt.value === "all") && (
                  <SelectItem value="all">
                    Tous les {filter.label.toLowerCase()}
                  </SelectItem>
                )}
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {option.count !== undefined && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {option.count}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          <Button
            variant="outline"
            onClick={onReset}
            className="flex items-center gap-2"
            disabled={!hasActiveFilters}
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {searchValue && searchValue.trim().length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Search className="h-3 w-3" />"{searchValue}"
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => onSearchChange?.("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters
              .filter((f) => f.value && f.value !== "all")
              .map((filter) => {
                const option = filter.options.find(
                  (o) => o.value === filter.value
                );
                return (
                  <Badge
                    key={filter.key}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {filter.label}: {option?.label || filter.value}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => filter.onChange("all")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Mobile View
  const MobileFilters = () => (
    <div className={`md:hidden ${className}`}>
      {/* Search Bar Always Visible */}
      {onSearchChange && (
        <div className="relative mb-4">
          {autocompleteOptions.length > 0 ? (
            <Autocomplete
              value={searchValue}
              onChange={handleSearchChange}
              onSelect={handleAutocompleteSelect}
              options={autocompleteOptions}
              placeholder={searchPlaceholder}
              minSearchLength={1}
              maxSuggestions={6}
            />
          ) : (
            <>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </>
          )}
        </div>
      )}

      {/* Filter Dropdown */}
      {showMobileDropdown && (
        <div className="flex items-center justify-between mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtres
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-4" align="start">
              <DropdownMenuLabel className="flex items-center justify-between">
                Filtres
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="h-auto p-1"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <div className="space-y-4">
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <label className="text-sm font-medium">
                      {filter.label}
                    </label>
                    <Select
                      value={filter.value}
                      onValueChange={filter.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={filter.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {!filter.options.find((opt) => opt.value === "all") && (
                          <SelectItem value="all">
                            Tous les {filter.label.toLowerCase()}
                          </SelectItem>
                        )}
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{option.label}</span>
                              {option.count !== undefined && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs"
                                >
                                  {option.count}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {resultCount !== undefined && (
            <span className="text-sm text-muted-foreground">
              {resultCount} résultat{resultCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {searchValue && searchValue.trim().length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Search className="h-3 w-3" />"{searchValue}"
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => onSearchChange?.("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters
            .filter((f) => f.value && f.value !== "all")
            .map((filter) => {
              const option = filter.options.find(
                (o) => o.value === filter.value
              );
              return (
                <Badge
                  key={filter.key}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {filter.label}: {option?.label || filter.value}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => filter.onChange("all")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
        </div>
      )}
    </div>
  );

  return (
    <>
      <DesktopFilters />
      <MobileFilters />
    </>
  );
};

export default ResponsiveFilters;
