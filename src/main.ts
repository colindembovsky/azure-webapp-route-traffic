import * as core from '@actions/core';
import * as crypto from 'crypto';

import { ActionParameters } from './actionParameters';

import { AuthorizerFactory } from 'azure-actions-webclient/AuthorizerFactory';
import { IAuthorizer } from 'azure-actions-webclient/Authorizer/IAuthorizer';
import { Router } from './router';
//import { ValidatorFactory } from './ActionInputValidator/ValidatorFactory';

const prefix = process.env.AZURE_HTTP_USER_AGENT
  ? `${process.env.AZURE_HTTP_USER_AGENT}`
  : '';

async function main(): Promise<void> {
  let isDeploymentSuccess = true;

  try {
    // Set user agent variable
    const usrAgentRepo = crypto
      .createHash('sha256')
      .update(`${process.env.GITHUB_REPOSITORY}`)
      .digest('hex');
    const actionName = 'WebAppRouteTraffic';
    const userAgentString = `${
      prefix ? `${prefix}+` : ''
    }GITHUBACTIONS_${actionName}_${usrAgentRepo}`;
    core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentString);

    // Initialize action inputs
    const endpoint: IAuthorizer = await AuthorizerFactory.getAuthorizer();
    ActionParameters.getActionParams(endpoint);

    const router = new Router();
    await router.applyRoutingRule();
  } catch (error) {
    isDeploymentSuccess = false;
    core.setFailed(`Route traffic failed with error: ${error}`);
  } finally {
    // Reset AZURE_HTTP_USER_AGENT
    core.exportVariable('AZURE_HTTP_USER_AGENT', prefix);

    core.debug(
      isDeploymentSuccess ? 'Route traffic succeeded' : 'Route traffic failed'
    );
  }
}

main();
