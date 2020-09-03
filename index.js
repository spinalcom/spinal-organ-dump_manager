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
    // exemple dump_2020-09-01_05-47-49.db
    const dumpPwd = path.resolve(folderPath, dump);
    const dumpStats = fs.statSync(dumpPwd);
    const dumpSize = dumpStats.size;
    if (dumpSize === 0) throw new Error('out of memory');
    const date = moment(dump, "[dump_]YYYY-MM-DD_HH-mm-ss[.db]", true);
    if (date.isValid()) { files.push({ pwd: dumpPwd, date }); }
    else { filesToRm.push(dumpPwd); }
  }
  files.sort(sortByDateFct);
  return files;
}

function keepOneEachDay(filesToRm, lastMonthLst) {
  const days = {};
  for (const file of lastMonthLst) {
    const dayNbr = file.date.dayOfYear();
    if (typeof days[dayNbr] === "undefined") days[dayNbr] = [];
    days[dayNbr].push(file);
  }
  for (const dayNbr in days) {
    if (days.hasOwnProperty(dayNbr)) {
      const files = days[dayNbr];
      for (let idx = 1; idx < files.length; idx++) {
        if (Math.round(files.length / 2) === idx) {
          continue;
        }
        filesToRm.push(files[idx].pwd);
      }
    }
  }
}

function keepOneEachMonth(filesToRm, beforeLastMonthLst) {
  const files = {};
  for (const file of beforeLastMonthLst) {
    const year = file.date.year();
    const month = file.date.month();
    if (typeof files[year] === "undefined") files[year] = {};
    if (typeof files[year][month] === "undefined") files[year][month] = [];
    files[year][month].push(file);
  }

  for (const yearKey in files) {
    if (files.hasOwnProperty(yearKey)) {
      const year = files[yearKey];
      for (const monthKey in year) {
        if (year.hasOwnProperty(monthKey)) {
          const month = year[monthKey];
          for (let idx = 1; idx < month.length; idx++) {
            if (Math.round(month.length / 2) === idx) {
              continue;
            }
            filesToRm.push(month[idx].pwd);
          }
        }
      }
    }
  }
}

function main() {
  console.log("Start cleaning folderPath", moment());
  try {
    const filesToRm = [];
    const files = getDumpList(filesToRm);
    const lastMonthLst = [];
    const beforeLastMonthLst = [];
    const lastMonth = moment().subtract(1, 'month');
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      if (idx < 24) continue; // last 24
      if (file.date.isAfter(lastMonth)) {
        lastMonthLst.push(file);
      } else {
        beforeLastMonthLst.push(file);
      }
    }
    keepOneEachDay(filesToRm, lastMonthLst);
    keepOneEachMonth(filesToRm, beforeLastMonthLst);
    for (const fileToRm of filesToRm) {
      fs.unlinkSync(fileToRm);
    }
  } catch (e) {
    console.error(e);
  }
}

main();
const job = new CronJob('00 00 00 * * *', main); // at_midnight
job.start();
