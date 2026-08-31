---
description: Safe disk cleanup — pacman/yay cache pruning, orphan detection, journal vacuum, temp caches; always dry-run first and ask before deleting. Use when asked to clean up disk space / cache / tmp / junk.
agent: build
---

Perform a SAFE disk cleanup. Guardrails: dry-run and show what would be freed FIRST; never delete
without listing the items and getting the user's confirmation; never delete user data (home/docs/
models) unless explicitly asked.

Order of operations:
1. Baseline: `df -h / /home`, then find big dirs via `du -xhd1 / 2>/dev/null | sort -rh | head -12`
   and the same for /home.
2. pacman cache (keeps 2 versions, safe): preview with `paccache --dryrun -rk2`; to apply, get the
   sudo password from the user, then `sudo -S paccache -rk2`.
3. yay/AUR downloaded archives (no sudo): `du -sh ~/.cache/yay`; if >1 GB, `yay -Sc --noconfirm`
   (removes only downloaded tarballs, not build dirs). Only if asked, offer the more aggressive
   `yay -Sc --answerclean Y` (also cleans build sources) — get confirmation first.
4. Orphaned packages (read-only check): `pacman -Qtdq`; if any appear, show the list and confirm,
   then `sudo -S pacman -Rns <pkgs>`. Warn the user this also removes configs of those packages.
5. Journal logs: `journalctl --disk-usage`; if >500 MB, propose `sudo -S journalctl --vacuum-size=200M`
   after confirmation (keeps recent logs).
6. Old per-user caches: show top entries of `du -sh ~/.cache/* | sort -rh | head -10`; deleting them
   (browser/cache players) is optional — ask before acting.
7. Finish with a before/after `df -h / /home` plus a summary of what was freed and what was skipped
   and why.
8. NEVER run a bare `rm -rf`; every delete must reference an explicit, user-approved path.