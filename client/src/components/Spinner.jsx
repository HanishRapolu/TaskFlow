export default function Spinner({ size, label }) {
  return (
    <div className="loader-screen">
      <div className={`spinner ${size === 'sm' ? 'sm' : ''}`}></div>
      {label && <p>{label}</p>}
    </div>
  );
}
