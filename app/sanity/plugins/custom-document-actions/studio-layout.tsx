import type {LayoutProps} from 'sanity';
import React from 'react';

import {createContext, useContext} from 'react';

const PluginContext = createContext<{
  shopifyStoreDomain: string;
}>({
  shopifyStoreDomain: '',
});

export function usePluginContext() {
  return useContext(PluginContext);
}

export function createStudioLayout({
  shopifyStoreDomain,
}: {
  shopifyStoreDomain: string;
}) {
  const CustomStudioLayout = React.forwardRef<HTMLDivElement, LayoutProps>((props, ref) => (
    <PluginContext.Provider value={{shopifyStoreDomain}}>
      {props.renderDefault(props)}
    </PluginContext.Provider>
  ));
  return CustomStudioLayout;
}
