import * as core from '@actions/core';

import { ActionParameters } from './actionParameters';
import { ServiceClient } from 'azure-actions-webclient/AzureRestClient';
import { WebRequest } from 'azure-actions-webclient/WebClient';

const azureApiVersion = 'api-version=2016-08-01';

export class Router {
  private actionParams: ActionParameters;
  private serviceClient: ServiceClient;

  constructor() {
    this.actionParams = ActionParameters.getActionParams();
    this.serviceClient = new ServiceClient(this.actionParams.endpoint!);
  }

  private async getHeaders(): Promise<{}> {
    const accessToken = await this.actionParams.endpoint?.getToken();
    core.debug('Successfully got token');

    return {
      authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  private async getRequest(): Promise<WebRequest> {
    const headers = await this.getHeaders();
    const configUrl = `${this.actionParams.endpoint?.baseUrl}subscriptions/${this.actionParams.endpoint?.subscriptionID}/resourceGroups/${this.actionParams.resourceGroupName}/providers/Microsoft.Web/sites/${this.actionParams.appName}/config/web?${azureApiVersion}`;
    core.debug(`Configuring rule for traffic on ${configUrl}`);

    const configData = {
      properties: {
        experiments: {
          rampUpRules: [
            {
              name: this.actionParams.slotName,
              actionHostName: `${this.actionParams.appName}-${this.actionParams.slotName}.azurewebsites.net`,
              reroutePercentage: this.actionParams.trafficPercentage
            }
          ]
        }
      }
    };
    const configDataStr = JSON.stringify(configData);
    core.debug(`ConfigData = ${configDataStr}`);

    return {
      method: 'post',
      uri: configUrl,
      headers,
      body: configDataStr
    };
  }

  async applyRoutingRule(): Promise<void> {
    try {
      core.debug('Routing traffic');

      const request = await this.getRequest();
      const res = await this.serviceClient.beginRequest(request);

      if (res.statusCode === 200) {
        try {
          const retConfig = JSON.parse(res.body);
          const exp = retConfig.properties.experiments.rampUpRules[0];
          core.debug(`Call success: ${JSON.stringify(exp)}`);
        } catch (e) {
          core.warning(
            `Could not deserialize return packet from traffic update: ${e}`
          );
        }

        core.info(
          `Successfully configured traffic directing ${this.actionParams.trafficPercentage}% traffic to ${this.actionParams.slotName} on ${this.actionParams.appName}`
        );
      } else {
        core.error(
          `Could not configure traffic: [${res.statusCode}] ${res.statusMessage}`
        );
      }
    } catch (ex) {
      core.error(ex);
    }
  }
}
