import React, { useEffect, useState } from "react";
import { getAuthorRegistrationUrl } from "@/lib/storageSignedUrl";

interface Props {
  path: string;
  className?: string;
}

/** <audio> element that resolves a signed URL for author-registrations bucket. */
export const SignedAudio: React.FC<Props> = ({ path, className }) => {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let active = true;
    getAuthorRegistrationUrl(path).then((url) => {
      if (active) setSrc(url);
    });
    return () => {
      active = false;
    };
  }, [path]);

  if (!src) return null;

  return (
    <audio controls className={className} src={src} preload="none">
      Seu navegador não suporta áudio.
    </audio>
  );
};
