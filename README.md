# spinal-organ-dump_manager
This modules cleans old backup files from `/nerve-center/memory/dump.bkp`

### Installation
Navigate to `module/dump_manager` folder and type this pull request
```
git pull
```


### Script explanation

| Steps    |      Details       |
| ---------|--------------------|
| `Initialization` | Get all files from `dump.bkp` and sort them by date (Descending order), you can change the location of the backup files in `config.js`|
| `Delete all empty files` | Empty backups might be in `dump.bkp` folder if there is no free memory in the server |
|`Ignore last 6 files` | Because we want to keep the last files in the past 6 hours|
|`Keep one file per period` | The method `handler(fileList, removelist, start, end, period)` takes a list of files, ignore the oldest file between `start` and `end` in a  `period` and return the files that should be deleted |
|`Delete files` | Last step is to delete all files in `filesToRm` variable|

