import * as React from 'react';

import {
  ComponentPage,
  ExampleCard,
  IComponentDemoPageProps,
  PropertiesTableSet,
} from '@fluentui/react-docsite-components';
import { HeatMapChartBasicExample } from './HeatMapChartBasic.Example';
import { HeatMapChartCustomAccessibilityExample } from './HeatMapChartBasic.CustomAccessibility.Example';

const HeatMapChartBasicExampleCode = require('!raw-loader?esModule=false!@fluentui/react-examples/src/react-charting/HeatMapChart/HeatMapChartBasic.Example.tsx');
const HeatMapChartCustomAccessibilityExampleCode = require('!raw-loader?esModule=false!@fluentui/react-examples/src/react-charting/HeatMapChart/HeatMapChartBasic.CustomAccessibility.Example.tsx');

export class HeatMapChart extends React.Component<IComponentDemoPageProps, {}> {
  public render(): React.ReactNode {
    return (
      <ComponentPage
        title="Heat Map Chart"
        componentName="HeatMapChartExample"
        exampleCards={
          <div>
            <ExampleCard title="Heat Map Basic" code={HeatMapChartBasicExampleCode}>
              <HeatMapChartBasicExample />
            </ExampleCard>
            <ExampleCard title="Heat Map Custom Accessibility" code={HeatMapChartCustomAccessibilityExampleCode}>
              <HeatMapChartCustomAccessibilityExample />
            </ExampleCard>
          </div>
        }
        propertiesTables={
          <PropertiesTableSet
            sources={[
              require<string>('!raw-loader?esModule=false!@fluentui/react-charting/src/components/HeatMapChart/HeatMapChart.types.ts'),
            ]}
          />
        }
      />
    );
  }
}
