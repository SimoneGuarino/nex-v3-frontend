import { useEffect, useRef, useState } from "react";
import ReleaseDetailsModal from "./components/ReleaseDetailsModal";
import { LoadLatestReleaseNoteAPI, ReleaseNoteAPI } from "./fetchdata/getReleaseNotes";

const LatestRelease: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [release, setRelease] = useState<ReleaseNoteAPI | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const abortRef = useRef<AbortController | null>(null);

    // carica pubbliche al mount
    useEffect(() => {
        setLoading(true);
        LoadLatestReleaseNoteAPI({
            abortLike: abortRef,
            onComplete: (res: ReleaseNoteAPI | null) => {
                if (res) {
                    setRelease(res);
                    setLoading(false);
                };
            },
            onError: (err: any) => {
                console.error(err);
                setLoading(false);
            }
        });

        return () => {
            if (abortRef.current) abortRef.current.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div className="absolute w-full h-full">
        <ReleaseDetailsModal open={!!release} note={release} loading={loading}
        onClose={onClose} />
    </div>
};

export default LatestRelease;