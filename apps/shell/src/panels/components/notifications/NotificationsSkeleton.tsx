import React from "react";
import { FDBox, FDSkeleton } from "@nex/fd-ui";

function SkeletonRow() {
    return (
        <FDBox variant="soft" color="light" radius="xl" pad="md" className="border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-start gap-3">
                <FDSkeleton shape="circle" className="h-10 w-10 shrink-0" />
                <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                            <FDSkeleton className="h-4 w-40" shape="text" />
                            <FDSkeleton className="h-3 w-24" shape="text" />
                        </div>
                        <FDSkeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <FDSkeleton className="h-3 w-full" shape="text" />
                        <FDSkeleton className="h-3 w-11/12" shape="text" />
                        <FDSkeleton className="h-3 w-8/12" shape="text" />
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-1">
                        <FDSkeleton className="h-3 w-24" shape="text" />
                        <div className="flex items-center gap-2">
                            <FDSkeleton shape="circle" className="h-8 w-8" />
                            <FDSkeleton shape="circle" className="h-8 w-8" />
                        </div>
                    </div>
                </div>
            </div>
        </FDBox>
    );
}

export default function NotificationsSkeleton() {
    return (
        <div className="h-full min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-4">
            <div className="space-y-3" role="status" aria-live="polite" aria-busy="true" aria-label="Caricamento notifiche">
                {Array.from({ length: 6 }).map((_, index) => (
                    <SkeletonRow key={index} />
                ))}
            </div>
        </div>
    );
}
