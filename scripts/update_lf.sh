#!/bin/bash
# this updater-script was made to let it run as cron job on servers or anacron job on a workstation or laptop

# debug output and exit on error or use of undeclared variable or pipe error:
set -o xtrace -o errtrace -o errexit -o nounset -o pipefail

filename="lf-linux-arm64.tar.gz"
update_dir="/var/tmp/lf-update"
bin_dir="/usr/local/bin"
man_dir="/usr/local/share/man"

version="$(curl --location --head https://github.com/gokcehan/lf/releases/latest | grep -i location: | sed 's/^.*\/tag\/\([^\/]*\)\r$/\1/')"
uri_to_download="https://github.com/gokcehan/lf/releases/download/${version}/${filename}"

# check if update_dir exists
test -d "$update_dir" || mkdir -p "$update_dir" || exit 1
# check if file was downloaded at least once otherwise take timestamp from long ago
if test -f "${update_dir}/${filename}"; then tar_ts="$(stat -c %Y ${update_dir}/${filename})"; else tar_ts="946681201"; fi

# download only when it has changed
curl --etag-compare "$update_dir"/etag.txt --etag-save "$update_dir"/etag.txt --show-error -L "$uri_to_download" --output "$update_dir"/"$filename"
# when a new file was downloaded update the binary and the man page
if [ "$(stat -c %Y ${update_dir}/${filename})" -gt "$tar_ts" ]; then
        tar -xzf "$update_dir"/"$filename" -C "$update_dir"/.
        # move to the correct folder
        mv --force "$update_dir"/lf "${bin_dir}/lf" &&  chmod a+x "${bin_dir}/lf"
        # update the manual
        curl --fail --show-error -LOJ https://raw.githubusercontent.com/gokcehan/lf/master/lf.1 --create-dirs --output-dir "${man_dir}/man1/"
        # correct permissions of the manual file
        chmod -R a=r,u+w,a+X "${man_dir}/man1"
        # update the manuals database
        mandb
fi

if [ ! -x "${bin_dir}/lf" ]; then
    echo '"lf" was not successfully updated!' >&2
    # DISPLAY=:0 notify-send --urgency=critical "Failed updating lf!"
      # Run $0 to check."
    exit 2
fi
exit 0
