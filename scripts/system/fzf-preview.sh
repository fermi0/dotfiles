#!/usr/bin/env bash

# Smart FZF preview script
# Only shows preview for actual files, uses appropriate viewer per file type

file="$1"

# Check if the input is an actual file
if [[ ! -f "$file" ]]; then
    exit 0  # Exit silently, no preview for non-files
fi

# Get file mime type
mime_type=$(file --mime-type -b "$file")

# Handle images with kitty
if [[ $mime_type == image/* ]]; then
    kitty +kitten icat --clear --transfer-mode=memory --stdin=no --place="${FZF_PREVIEW_COLUMNS}x${FZF_PREVIEW_LINES}@0x0" "$file"
    exit 0
fi

# Handle PDFs
if [[ $mime_type == application/pdf ]]; then
    if command -v pdftotext &> /dev/null; then
        pdftotext -l 3 "$file" - 2>/dev/null
    else
        echo "PDF: $file"
        echo "Install poppler-utils for PDF preview"
    fi
    exit 0
fi

# Handle archives
if [[ $mime_type == application/*zip* ]] || [[ $mime_type == application/*tar* ]] || 
   [[ $mime_type == application/*gzip* ]] || [[ $mime_type == application/*bzip* ]] ||
   [[ $mime_type == application/x-xz* ]] || [[ $mime_type == application/x-rar* ]]; then
    case "$file" in
        *.tar.gz|*.tgz) tar -tzf "$file" 2>/dev/null ;;
        *.tar.bz2|*.tbz2) tar -tjf "$file" 2>/dev/null ;;
        *.tar.xz|*.txz) tar -tJf "$file" 2>/dev/null ;;
        *.tar) tar -tf "$file" 2>/dev/null ;;
        *.zip) unzip -l "$file" 2>/dev/null ;;
        *.rar) unrar l "$file" 2>/dev/null ;;
        *.7z) 7z l "$file" 2>/dev/null ;;
        *) echo "Archive: $file" ;;
    esac
    exit 0
fi

# Handle media files
if [[ $mime_type == video/* ]] || [[ $mime_type == audio/* ]]; then
    if command -v mediainfo &> /dev/null; then
        mediainfo "$file"
    elif command -v ffprobe &> /dev/null; then
        ffprobe -hide_banner "$file" 2>&1
    else
        echo "Media file: $file"
        echo "Install mediainfo or ffmpeg for media preview"
    fi
    exit 0
fi

# Handle office documents
if [[ $mime_type == application/vnd.* ]] || [[ $mime_type == application/*officedocument* ]]; then
    if command -v pandoc &> /dev/null; then
        pandoc -s "$file" -t plain 2>/dev/null
    else
        echo "Office document: $file"
        echo "Install pandoc for document preview"
    fi
    exit 0
fi

# Handle binary files
if [[ $mime_type == application/octet-stream ]] || 
   [[ $mime_type == application/x-executable* ]] ||
   [[ $mime_type == application/x-sharedlib* ]]; then
    if command -v hexyl &> /dev/null; then
        hexyl -n 512 "$file"
    else
        file "$file"
        echo ""
        hexdump -C "$file" | head -20
    fi
    exit 0
fi

# Default: use bat for text files
if command -v bat &> /dev/null; then
    bat --color=always --style=numbers,changes --line-range=:500 "$file"
else
    # Fallback to cat with head
    head -500 "$file"
fi
