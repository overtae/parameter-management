import { ipcRenderer } from 'electron';

const api = {
  getProfiles: () => ipcRenderer.invoke('ssm:get-profiles'),
  connect: (config: any) => ipcRenderer.invoke('ssm:connect', config),
  getParameters: () => ipcRenderer.invoke('ssm:get-parameters'),
  saveParameter: (data: any) => ipcRenderer.invoke('ssm:save-parameter', data),
  deleteParameter: (path: string | string[]) => ipcRenderer.invoke('ssm:delete-parameter', path),
  getKmsKeys: () => ipcRenderer.invoke('ssm:get-kms-keys'),
};

export { api };
