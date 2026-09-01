Set-Location 'c:\Users\HomePC\Downloads\Manlung-Shop-main\Manlung-Shop'

# Stage every file
git add -A

# Commit all changes
git commit -m "Full redesign: bio, OG tags, new hero/cart/tour/CSS, no WhatsApp/contact, eager images"

# Push
git push origin main

Write-Host "=== PUSH COMPLETE ==="
git log --oneline -5
