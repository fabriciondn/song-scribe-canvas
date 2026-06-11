import React from 'react';
import { useParams } from 'react-router-dom';
import PreviaPublica from './PreviaPublica';
import PublicComposerProfile from './PublicComposerProfile';

/**
 * Dispatcher for top-level /:slug routes.
 * Music preview slugs:
 *  - legacy: p0001, previa0001
 *  - new:    previa-{musica}-{cliente}
 * Otherwise fall back to public composer profile.
 */
const SlugDispatcher: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  if (
    slug &&
    (/^p\d+$/i.test(slug) ||
      /^previa\d+$/i.test(slug) ||
      /^previa-[a-z0-9-]+$/i.test(slug))
  ) {
    return <PreviaPublica />;
  }
  return <PublicComposerProfile />;
};

export default SlugDispatcher;
