import brevi from 'assets/icons/brevi.webp';
import esprinet from 'assets/icons/esprinet.webp';
import cometa from 'assets/icons/cometa.webp';
import xpres from 'assets/icons/xpres.webp';
import difox from 'assets/icons/difox.webp';
import techdata from 'assets/icons/techdata.webp';
import also from 'assets/icons/also.webp';
import icecat from 'assets/icons/icecat.webp';
import focelda from 'assets/images/logo-fc.png';
import axro from "assets/icons/axro.webp";
import bestit from "assets/icons/bestit.webp";
import datamatic from "assets/icons/datamatic.webp";
import runner from "assets/icons/runner.webp";
import trevion from "assets/icons/trevion.webp";
import computergross from "assets/icons/computergross.webp";
import ingram from "assets/icons/ingram.webp";
import kosatec from "assets/icons/kosatec.webp";
import nexths from "assets/icons/nexths.webp";
import ribamundo from "assets/icons/ribamundo.webp";
import ecom from "assets/icons/ecom.webp";
import euroOptions from "assets/icons/euroOptions.webp";
import trexon from "assets/icons/trexon.webp";


export type DistributorAvatar = {
    id: string;
    name: string;
    avatarUrl: string;
};

export const distributorAvatars: Record<string, DistributorAvatar> = {
    also: { id: 'also', name: 'Also', avatarUrl: also },
    axro: { id: "axro", name: "Axro", avatarUrl: axro },
    bestit: { id: "bestit", name: "Bestit", avatarUrl: bestit },
    brevi: { id: 'brevi', name: 'Brevi', avatarUrl: brevi },
    cometa: { id: 'cometa', name: 'Cometa', avatarUrl: cometa },
    computergross: { id: 'computergross', name: 'Computergross', avatarUrl: computergross },
    datamatic: { id: 'datamatic', name: 'Datamatic', avatarUrl: datamatic },
    difox: { id: 'difox', name: 'Difox', avatarUrl: difox },
    ecom: { id: 'ecom', name: 'Ecom', avatarUrl: ecom },
    esprinet: { id: 'esprinet', name: 'Esprinet', avatarUrl: esprinet },
    eurooptions: { id: 'euroOptions', name: 'EuroOptions', avatarUrl: euroOptions },
    focelda: { id: 'focelda', name: 'Focelda', avatarUrl: focelda },
    icecat: { id: 'icecat', name: 'Icecat', avatarUrl: icecat },
    ingram: { id: 'ingram', name: 'Ingram', avatarUrl: ingram },
    kosatec: { id: 'kosatec', name: 'Kosatec', avatarUrl: kosatec },
    nexths: { id: 'nexths', name: 'Nexths', avatarUrl: nexths },
    ribamundo: { id: 'ribamundo', name: 'Ribamundo', avatarUrl: ribamundo },
    runner: { id: 'runner', name: 'Runner', avatarUrl: runner },
    techdata: { id: 'techdata', name: 'Tech Data', avatarUrl: techdata },
    trevion: { id: 'trevion', name: 'Trevion', avatarUrl: trevion },
    xpres: { id: 'xpres', name: 'Xpres', avatarUrl: xpres },
    trexon: { id: 'trexon', name: 'Trexon', avatarUrl: trexon }
};

export function getDistributorAvatar(id: string): DistributorAvatar | undefined {
    return distributorAvatars[id?.toLowerCase()];
}




type FileIconData = {
    iconName: string;
    colorClass: string;
    label: string;
};

const fileDataMap: Record<string, FileIconData> = {
    pdf: { iconName: "FaFilePdf", colorClass: "text-red-600", label: "PDF Document" },
    doc: { iconName: "FaFileWord", colorClass: "text-blue-600", label: "Word Document" },
    docx: { iconName: "FaFileWord", colorClass: "text-blue-600", label: "Word Document" },
    xls: { iconName: "FaFileExcel", colorClass: "text-green-600", label: "Excel Spreadsheet" },
    xlsx: { iconName: "FaFileExcel", colorClass: "text-green-600", label: "Excel Spreadsheet" },
    jpg: { iconName: "FaFileImage", colorClass: "text-pink-500", label: "Image File" },
    jpeg: { iconName: "FaFileImage", colorClass: "text-pink-500", label: "Image File" },
    png: { iconName: "FaFileImage", colorClass: "text-pink-500", label: "Image File" },
    gif: { iconName: "FaFileImage", colorClass: "text-pink-500", label: "Image File" },
    zip: { iconName: "FaFileArchive", colorClass: "text-yellow-500", label: "Archive File" },
    rar: { iconName: "FaFileArchive", colorClass: "text-yellow-500", label: "Archive File" },
    "7z": { iconName: "FaFileArchive", colorClass: "text-yellow-500", label: "Archive File" },
    mp4: { iconName: "FaFileVideo", colorClass: "text-purple-600", label: "Video File" },
    mov: { iconName: "FaFileVideo", colorClass: "text-purple-600", label: "Video File" },
    avi: { iconName: "FaFileVideo", colorClass: "text-purple-600", label: "Video File" },
    mp3: { iconName: "FaFileAudio", colorClass: "text-indigo-500", label: "Audio File" },
    wav: { iconName: "FaFileAudio", colorClass: "text-indigo-500", label: "Audio File" },
    txt: { iconName: "FaFileAlt", colorClass: "text-gray-700", label: "Text File" },
    rtf: { iconName: "FaFileAlt", colorClass: "text-gray-700", label: "Text File" },
    js: { iconName: "FaFileCode", colorClass: "text-sky-600", label: "Code File" },
    ts: { iconName: "FaFileCode", colorClass: "text-sky-600", label: "Code File" },
    tsx: { iconName: "FaFileCode", colorClass: "text-sky-600", label: "Code File" },
    swift: { iconName: "FaFileCode", colorClass: "text-sky-600", label: "Code File" },
    json: { iconName: "FaFileCode", colorClass: "text-sky-600", label: "Code File" },
    ppt: { iconName: "FaFilePowerpoint", colorClass: "text-orange-500", label: "Presentation File" },
    pptx: { iconName: "FaFilePowerpoint", colorClass: "text-orange-500", label: "Presentation File" },
};

const mimeToExt: Record<string, string> = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "application/vnd.ms-powerpoint": "ppt",
};

export const getFileIconData = ({ filename, type }: { filename?: string, type?: string }): FileIconData => {
    // 1. prova a risolvere via MIME
    let ext = type && mimeToExt[type]
        ? mimeToExt[type]
        : "";

    // 2. se non ricavato dal MIME, fallback all’estensione del filename
    if (!ext && filename) {
        ext = filename.split(".").pop()?.toLowerCase() || "";
    }

    const defaultObj = {
        iconName: "FaFile",
        colorClass: "text-gray-400",
        label: "Generic File"
    };

    if (!ext) {
        return defaultObj;
    };

    return fileDataMap[ext] || defaultObj;
};