export type LoadStatusKeys = "search" | "search_customers" | "export_data" | "infiniteScroll";

export type LoadStatus = Record<LoadStatusKeys, boolean>;

export type ChangeLoadStatusArgs = {
    from: LoadStatusKeys;
    bool?: boolean;
};