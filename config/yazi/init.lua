-- init.lua — plugin setups (Yazi 26.8.15)

-- full window borders
require("full-border"):setup()

-- git status in the file list
require("git"):setup()

-- persistent bookmarks (yamb): stored at ~/.config/yazi/bookmark
require("yamb"):setup({
	keys = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
	path = (os.getenv("HOME") .. "/.config/yazi/bookmark"),
	jump_only = false,
})

-- mime-ext: know heic/heif by extension instantly, and always fall back to
-- file(1) for unknown types so nothing ever shows an empty mime
require("mime-ext.local"):setup({
	with_exts = {
		heic = "image/heif",
		heif = "image/heif",
		avif = "image/avif",
		jxl  = "image/jxl",
	},
	fallback_file1 = true,
})
