export {};

declare global {
  interface Window {
    api: {
      getParameters: () => Promise<any[]>;
      getKmsKeys: () => Promise<any[]>;
      saveParameter: (data: any) => Promise<void>;
      deleteParameter: (path: string | string[]) => Promise<any>;
      getProfiles: () => Promise<string[]>;
      connect: (config: any) => Promise<any>;
    };
  }
}
