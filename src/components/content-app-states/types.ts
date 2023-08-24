// Divi dependencies.
import {
  AttrState,
  Breakpoint,
} from '@divi/types';
import { ViewType } from '@divi/types';

export interface ContentAppStatesProps {
  attributeState: AttrState;
  breakpoint: Breakpoint;
  selectedModules: string[],
  view: ViewType;
}