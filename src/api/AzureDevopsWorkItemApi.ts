
import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { UrlReader } from '@backstage/backend-common';
import {
    AzureDevOpsCredentialsProvider,
    DefaultAzureDevOpsCredentialsProvider,
    ScmIntegrations,
  } from '@backstage/integration';

  import {
    getHandlerFromToken,
    getPersonalAccessTokenHandler,
    WebApi,
  } from 'azure-devops-node-api';  
import { QueryHierarchyItem, WorkItemQueryResult,WorkItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";



export class AzureDevopsWorkItemApi {
    private readonly logger: LoggerService;
    private readonly config: Config;
    private readonly credentialsProvider: AzureDevOpsCredentialsProvider

    private constructor(
        logger: LoggerService,
        config: Config,
        credentialsProvider: AzureDevOpsCredentialsProvider,
      ) {
        this.logger = logger;
        this.config = config;
        this.credentialsProvider = credentialsProvider;
      }

      static fromConfig(
        config: Config,
        options: { logger: LoggerService; urlReader: UrlReader },
      ) {
        const scmIntegrations = ScmIntegrations.fromConfig(config);
        const credentialsProvider =
          DefaultAzureDevOpsCredentialsProvider.fromIntegrations(scmIntegrations);
        console.log(credentialsProvider);  
        return new AzureDevopsWorkItemApi(
          options.logger,
          config,
          credentialsProvider,
        );
      }

      private async getWebApi(host?: string, org?: string): Promise<WebApi> {
        // If no host or org is provided we fall back to the values from the `azureDevOps` config section
        // these may have been setup in the `integrations.azure` config section
        // which is why use them here and not just falling back on them entirely
        const validHost = host ?? this.config.getOptionalString('azureDevOps.host');
        const validOrg =
          org ?? this.config.getOptionalString('azureDevOps.organization');
    
        if (!validHost || !validOrg) {
          throw new Error(
            "No 'host' or 'org' provided in annotations or configuration, unable to retrieve needed credentials",
          );
        }
    
        const url = `https://${validHost}/${encodeURIComponent(validOrg)}`;
        const credentials = await this.credentialsProvider.getCredentials({
          url,
        });
    
        let authHandler;
        if (!credentials) {
          // No credentials found for the provided host and org in the `integrations.azure` config section
          // use the fall back personal access token from `azureDevOps.token`
          const token = this.config.getOptionalString('azureDevOps.token');
          if (!token) {
            throw new Error(
              "No 'azureDevOps.token' provided in configuration and credentials were not found in 'integrations.azure', unable to proceed",
            );
          }
          this.logger.warn(
            "Using the token from 'azureDevOps.token' has been deprecated, use 'integrations.azure' instead, for more details see: https://backstage.io/docs/integrations/azure/locations",
          );
          authHandler = getPersonalAccessTokenHandler(token);
        } else {
          authHandler = getHandlerFromToken(credentials.token);
        }
    
        const webApi = new WebApi(url, authHandler);
        return webApi;
      }

      public async getWorkItems(project?: string): Promise<WorkItem[]>
      {

        /*
                Get work items using a query
                1) Look up the query that you want to use.
                2) Get the results for that query.
                3) Get each of the work items by ID.
        */
        //const apiVersion = "7.1-preview.2";
        const azureConfig = ScmIntegrations.fromConfig(this.config).azure.list()[0];
        const host = azureConfig.config.host;
        var org = "";
        if(azureConfig.config.credentials)
          {
            if(azureConfig.config.credentials[0].organizations)
              org =  azureConfig.config.credentials[0].organizations[0];
          }
        console.log("Using azure host,org,Project :" + host + "  , " + org + " , " + project );  
        const webApi = await this.getWebApi(host, org);
        const client = await webApi.getWorkItemTrackingApi(host)
        const query = "My Queries/FetchAllWorkItems";
        // 1) Look up the query that you want to use.
        const queryInfo: QueryHierarchyItem = await client.getQuery(project!,query,undefined,undefined,false,true);
        this.logger.info("QueryInfo : " + queryInfo);
        const queryid = queryInfo.id!;
        // 2) Get the results for that query.
        const workitemResult: WorkItemQueryResult = await client.queryById(queryid);
        // 3) Get each of the work items by ID.
        var workItemIds = new Array<number>();
        workitemResult.workItems?.forEach((workitem) => {
            workItemIds.push(workitem.id!);
        })
        var workitems : WorkItem[] = await client.getWorkItems(workItemIds,undefined,undefined,undefined,undefined,project = project!);
        return workitems;
      }
    
}