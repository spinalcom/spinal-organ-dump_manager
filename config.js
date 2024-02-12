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

const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = {
  dumpBkpFolderPath: process.env.DUMP_FOLDER_PATH || '../../nerve-center/memory/dump.bkp',
  dumpFilePath: process.env.DUMP_FILE_PATH || '../../nerve-center/memory/_dump.db',
  dumpFilePath2: process.env.DUMP_FILE_PATH2 || '../../nerve-center/memory/dump.db',
  monitoringHost: process.env.MONITORING_HOST,
  monitoringApiPath : process.env.MONITORING_API_PATH,
  tokenBosRegister: process.env.TOKEN_BOS_REGISTER
};
