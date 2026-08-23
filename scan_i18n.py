import re
import os
import glob

files = glob.glob('src/pages/**/*.tsx', recursive=True)

results = []

# Regex for hardcoded attributes: placeholder="...", title="...", label="..."
attr_regex = re.compile(r'\b(placeholder|title|label)="([^"{}\[\]]+)"')

# Regex for JSX text: >Text< (excluding tags, braces, and empty space)
# We look for text between > and < that doesn't start with { and isn't just whitespace
jsx_text_regex = re.compile(r'>([^<>{}\n\s][^<>{}\n]*[^<>{}\n\s]|[^<>{}\n\s])<')

# Regex for SelectItem specifically as requested
select_item_regex = re.compile(r'<SelectItem[^>]*>([^<>{}\n\s][^<>{}\n]*[^<>{}\n\s]|[^<>{}\n\s])</SelectItem>')

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    literals = []
    for i, line in enumerate(lines):
        line_num = i + 1
        
        # Check attributes
        for match in attr_regex.finditer(line):
            attr, value = match.groups()
            # Basic heuristic to avoid CSS classes or technical IDs in title/label if they are very short or camelCase without spaces
            if ' ' in value or any(c.islower() for c in value) and any(c.isupper() for c in value) == False:
                 literals.append((line_num, f'{attr}="{value}"'))
        
        # Check JSX text
        for match in jsx_text_regex.finditer(line):
            value = match.group(1).strip()
            if value and not value.startswith('{') and not value.endswith('}'):
                literals.append((line_num, value))
                
        # Check SelectItem (redundant if JSX text captures it, but to be sure)
        for match in select_item_regex.finditer(line):
            value = match.group(1).strip()
            # If not already caught by jsx_text (which it likely is)
            if not any(l[0] == line_num and value in l[1] for l in literals):
                literals.append((line_num, value))

    if literals:
        results.append({
            'file': file_path,
            'count': len(literals),
            'literals': literals
        })

# Sort by count descending
results.sort(key=lambda x: x['count'], reverse=True)

# Top 15
top_15 = results[:15]

for item in top_15:
    print(f"FILE_SUMMARY: {item['file']} ({item['count']} literals)")
    for line_num, lit in item['literals'][:2]:
        print(f"{item['file']}:{line_num} -> {lit}")
