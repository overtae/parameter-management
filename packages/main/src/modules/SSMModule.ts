import { ipcMain } from 'electron';
import {
  SSMClient,
  GetParametersByPathCommand,
  PutParameterCommand,
  DeleteParameterCommand,
  DeleteParametersCommand,
} from '@aws-sdk/client-ssm';
import { KMSClient, ListAliasesCommand } from '@aws-sdk/client-kms';
import { loadSharedConfigFiles } from '@aws-sdk/shared-ini-file-loader';
import { fromIni } from '@aws-sdk/credential-providers';
import type { AppModule } from '../AppModule.js';
import { ModuleContext } from '../ModuleContext.js';

class SSMModule implements AppModule {
  private ssmClient: SSMClient | null = null;
  private kmsClient: KMSClient | null = null;

  async enable({}: ModuleContext): Promise<void> {
    ipcMain.handle('ssm:get-profiles', async () => {
      try {
        const configFiles = await loadSharedConfigFiles();
        const profiles = Object.keys(configFiles.credentialsFile || {});
        return profiles.length > 0 ? profiles : ['default'];
      } catch (error) {
        console.error('Failed to load AWS profiles:', error);
        return ['default'];
      }
    });

    ipcMain.handle('ssm:connect', async (_, config: { region: string; profile: string }) => {
      try {
        this.ssmClient = new SSMClient({
          region: config.region,
          credentials: fromIni({ profile: config.profile })
        });
        this.kmsClient = new KMSClient({
          region: config.region,
          credentials: fromIni({ profile: config.profile })
        });
        // Test connection
        await this.ssmClient.send(new GetParametersByPathCommand({ Path: '/', Recursive: false }));
        return { success: true };
      } catch (error: any) {
        console.error('Connection failed:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('ssm:get-parameters', async () => {
      if (!this.ssmClient) throw new Error('Not connected');
      try {
        let parameters: any[] = [];
        let nextToken: string | undefined;
        do {
          const response: any = await this.ssmClient.send(new GetParametersByPathCommand({
            Path: '/',
            Recursive: true,
            WithDecryption: true,
            NextToken: nextToken
          }));
          parameters = [...parameters, ...(response.Parameters || [])];
          nextToken = response.NextToken;
        } while (nextToken);
        return parameters;
      } catch (error) {
        console.error('Failed to get parameters:', error);
        throw error;
      }
    });

    ipcMain.handle('ssm:save-parameter', async (_, data: any) => {
      if (!this.ssmClient) throw new Error('Not connected');
      try {
        await this.ssmClient.send(new PutParameterCommand({
          Name: data.Name,
          Value: data.Value,
          Type: data.Type,
          Description: data.Description,
          KeyId: data.Type === 'SecureString' ? data.KeyId : undefined,
          Overwrite: true
        }));
        return { success: true };
      } catch (error: any) {
        console.error('Save failed:', error);
        throw error;
      }
    });

    ipcMain.handle(
      'ssm:delete-parameter',
      async (_, paths: string | string[]) => {
        if (!this.ssmClient) throw new Error('Not connected');
        try {
          const pathList = Array.isArray(paths) ? paths : [paths];
          // DeleteParametersCommand can handle up to 10 parameters at once
          for (let i = 0; i < pathList.length; i += 10) {
            const chunk = pathList.slice(i, i + 10);
            if (chunk.length === 1) {
              await this.ssmClient.send(
                new DeleteParameterCommand({ Name: chunk[0] }),
              );
            } else {
              await this.ssmClient.send(
                new DeleteParametersCommand({ Names: chunk }),
              );
            }
          }
          return { success: true };
        } catch (error: any) {
          console.error('Delete failed:', error);
          throw error;
        }
      },
    );

    ipcMain.handle('ssm:get-kms-keys', async () => {
      if (!this.kmsClient) throw new Error('Not connected');
      try {
        const response = await this.kmsClient.send(new ListAliasesCommand({}));
        return (response.Aliases || []).map(a => ({
          KeyId: a.TargetKeyId,
          AliasName: a.AliasName
        }));
      } catch (error) {
        console.error('Failed to get KMS keys:', error);
        return [];
      }
    });
  }
}

export function createSSMModule() {
  return new SSMModule();
}
