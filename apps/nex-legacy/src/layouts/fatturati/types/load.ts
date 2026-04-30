export type LoadStatusKeys = "export_data";

export type LoadStatus = Record<LoadStatusKeys, boolean>;

export type ChangeLoadStatusArgs = {
    from: LoadStatusKeys;
    bool?: boolean;
};