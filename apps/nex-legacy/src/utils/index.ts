export { SplitCammelCase } from './splitCammelCase';
export { CalcPercent } from './percent';
export { DwdFileFromLink, CreateAndDownloadExcel, CreateAndDownloadCSV } from './dwdFile';
export { RetriveSupplierFromCookies } from './retriveSupplierFromCookies';
export { ConvertToItalianDate } from './italianDate';
export { BufferToData } from './BuffertToData';
export { StringAvatar } from './stringToColor';
export { PickLowest } from './PickLowest';
export { NumberToEuro } from './numberToEuro';
export { RetriveCookie, SaveCookie } from './cookie';
export { CheckAdminPermissions } from './checkAdminPermissions';
export { GetDate } from './date/getDate';
export { StringToHTML } from './stringToHTML';
export { Notifications } from './notifications/notifications';
export { DivideName } from './divideName';
export {
  saveMessageToIndexedDB,
  SyncronizeIndexedDB,
  getMessagesByViewed,
  getAllBlocks,
  getMessagesByIdBlock,
  updateMessagesViewedByIdBlock,
  findBlock,
  getOldestMessageDateByIdBlock,
} from './IndexedDB/chats/message';
export { getNestedProperty } from './data/getNestedProperty';
export { randomIntFromInterval } from './number/random';
export { CopyToClipboard } from './string/copy';
export { TruncateText } from './string/truncate';
export { getRolesMappedByIndex, getRolesMappedByLabel, getRolesOptionsFromEnv } from './ruoli';
export { ConvertToReadableString } from './string/convert.ts';
export { writeRecent } from './cookie/operate';