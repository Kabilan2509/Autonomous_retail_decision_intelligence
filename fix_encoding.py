import os, glob

# The files contain literal backslash-u escape sequences written by the agent tool
# e.g., \u003e (which should be >) \u003c (<) \u0026 (&)
patterns = [
    ('\\u003e', '>'),
    ('\\u003c', '<'),
    ('\\u0026', '&'),
    ('\\u0027', "'"),
    ('\\u0022', '"'),
]

files = (
    glob.glob('D:/TCS_Hackathon/ardi-app/src/**/*.jsx', recursive=True) +
    glob.glob('D:/TCS_Hackathon/ardi-app/src/**/*.js', recursive=True) +
    glob.glob('D:/TCS_Hackathon/ardi-app/src/**/*.css', recursive=True)
)

for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    original = content
    for old, new in patterns:
        content = content.replace(old, new)
    if content != original:
        with open(f, 'w', encoding='utf-8', newline='') as fh:
            fh.write(content)
        print('Fixed:', f)

print('Done. Processed', len(files), 'files.')
