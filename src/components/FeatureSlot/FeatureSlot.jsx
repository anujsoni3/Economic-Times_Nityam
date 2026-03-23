import './FeatureSlot.css';

export default function FeatureSlot({ title, icon, description, featureId }) {
  return (
    <div className="feature-slot" id={`feature-slot-${featureId}`}>
      <div className="feature-slot-icon">{icon}</div>
      <div className="feature-slot-content">
        <h3 className="feature-slot-title">{title}</h3>
        <p className="feature-slot-desc">{description}</p>
        <span className="feature-slot-tag">🧩 Integration Slot</span>
      </div>
    </div>
  );
}
