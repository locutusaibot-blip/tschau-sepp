#!/bin/bash

# Script to fix card images: remove background and fix rotation
# Issue #9: https://github.com/locutusaibot-blip/tschau-sepp/issues/9

CARDS_DIR="assets/cards"
BACKUP_DIR="assets/cards_original_backup"
TARGET_WIDTH=444
TARGET_HEIGHT=600

echo "=== Tschau Sepp Card Image Processor ==="
echo "Fixing backgrounds and rotation..."
echo

# Create backup if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    echo "Creating backup of original cards..."
    cp -r "$CARDS_DIR" "$BACKUP_DIR"
    echo "✓ Backup created at $BACKUP_DIR"
    echo
fi

# Process each card
for card in $CARDS_DIR/*.jpg; do
    filename=$(basename "$card")
    base="${filename%.*}"
    echo "Processing: $filename"
    
    # Get current dimensions
    dimensions=$(identify -format "%wx%h" "$card")
    width=$(echo $dimensions | cut -d'x' -f1)
    height=$(echo $dimensions | cut -d'x' -f2)
    
    # Check if card needs rotation (landscape -> portrait)
    if [ $width -gt $height ]; then
        echo "  - Detected landscape orientation, rotating 90° clockwise"
        rotation="-rotate 90"
    else
        echo "  - Portrait orientation OK"
        rotation=""
    fi
    
    # Process the image:
    # 1. Rotate if needed
    # 2. Remove background (fuzz 15% to catch wooden table variations)
    # 3. Trim whitespace
    # 4. Add small border
    # 5. Resize to standard size
    # 6. Save as PNG with transparency
    convert "$card" \
        $rotation \
        -fuzz 15% \
        -transparent white \
        -background none \
        -trim \
        +repage \
        -bordercolor none \
        -border 10 \
        -resize ${TARGET_WIDTH}x${TARGET_HEIGHT}^ \
        -gravity center \
        -extent ${TARGET_WIDTH}x${TARGET_HEIGHT} \
        "$CARDS_DIR/${base}.png"
    
    if [ $? -eq 0 ]; then
        echo "  ✓ Saved as ${base}.png"
        # Remove old JPG
        rm "$card"
    else
        echo "  ✗ Error processing $filename"
    fi
    echo
done

echo "=== Processing Complete ===="
echo "Converted $(ls $CARDS_DIR/*.png 2>/dev/null | wc -l) cards"
echo "Original backups saved in: $BACKUP_DIR"
echo
echo "Next steps:"
echo "1. Check the processed cards"
echo "2. Update game.js to use .png instead of .jpg"
echo "3. Commit and push changes"
