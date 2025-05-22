import React from 'react';

export const portableTextMarks = {
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-medium">{children}</strong>
  ),
  // Add other global marks here if needed
}; 