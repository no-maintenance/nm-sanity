// app/sanity/components/StaticSizeChartBlock.tsx
import React from 'react';

export default function StaticSizeChartBlock() {
  return (
    <div
      style={{
        padding: '1rem',
        background: '#f3f3f3',
        borderRadius: '6px',
        textAlign: 'center',
        color: '#666',
      }}
    >
      <strong>Size Chart</strong>
      <div style={{ fontSize: '0.9em', marginTop: '0.5em' }}>
        This block will display the product's assigned size chart on the website.
      </div>
    </div>
  );
}