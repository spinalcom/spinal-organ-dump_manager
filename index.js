/*
 * Copyright 2020 SpinalCom - www.spinalcom.com
 *
 * This file is part of SpinalCore.
 *
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 *
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 *
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */

const fs = require('fs');
const path = require('path');
const moment = require('moment');
const CronJob = require('cron').CronJob;

const dumpBkpFolderPath = require("./config.js").dumpBkpFolderPath;
const folderPath = path.resolve(dumpBkpFolderPath);

function sortByDateFct(a, b) {
  return b.date.unix() - a.date.unix();
}

function getDumpList(filesToRm) {
  const dumps = fs.readdirSync(folderPath);
  const files = [];
  for (const dump of dumps) {
    const dumpPwd = path.resolve(folderPath, dump);
    const dumpStats = fs.statSync(dumpPwd);
    const dumpSize = dumpStats.size;
    const date = moment(dump, "[dump_]YYYY-MM-DD_HH-mm-ss[.db]", true);
    if (date.isValid()) { files.push({ pwd: dumpPwd, date, dumpSize }); }
    else { filesToRm.push(dumpPwd);}
  }
  files.sort(sortByDateFct);
  return files;
}

function handling(l, rl, s, e, p) {
  let tempList = l.filter(f => f.date.isBetween(moment().subtract(s, p), moment().subtract(e, p)));
  l = l.slice(tempList.length);
  tempList.pop();
  rl = rl.concat(tempList);
  return [l, rl];
}

function main() {
  let fileList = [];
  let filesToRm = [];
  fileList = getDumpList([]);
  // Last 6 hours
  fileList = fileList.slice(6);
  // Last 24 hours
  [fileList, filesToRm] = handling(fileList, filesToRm, 12, 6, 'hours');
  [fileList, filesToRm] = handling(fileList, filesToRm, 18, 12, 'hours');
  [fileList, filesToRm] = handling(fileList, filesToRm, 24, 18, 'hours');
  // Last month
  for (let i=1; i<31; i++){
    [fileList, filesToRm] = handling(fileList, filesToRm, i+1, i, 'days');
  }
  // Rest of files
  let m = 1;
  while (fileList.length!=0){
    [fileList, filesToRm] = handling(fileList, filesToRm, m+1, m, 'months');
    m = m+1;
  }
  filesToRm.forEach(e => fs.unlinkSync(e.pwd));
}

main();
const job = new CronJob('0 */6 * * *', main); // At minute 0 past every 6th hour (00:00, 06:00, 12:00, 18:00)
job.start();
