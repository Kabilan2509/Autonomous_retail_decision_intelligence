import sys
sys.stdout.reconfigure(encoding='utf-8')
path = r'd:\TCS_Hackathon\ardi-app\src\pages\app\DecisionHub.jsx'
lines = open(path, encoding='utf-8', errors='replace').readlines()
total = len(lines)
print(f'Total lines: {total}')
print('--- Last 40 lines ---')
for i, l in enumerate(lines[max(0, total-40):], start=max(0, total-39)):
    print(f'{i:4d}: {l}', end='')
print()
# Check for export default
has_export = any('export default' in l for l in lines)
print(f'Has "export default": {has_export}')
# Show all lines containing export
for i, l in enumerate(lines, start=1):
    if 'export' in l:
        print(f'  export at line {i}: {l.rstrip()}')
