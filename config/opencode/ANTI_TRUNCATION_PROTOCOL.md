# AGENT FILE READING STRATEGY - Anti-Truncation Protocol

## Problem Statement
All tool outputs are capped at 5000 lines/200KB, causing severe truncation even when tools successfully read complete files. This limits agent analysis capabilities.

## Core Principles
1. **Never assume truncation means file is small** - tools can read complete files but output to me is limited
2. **Use multiple approaches** - combine bash, python, and Code Mode strategies
3. **Process locally** - use Code Mode for large file analysis when possible
4. **Extract specific sections** - don't try to view everything at once

## Recommended Reading Strategies

### Strategy 1: Python + Bash (Recommended for most cases)
```bash
# Get file info first
python3 -c "with open('/path/to/file', 'r') as f: print(f'Lines: {len(f.readlines())}')"

# Read specific line ranges
python3 -c "
with open('/path/to/file', 'r') as f:
    lines = f.readlines()
    print('=== LINES 1-50 ===')
    for i, line in enumerate(lines[:50], 1):
        print(f'{i:2d}: {line.rstrip()}')
"

# Extract key sections by pattern
python3 -c "
with open('/path/to/file', 'r') as f:
    content = f.read()
    sections = []
    start = 0
    while True:
        end = content.find('\n\n', start)
        if end == -1:
            sections.append(content[start:])
            break
        sections.append(content[start:end])
        start = end + 2
    
    print(f'Found {len(sections)} sections')
    for i, section in enumerate(sections[:5], 1):
        print(f'Section {i} ({len(section)} chars): {section[:100]}...')
"
```

### Strategy 2: Code Mode for Large Files
```javascript
// For files > 200KB, use Code Mode to process locally
// Process in chunks and return summary/analysis
```

### Strategy 3: Section-by-Section Analysis
```bash
# Read file in logical chunks
awk 'NR<=100' /path/to/file           # First 100 lines
awk 'NR>100 && NR<=200' /path/to/file  # Next 100 lines
# etc.

# Find specific sections
grep -n "pattern" /path/to/file        # Find line numbers
sed -n '100,200p' /path/to/file        # Lines 100-200
```

### Strategy 4: Smart Content Extraction
```bash
# Extract JSON/YAML sections
python3 -c "
import json
import yaml

with open('/path/to/file', 'r') as f:
    content = f.read()
    
# Try to parse as JSON
try:
    data = json.loads(content)
    print('JSON parsed successfully')
    print('Keys:', list(data.keys()))
except:
    pass

# Try to parse as YAML
try:
    data = yaml.safe_load(content)
    print('YAML parsed successfully')
    print('Keys:', list(data.keys()) if isinstance(data, dict) else 'Non-dict')
except:
    pass
"
```

## Agent Workflow for File Analysis

### Step 1: Quick Assessment
```bash
wc -l /path/to/file          # Line count
ls -la /path/to/file          # File size
head -n 20 /path/to/file     # First 20 lines
tail -n 20 /path/to/file     # Last 20 lines
```

### Step 2: Determine Strategy
- **< 200 lines**: Use `read` tool
- **200-5000 lines**: Use `read_smart` with appropriate chunks
- **> 5000 lines**: Use Python + bash strategy
- **Binary/large files**: Use specific extraction methods

### Step 3: Extract Relevant Information
- **Configuration files**: Extract key sections, settings, values
- **Code files**: Extract functions, classes, imports
- **Log files**: Extract error patterns, timestamps, relevant entries
- **Data files**: Extract headers, sample data, structure

### Step 4: Synthesize and Report
- Provide comprehensive analysis despite truncation
- Use multiple reads to build complete picture
- Note what sections were truncated and how to access them

## Specialized Techniques

### For JSON Configuration Files
```bash
# Extract specific configuration sections
python3 -c "
import json
with open('/path/to/config.json', 'r') as f:
    config = json.load(f)
    
# Print structure
def print_structure(obj, indent=0):
    if isinstance(obj, dict):
        for key, value in obj.items():
            print('  ' * indent + f'{key}:')
            print_structure(value, indent + 1)
    elif isinstance(obj, list):
        print('  ' * indent + f'List ({len(obj)} items)')
        if len(obj) > 0 and isinstance(obj[0], dict):
            print_structure(obj[0], indent + 1)
    else:
        print('  ' * indent + f'{type(obj).__name__}')

print_structure(config)
"
```

### For Log Files
```bash
# Extract error patterns
grep -i "error\|exception\|failed" /path/to/log | head -20

# Extract recent entries
tail -n 100 /path/to/log

# Extract by time range
grep "2026-09-06" /path/to/log
```

### For Code Files
```bash
# Extract function definitions
grep -n "def \|function \|class " /path/to/code | head -20

# Extract import statements
grep -n "^import \|^from " /path/to/code

# Extract comments
grep -n "^\/\/ \|^# " /path/to/code | head -20
```

## Emergency Protocol (When truncation is critical)

1. **Split the file**: `split -l 1000 /path/to/file /tmp/piece_`
2. **Process in parallel**: Read multiple pieces concurrently
3. **Reconstruct**: Combine results from different pieces
4. **Direct access**: Suggest user opens file in terminal if absolutely necessary

## Best Practices

1. **Always start with file metadata** (line count, size)
2. **Use appropriate chunk sizes** based on content type
3. **Extract structured data** rather than raw text when possible
4. **Note limitations** in your analysis
5. **Provide alternative access methods** for critical content

## Error Handling

If truncation prevents complete analysis:
1. Document what was truncated
2. Provide alternative access methods
3. Suggest most important sections to examine directly
4. Offer to process specific sections on request