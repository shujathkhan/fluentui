import * as React from 'react';
import { useButton } from '../Button/useButton';
import { useChecked } from './useChecked';
import type { ToggleButtonProps, ToggleButtonState } from './ToggleButton.types';

export const useToggleButton = (
  props: ToggleButtonProps,
  ref: React.Ref<HTMLElement>,
  defaultProps?: ToggleButtonProps,
) => {
  const state = useButton(props, ref, defaultProps);

  useChecked(state as ToggleButtonProps);

  return state as ToggleButtonState;
};
