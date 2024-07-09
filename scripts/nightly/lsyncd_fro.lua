settings {
    logfile = "/home/oppenheimer/log/lsyncd/lsyncd_fro.log",
    statusFile = "/home/oppenheimer/log/lsyncd/lsyncd_fro.status",
    statusInterval = 1,
    nodaemon = true,
    insist = true
}
sync {
    default.rsync,
    source = "/media/oppenheimer/zournal/Zournal/",
    target = "/home/oppenheimer/Documents/ARCHIVES_of_KNOWLEDGE/Journalorigin/zournal",
    delete = 'true',
    delay = 6,
    rsync = {
        update = true,
        _extra = {"--progress", "--delete", "--partial", "--stats", "--human-readable", "--size-only", "--inplace"},
        times = true,
        archive = true,
        inplace = true,
        protect_args = true,
        chmod = 777,
        compress = false,
        verbose = true,
        whole_file = true
    }
}

