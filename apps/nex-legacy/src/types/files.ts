export interface FileUploadItem {
    file: File;
    progress: number;              // 0–100
    status: 'loading' | 'done' | 'error';
}