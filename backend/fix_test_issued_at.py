"""
Script to fix missing issued_at in Credential.objects.create calls.
"""
import re

with open('apps/organizations/tests/test_full_issuer_integration.py', 'r') as f:
    data = f.read()

# Fix duplicate issued_at
data = data.replace(
    'issued_at=timezone.now(),\n            issued_at=timezone.now()',
    'issued_at=timezone.now()'
)

# Replace all Credential.objects.create blocks
# Pattern: inside create block, before closing ), add issued_at if missing
lines = data.split('\n')
result = []
i = 0
while i < len(lines):
    line = lines[i]
    result.append(line)
    if 'Credential.objects.create(' in line:
        # Find the closing )
        start = i + 1
        end = start
        while end < len(lines) and lines[end].strip() != ')':
            end += 1
        # Check if issued_at is in the block
        block = '\n'.join(lines[start:end])
        if 'issued_at' not in block:
            # Insert issued_at before closing paren
            result.append('            issued_at=timezone.now()')
        i = end
    else:
        i += 1

with open('apps/organizations/tests/test_full_issuer_integration.py', 'w') as f:
    f.write('\n'.join(result))

print("Fixed issued_at fields")