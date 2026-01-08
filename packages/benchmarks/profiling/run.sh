#!/bin/bash

# Automated profiling pipeline
# 1. Build benchmarks
# 2. Start dev server
# 3. Capture profiles
# 4. Analyze results
# 5. Stop server

set -e

echo "🚀 Starting Automated Profiling Pipeline"
echo "========================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build
echo -e "\n${BLUE}[1/5]${NC} Building benchmarks..."
npm run build

# Step 2: Start dev server in background
echo -e "\n${BLUE}[2/5]${NC} Starting dev server..."
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server to start..."
for i in {1..30}; do
  if curl -s http://localhost:3001 > /dev/null; then
    echo -e "${GREEN}✓${NC} Server ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

# Step 3: Capture profiles
echo -e "\n${BLUE}[3/5]${NC} Capturing profiles..."
node profiling/capture.js

# Step 4: Analyze results
echo -e "\n${BLUE}[4/5]${NC} Analyzing results..."
node profiling/analyze.js

# Step 5: Cleanup
echo -e "\n${BLUE}[5/5]${NC} Cleaning up..."
kill $SERVER_PID 2>/dev/null || true

echo -e "\n${GREEN}✅ Profiling complete!${NC}"
echo ""
echo "Results saved to: profiling/data/"
echo "- Trace files: profiling/data/*-trace.json"
echo "- Profiles: profiling/data/*-profile.json"
echo "- Summary: profiling/data/summary.json"
echo ""
echo "To view Chrome traces:"
echo "1. Open Chrome DevTools"
echo "2. Go to Performance tab"
echo "3. Click 'Load profile'"
echo "4. Select a trace file"
