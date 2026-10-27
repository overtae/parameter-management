import { contextBridge } from 'electron';
import { api } from './index.js';

contextBridge.exposeInMainWorld('api', api);
