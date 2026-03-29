import { Link } from 'react-router-dom';
import './FeatureSlot.css';

export default function FeatureSlot({ title, icon, description, featureId, to }) {
  const content = (
    <>
      <div className="feature-slot-icon">{icon}</div>
      <div className="feature-slot-content">
        <h3 className="feature-slot-title">{title}</h3>
        <p className="feature-slot-desc">{description}</p>
        <span className="feature-slot-tag">🧩 Integration Slot</span>
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="feature-slot" id={`feature-slot-${featureId}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className="feature-slot" id={`feature-slot-${featureId}`}>
      {content}
    </div>
  );
}
