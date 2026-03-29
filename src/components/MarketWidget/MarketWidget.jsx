import { useState, useEffect } from 'react';
import { fetchMarketData } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import './MarketWidget.css';

export default function MarketWidget() {
  const [data, setData] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    fetchMarketData()
      .then(setData)
      .catch(() => setData([]));
  }, []);

  if (data.length === 0) return null;

  return (
    <aside className="market-widget">
      <h3 className="market-widget-title">
        <i className="bi bi-graph-up"></i> {t('marketWatch')}
        <span className="live-badge">{t('live')}</span>
      </h3>

      {data.map((item) => (
        <div key={item.id} className="market-item">
          <span className="market-item-name">{item.name}</span>
          <div className="market-item-right">
            <span className="market-item-value">
              {item.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
            <span className={`market-item-change ${item.trend}`}>
              {item.trend === 'up' ? '▲' : '▼'}{' '}
              {Math.abs(item.change).toLocaleString('en-IN', { maximumFractionDigits: 2 })}{' '}
              ({Math.abs(item.changePercent).toFixed(2)}%)
            </span>
          </div>
        </div>
      ))}
    </aside>
  );
}
