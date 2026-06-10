import React from 'react';
import { useParams } from 'react-router-dom';
import PreviaPublica from './PreviaPublica';
import PublicComposerProfile from './PublicComposerProfile';

/**
 * Dispatcher for top-level /:slug routes.
 * If the slug matches the music-preview pattern (previa0001, previa1234, etc),
 * render the public music preview page. Otherwise fall back to the
 * public composer profile.
 */
const SlugDispatcher: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  if (slug && (/^p\d+$/i.test(slug) || /^previa\d+$/i.test(slug))) {
    return <PreviaPublica />;
  }
  return <PublicComposerProfile />;
};

export default SlugDispatcher;
