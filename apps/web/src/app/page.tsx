import HomeWrapper from './HomeWrapper';

/**
 * Home Page - Server Component Entry Point
 * 
 * This is the main entry point for the home page.
 * It delegates to HomeWrapper which fetches data server-side,
 * then passes it to HomeClient which handles client-side features.
 * 
 * This architecture:
 * - Eliminates cold start timeout on client
 * - Provides instant initial render with data
 * - Maintains client-side interactivity (framer-motion, useAuth)
 */
export default function HomePage() {
  return <HomeWrapper />;
}
