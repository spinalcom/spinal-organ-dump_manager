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
function unlinkFile(filePath) {
  console.log(`Deleting file ${filePath}`);
  fs.unlinkSync(filePath);
}

function getDumpList() {
  const dumps = fs.readdirSync(folderPath);
  console.log(`Found ${dumps.length} dump files`);
  const files = [];
  for (const dump of dumps) {
    const dumpPwd = path.resolve(folderPath, dump);
    const reg = /(dump_)(?<dump_date>\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})(?<dump_size>_\d*)?.db/;
    const resReg = reg.exec(dump);
    const dump_date = resReg.groups.dump_date;
    let dumpSizeString = resReg.groups.dump_size;
    let dumpSize = 0;
    if (!dumpSizeString) {
      const dumpStats = fs.statSync(dumpPwd);
      dumpSize = dumpStats.size;
    } else {
      dumpSize = parseInt(dumpSizeString.slice(1));
    }
    if (dumpSize === 0) { unlinkFile(dumpPwd); continue; }
    const date = moment(dump_date, "YYYY-MM-DD_HH-mm-ss", true);
    if (date.isValid()) files.push({ pwd: dumpPwd, date, dumpSize });
  }
  return files.sort(sortByDateFct);
}

function handler(l, rl, s, e, p) {
  let tempList = l.filter(f => f.date.isBetween(moment().subtract(s, p), moment().subtract(e, p)));
  l = l.slice(tempList.length);
  tempList.pop();
  rl = rl.concat(tempList);
  return [l, rl];
}

function main() {
  console.log(`Start cleaning ${folderPath} at ${moment()}`);
  let m = 0;
  let fileList = [];
  let filesToRm = [];
  fileList = getDumpList();
  fileList = fileList.slice(6);
  for (let i = 1; i < 4; i++)
    [fileList, filesToRm] = handler(fileList, filesToRm, (i + 1) * 6, i * 6, 'hours');
  for (let i = 1; i < 7; i++)
    [fileList, filesToRm] = handler(fileList, filesToRm, i + 1, i, 'days');
  while (fileList.length != 0)
    [fileList, filesToRm] = handler(fileList, filesToRm, m + 1, m++, 'months');
  for (let i = 0; i < filesToRm.length; i++)
    unlinkFile(filesToRm[i].pwd);
  console.log(`Cleaning done, ${filesToRm.length} files deleted.`);
}

main();
const job = new CronJob('0 */6 * * *', main); // 00:00, 06:00, 12:00, 18:00
job.start();