export type variantBody = 'striped' | 'default';
export type BodySettings = {
    variant?: variantBody;
    className?: {
        main_container?: string;
    };
    isSelected?: (item: any) => boolean;
    onSelect?: (item: any, multi: boolean) => void;
}