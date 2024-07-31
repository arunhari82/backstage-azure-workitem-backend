import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service/router';

/**
 * azure-workitemPlugin backend plugin
 *
 * @public
 */
export const plugin = createBackendPlugin({
  pluginId: 'azure-workitem',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        httpAuth: coreServices.httpAuth,
        discovery: coreServices.discovery,
        reader: coreServices.urlReader
      },
      async init({ httpRouter, logger, config, httpAuth, discovery,reader }) {
        logger.info('azure-workitem plugin :: init');
        httpRouter.use(
          await createRouter({
            logger,
            config,
            httpAuth,
            discovery,
            reader
          }),
        );
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
        httpRouter.addAuthPolicy({
          path: '/workitems',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
