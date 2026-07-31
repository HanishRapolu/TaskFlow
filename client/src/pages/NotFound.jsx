import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="notfound-code">404</div>
      <div className="notfound-title">Page not found</div>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 380 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="modern-btn primary">
        <Compass size={18} /> Back to TaskFlow
      </Link>
    </div>
  );
}
