// Divi dependencies.
import { ModuleFlatObject } from '@divi/types';
import { ModalStates } from '@divi/modal';

export type ContaninerProps = ModalStates;
export interface DevStateMonitorProps {
  name: ModalStates['name'];
  tab: string;
}

export interface ModuleProps {
  module: ModuleFlatObject;
}
