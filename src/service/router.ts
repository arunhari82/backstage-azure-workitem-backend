// TODO: We should use the MiddlewareFactory from @backstage/backend-defaults/rootHttpRouter, but it is not available in RHDH 1.2.x
import { MiddlewareFactory } from '@backstage/backend-app-api';
import { createLegacyAuthAdapters } from '@backstage/backend-common';
import {
  DiscoveryService,
  HttpAuthService,
  LoggerService,
  UrlReaderService,
} from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import express from 'express';
import Router from 'express-promise-router';
import { AzureDevopsWorkItemApi } from '../api';

export interface RouterOptions {
  logger: LoggerService;
  config: Config;
  discovery: DiscoveryService;
  httpAuth?: HttpAuthService;
  azureDevOpsWorkItemApi?: AzureDevopsWorkItemApi;
  reader: UrlReaderService;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config , reader } = options;
  const { httpAuth } = createLegacyAuthAdapters(options);

  const azureDevOpsWorkItemApi =
  options.azureDevOpsWorkItemApi ||
  AzureDevopsWorkItemApi.fromConfig(config, { logger, urlReader: reader });

  const router = Router();
  router.use(express.json());
  router.get('/health', async (_, res) => res.json({ status: 'ok' }));

  router.get('/hello', async (req, res) => {
    const caller = await httpAuth.credentials(req, { allow: ['user'] });
    res.json({ message: `Hello ${caller.principal.userEntityRef}` });
  });

  router.get('/workitems/:projectName', async (req, res) => {
    const project = req.params.projectName;
    const workitems = await azureDevOpsWorkItemApi.getWorkItems(project);
    res.status(200).json(workitems);
  });

  const middleware = MiddlewareFactory.create({ logger, config });

  router.use(middleware.error());
  return router;
}
