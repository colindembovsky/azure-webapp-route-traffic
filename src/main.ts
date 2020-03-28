import * as core from '@actions/core';
import * as crypto from 'crypto';

import { ActionParameters } from './actionParameters';

import { AuthorizerFactory } from 'azure-actions-webclient/AuthorizerFactory';
import { Router } from './router';

const prefix = process.env.AZURE_HTTP_USER_AGENT
  ? `${process.env.AZURE_HTTP_USER_AGENT}`
  : '';

export async function main(): Promise<void> {
  let isDeploymentSuccess = true;

  try {
    // Set user agent variable
    const usrAgentRepo = crypto
      .createHash('sha256')
      .update(`${process.env.GITHUB_REPOSITORY}`)
      .digest('hex');
    const actionName = 'WebAppRouteTraffic';
    const pref = prefix ? `${prefix}+` : '';
    const userAgentString = `${pref}GITHUBACTIONS_${actionName}_${usrAgentRepo}`;
    core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentString);

    // Initialize action inputs
    core.info("------------------------- getting authorizer");
    const endpoint = await AuthorizerFactory.getAuthorizer();
    core.info("------------------------- after getAuthorizer");
    core.info(endpoint.baseUrl);
    core.info("------------------------- baseUrl");
    const actionParams = ActionParameters.getActionParams(endpoint);

    const router = new Router(actionParams);
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

core.debug(process.env.TESTACTIONJEST!);
if (process.env.TESTACTIONJEST && process.env.TESTACTIONJEST === "testing") {
  core.debug("=== SKIPPING AMBIENT INVOCATION FOR TESTING PURPOSES");
} else {
  main();
}

export default main;
