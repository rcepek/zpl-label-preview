#!/bin/bash
# ZPL Label Preview — Log File Server (Mac)
# Double-click this file in Finder to start the server.
# It serves ~/Library/Logs/PlexComponentHost on http://localhost:8765
# Press Ctrl+C in this window to stop.

PORT=8765
LOG_DIR="$HOME/Library/Logs/PlexComponentHost"

if [ ! -d "$LOG_DIR" ]; then
  echo "ERROR: Log directory not found: $LOG_DIR"
  echo "Adjust LOG_DIR in this script if PlexComponentHost logs are stored elsewhere."
  read -p "Press Enter to close..."
  exit 1
fi

echo "Starting ZPL Label Preview log server..."
echo "Serving: $LOG_DIR"
echo "URL:     http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop."
echo ""
python3 -m http.server $PORT --directory "$LOG_DIR"
