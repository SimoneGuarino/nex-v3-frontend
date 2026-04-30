import { UserDetails } from "./UserContext";

export type Notification = {
    _id: string;
    UserID?: string;
    Username?: string;
    Name?: string;
    Type?: string;
    Title?: string;
    Date?: Date;
    Viewd?: boolean;
    Timer?: Date;
    tags: string[];
    senderDetails?: UserDetails;
}