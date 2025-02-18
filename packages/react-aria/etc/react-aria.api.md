## API Report File for "@fluentui/react-aria"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import type { ObjectShorthandProps } from '@fluentui/react-utilities';
import * as React_2 from 'react';
import type { ResolveShorthandOptions } from '@fluentui/react-utilities';
import type { ShorthandProps } from '@fluentui/react-utilities';

// @public (undocumented)
export type ARIAButtonAsAnchorProps = React_2.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as: 'a';
};

// @public (undocumented)
export type ARIAButtonAsButtonProps = React_2.ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: 'button';
};

// @public (undocumented)
export type ARIAButtonAsElementProps = React_2.HTMLAttributes<HTMLElement> & {
    as: 'div' | 'span';
};

// @public (undocumented)
export type ARIAButtonProps = ARIAButtonAsButtonProps | ARIAButtonAsElementProps | ARIAButtonAsAnchorProps;

// @public
export function useARIAButton<Required extends boolean = false>(value: ShorthandProps<ARIAButtonProps>, options?: ResolveShorthandOptions<ARIAButtonProps, Required>): Required extends false ? ObjectShorthandProps<ARIAButtonProps> | undefined : ObjectShorthandProps<ARIAButtonProps>;

// (No @packageDocumentation comment for this package)

```
