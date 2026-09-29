#!/usr/bin/env python3
"""
Vault Note Creator - Creates new vault notes using templates with automatic index updates
"""

import os
import re
import sys
import json
from datetime import datetime
from pathlib import Path
import subprocess
import shlex

def parse_arguments():
    """Parse command line arguments"""
    if len(sys.argv) < 3:
        print("Usage: vault-note-creator.py <template-name> \"content\"")
        sys.exit(1)
    
    template_name = sys.argv[1]
    content = ' '.join(sys.argv[2:])  # Join all remaining arguments as content
    
    return template_name, content

def get_template_path(template_name):
    """Get the full path to the template file"""
    # Assuming vault is at /home/shared/Zurnel
    vault_path = Path("/home/shared/Zurnel")
    template_path = vault_path / "templates" / f"{template_name}.md"
    
    if not template_path.exists():
        print(f"Error: Template '{template_name}' not found")
        print(f"Available templates: Fleeting, Literature, Permanent, Creative Brainstorm")
        sys.exit(1)
    
    return template_path

def read_template(template_path):
    """Read and parse the template file"""
    with open(template_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract frontmatter if present
    frontmatter_match = re.match(r'^---\s*\n([\s\S]*?)\n---\s*\n', content)
    template_body = content
    
    if frontmatter_match:
        frontmatter_yaml = frontmatter_match.group(1)
        template_body = content[frontmatter_match.end():]
    else:
        frontmatter_yaml = ""
    
    return frontmatter_yaml, template_body

def generate_filename(template_name, content):
    """Generate a filename based on template and content"""
    # Create timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d")
    
    # Extract first few words from content for filename
    content_words = content.split()[:3]
    content_slug = '-'.join(word.lower().replace(' ', '-').replace(',', '') for word in content_words)
    
    # Clean up the slug
    content_slug = re.sub(r'[^\w-]', '', content_slug)
    
    filename = f"{timestamp}-{template_name.lower()}-{content_slug}.md"
    return filename

def insert_content_into_template(template_body, content):
    """Insert content into the template's designated area"""
    # Look for content insertion markers
    content_markers = [
        r"## Main Idea\s*\n<%[^%]*%>\s*\n<%[^%]*%>",  # Fleeting template
        r"## Context\s*\n<%[^%]*%>\s*\n<%[^%]*%>",    # Literature template  
        r"## Key Points\s*\n1\.\s*\n",               # Permanent template
        r"## Main Idea\s*\n<%[^%]*%>"                # Creative template
    ]
    
    # Try to find and replace content insertion areas
    modified_body = template_body
    
    # Simple approach: replace first content area found
    for marker in content_markers:
        match = re.search(marker, template_body, re.MULTILINE)
        if match:
            # Replace the marker with the content
            replacement = content
            modified_body = template_body[:match.start()] + replacement + template_body[match.end():]
            break
    
    # If no specific marker found, append content at the end
    if modified_body == template_body:
        modified_body = template_body + f"\n\n## Added Content\n{content}"
    
    return modified_body

def update_index_files(filename, template_name):
    """Update relevant index files with wikilinks"""
    vault_path = Path("/home/shared/Zurnel")
    
    # Update template index
    template_index_path = vault_path / "templates" / "_index.md"
    if template_index_path.exists():
        with open(template_index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Add link to the new template usage
        link_entry = f"- `[[{filename}]]` — Created using {template_name} template\n"
        
        # Insert after template descriptions
        insertion_point = content.find("## Files")
        if insertion_point != -1:
            insertion_point = content.find("\n", insertion_point)
            modified_content = content[:insertion_point] + "\n" + link_entry + content[insertion_point:]
            
            with open(template_index_path, 'w', encoding='utf-8') as f:
                f.write(modified_content)
    
    # Update master index if it's a permanent note
    if template_name.lower() == "permanent":
        master_index_path = vault_path / "_index.md"
        if master_index_path.exists():
            with open(master_index_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Add link to permanent notes section
            link_entry = f"- `[[{filename}]]` — Permanent note\n"
            
            # Find permanent notes section or add it
            if "Permanent" in content:
                insertion_point = content.find("Permanent")
                insertion_point = content.find("\n", insertion_point) + 1
            else:
                insertion_point = len(content)
            
            modified_content = content[:insertion_point] + "\n" + link_entry + content[insertion_point:]
            
            with open(master_index_path, 'w', encoding='utf-8') as f:
                f.write(modified_content)

def create_note(template_name, content):
    """Main function to create a new vault note"""
    try:
        # Get template path
        template_path = get_template_path(template_name)
        
        # Read template
        frontmatter, template_body = read_template(template_path)
        
        # Generate filename
        filename = generate_filename(template_name, content)
        
        # Insert content into template
        modified_body = insert_content_into_template(template_body, content)
        
        # Create full content with frontmatter
        full_content = f"---\n{frontmatter}\n---\n{modified_body}".strip()
        
        # Write the note to vault
        vault_path = Path("/home/shared/Zurnel")
        note_path = vault_path / filename
        
        with open(note_path, 'w', encoding='utf-8') as f:
            f.write(full_content)
        
        # Update index files
        update_index_files(filename, template_name)
        
        print(f"✅ Successfully created note: {filename}")
        print(f"📍 Location: {note_path}")
        print(f"🔗 Template used: {template_name}")
        
        return str(note_path)
        
    except Exception as e:
        print(f"❌ Error creating note: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    template_name, content = parse_arguments()
    create_note(template_name, content)