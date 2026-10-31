import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('D:/TCS_Hackathon/ardi-app/src/pages/app/Promotions.jsx', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

total = len(lines)
print(f"Total lines: {total}")

# The duplicate region: lines 512-535 (0-indexed: 511-534)
# These are the premature return block. We need to remove them.
# Also lines 536 is a blank line we can keep.

# Lines to remove: index 511 to 534 inclusive (the first "return (" through "</div>" before second return)
# The second return starts at index 536 (line 537 in 1-indexed)

new_lines = []
skip_range = set(range(511, 536))  # Remove lines 512-536 (0-indexed 511-535)

for i, line in enumerate(lines):
    if i in skip_range:
        print(f"Removing line {i+1}: {repr(line[:60])}")
        continue
    new_lines.append(line)

result = ''.join(new_lines)
with open('D:/TCS_Hackathon/ardi-app/src/pages/app/Promotions.jsx', 'w', encoding='utf-8', newline='') as f:
    f.write(result)
print(f"Done. Written {len(new_lines)} lines.")
