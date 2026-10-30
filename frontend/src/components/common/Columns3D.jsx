import { useState } from 'react';
/** Weekly sessions as real CSS-3D columns (no library, no canvas). Hover / focus a column to read it. */
export default function Columns3D({ items, max: maxProp, height = 180 }) {
  const [hot, setHot] = useState(null);
  const max = maxProp || Math.max(1, ...items.map((i) => i.value));
  return (
    <figure className="c3d" aria-label="Sessions per day this week">
      <div className="c3d-scene">
        <div className="c3d-floor" style={{ '--n': items.length }}>
          {items.map((it, i) => {
            const h = Math.max(6, (it.value / max) * height);
            return (
              <div key={it.label} className={`c3d-col ${hot === i ? 'hot' : ''}`} style={{ '--h': h + 'px', '--i': i }} tabIndex={0}
                onPointerEnter={() => setHot(i)} onPointerLeave={() => setHot(null)} onFocus={() => setHot(i)} onBlur={() => setHot(null)} aria-label={`${it.label}: ${it.value}`}>
                <span className="f top" /><span className="f front" /><span className="f side" />
                <span className="bill"><b className="num">{it.value}</b><i>{it.label}</i></span>
              </div>);
          })}
        </div>
      </div>
      <table className="sr"><caption>Sessions per day</caption><tbody>{items.map((it) => <tr key={it.label}><th>{it.label}</th><td>{it.value}</td></tr>)}</tbody></table>
    </figure>
  );
}
