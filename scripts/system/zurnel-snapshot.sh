#!/usr/bin/env bash
# Zurnel vault git sync — local-first, pushes to remote. Never auto-pulls
# except in --sync (explicit reconcile mode).
# Modes:
#   (no arg)   commit pending changes, push main              [30 min timer]
#   --stable   promote backup->main if clean, bundle, push    [daily timer]
#   --sync     fetch + merge remote into main, backup:=main,
#              push both (reconcile after long offline gaps)
set -euo pipefail

VAULT="$HOME/Work/Zurnel"
BUNDLES="$HOME/.local/share/backups/zurnel"
REMOTE="origin"
KEEP=10

# Headless GitHub auth: dedicated key, no ssh-agent required.
# (BatchMode = fail fast instead of hanging timers on prompts.)
export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/id_git -o IdentitiesOnly=yes -o BatchMode=yes"

cd "$VAULT"

dirty() {
	! git diff --quiet || ! git diff --cached --quiet ||
		[[ -n $(git ls-files --others --exclude-standard) ]]
}

commit_pending() {
	if dirty; then
		git add -A
		git commit -m "auto: vault snapshot $(date '+%F %T')" >/dev/null
		echo "committed pending changes"
	fi
}

push_branch() {
	local b="$1"; shift
	if out=$(git push "$@" "$REMOTE" "$b" 2>&1); then
		echo "pushed $b (${out##* })"
	else
		echo "WARN: push $b failed: $(printf '%s\n' "$out" | tail -n1)" >&2
	fi
}

case "${1:-}" in
--stable)
	commit_pending
	if dirty; then
		echo "stable promotion skipped: tree dirty"
	else
		git branch -f backup main   # backup = last clean end-of-day state
	fi
	mkdir -p "$BUNDLES"
	git bundle create "$BUNDLES/vault-$(date +%F-%H%M).bundle" --all
	ls -1t "$BUNDLES"/vault-*.bundle | tail -n +"$((KEEP + 1))" | xargs -r rm --
	push_branch main
	push_branch backup --force-with-lease
	;;
--sync)
	git fetch "$REMOTE"
	if git merge-base --is-ancestor "$REMOTE/main" main; then
		echo "remote main already contained in local"
	else
		git merge "$REMOTE/main" -m "merge remote main into local"
	fi
	git branch -f backup main
	push_branch main
	push_branch backup --force-with-lease
	;;
*)
	commit_pending
	push_branch main
	;;
esac
