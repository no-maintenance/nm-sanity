#!/usr/bin/env npx tsx
/**
 * Test script to verify grid generator button component can render
 */

import React from 'react';
import {renderToString} from 'react-dom/server';

// Mock Sanity UI components
const MockCard = ({children}: {children: React.ReactNode}) => {
  return <div className="card">{children}</div>;
};
const MockButton = ({text}: {text: string}) => {
  return <button>{text}</button>;
};
const MockStack = ({children}: {children: React.ReactNode}) => {
  return <div className="stack">{children}</div>;
};
const MockText = ({children}: {children: React.ReactNode}) => {
  return <span>{children}</span>;
};

// Mock Sanity hooks
const useFormValue = () => ({
  themeWords: [
    {word: 'TEST', isSpangram: false},
    {word: 'SPAN', isSpangram: true},
  ],
});

const set = (value: any) => ({type: 'set', value});
const unset = () => ({type: 'unset'});

// Mock the UI components
jest.mock('@sanity/ui', () => ({
  Card: MockCard,
  Button: MockButton,
  Stack: MockStack,
  Text: MockText,
}));

// Mock sanity module
jest.mock('sanity', () => ({
  set,
  unset,
  useFormValue,
}));

// Now import the component
import {GridGeneratorButton} from '../app/sanity/components/grid-generator-button';

// Test rendering
const props = {
  onChange: () => {},
  value: undefined,
};

try {
  const html = renderToString(<GridGeneratorButton {...props} />);
  console.log('✅ Component rendered successfully!');
  console.log('HTML output (first 500 chars):', html.substring(0, 500));
} catch (error) {
  console.error('❌ Component rendering failed:', error);
}