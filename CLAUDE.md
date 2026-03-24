## PR作成ルール
PRを作成したら、必ず auto-merge を有効にすること:
```bash
gh pr create --title "..." --body "..."
gh pr merge {PR番号} --auto --squash
```
