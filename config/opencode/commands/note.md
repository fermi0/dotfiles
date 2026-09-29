---
description: Create a new vault note using templates with automatic index updates
agent: general
model: local/Ornith-1.5-35B-A3B-APEX-Quality#balanced
---

Create a new vault note using the specified template with the provided content.

Template options:
- Fleeting: Quick capture notes with tags and contextual structure
- Literature: Notes from books/articles/videos with citation support  
- Permanent: Atomic, evergreen notes for long-term knowledge
- Creative Brainstorm: Idea dumps and creative thinking sessions

Usage: /note <template-name> "content to insert"

The command will:
1. Parse template name and content from arguments
2. Create timestamped note file in vault root
3. Apply content to template's designated area
4. Update relevant index files with wikilinks
5. Handle template-specific frontmatter

$ARGUMENTS