import React from 'react';

export default function StockBadge({ stock, showLabel = true }) {
  const stockNum = Number(stock || 0);

  if (stockNum === 0) {
    return (
      <span className="badge badge-danger">
        {showLabel ? 'Habis (0)' : '0'}
      </span>
    );
  }

  if (stockNum <= 5) {
    return (
      <span className="badge badge-warning">
        {showLabel ? `Menipis (${stockNum})` : stockNum}
      </span>
    );
  }

  return (
    <span className="badge badge-success">
      {showLabel ? `Tersedia (${stockNum})` : stockNum}
    </span>
  );
}
