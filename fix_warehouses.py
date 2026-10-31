import sys, re
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Fix Warehouses.jsx: raw < and > in JSX text content
with open('D:/TCS_Hackathon/ardi-app/src/pages/app/Warehouses.jsx', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Replace the problematic legend lines that have raw < and > in JSX text
old1 = "Critical: Trending (High velocity + Stock &lt; 50)"
new1 = "Critical: Trending (High velocity + Stock {'<'} 50)"
old2 = "Overstock (Stagnant velocity + Stock &gt; 150)"
new2 = "Overstock (Stagnant velocity + Stock {'>'} 150)"

# Also check for literal < > signs
old3 = "Critical: Trending (High velocity + Stock < 50)"
old4 = "Overstock (Stagnant velocity + Stock > 150)"

content2 = content
content2 = content2.replace(old1, new1)
content2 = content2.replace(old2, new2)
content2 = content2.replace(old3, new1)
content2 = content2.replace(old4, new2)

if content2 != content:
    with open('D:/TCS_Hackathon/ardi-app/src/pages/app/Warehouses.jsx', 'w', encoding='utf-8', newline='') as f:
        f.write(content2)
    print("Fixed Warehouses.jsx")
else:
    print("No changes needed in Warehouses.jsx - checking line 763...")
    lines = content.splitlines()
    for i in range(760, 770):
        if i < len(lines):
            print(f"  {i+1}: {repr(lines[i][:120])}")
