Set-Location 'c:\Users\HomePC\Downloads\Manlung-Shop-main\Manlung-Shop'

# Abort any stuck rebase/merge silently
git rebase --abort
git merge --abort

# Fetch and hard reset to remote state
git fetch origin
git reset --hard origin/main

# Stage all changes
git add -A

# Commit
git commit -m "Redesign: bio update, OG preview tags, glow tour line, clean cart, no WhatsApp/contact, eager image loading"

# Push
git push origin main

Write-Host "=== PUSH COMPLETE ==="
git log --oneline -4
