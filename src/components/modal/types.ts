// Divi dependencies.
import { ModuleFlatObject } from '@divi/types';
import { ModalStates } from '@divi/modal';

export type ContaninerProps = ModalStates;
export interface Divi5DevToolProps {
  name: ModalStates['name'];
  tab: string;
}

export interface ModuleProps {
  module: ModuleFlatObject;
}
