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

    private async getHeaders() {
        let accessToken = await this.actionParams.endpoint?.getToken();
        core.debug("Successfully got token");

        return {
            authorization: 'Bearer '+ accessToken,
            'Content-Type': 'application/json'
        };
    }

    private async getRequest() {
        let headers = await this.getHeaders();

        let configUrl = `${this.actionParams.endpoint?.baseUrl}subscriptions/${this.actionParams.endpoint?.subscriptionID}/resourceGroups/${this.actionParams.resourceGroupName}/providers/Microsoft.Web/sites/${this.actionParams.appName}/config/web?${azureApiVersion}`;
        core.debug(`Configuring rule for traffic on ${configUrl}`);

        let configData = {
            properties: {
                experiments: {
                    rampUpRules: [
                        {
                            name: this.actionParams.slotName,
                            actionHostName: `${this.actionParams.appName}-${this.actionParams.slotName}.azurewebsites.net`,
                            reroutePercentage : this.actionParams.trafficPercentage,
                        }
                    ]
                }
            }
        };
        let configDataStr = JSON.stringify(configData);
        core.debug(`ConfigData = ${configDataStr}`);
        
        return <WebRequest> {
            method: "post",
            uri: configUrl,
            headers: headers,
            body: configDataStr
        }
    }

    async applyRoutingRule() {
        try {
            core.debug("Routing traffic");
            
            let request = await this.getRequest();
            let res = await this.serviceClient.beginRequest(request);
            if (res.statusCode === 200)
            {
                try {
                    var retConfig = JSON.parse(res.body);
                    var exp = retConfig.properties.experiments.rampUpRules[0];
                    core.debug(`Call success: ${JSON.stringify(exp)}`);
                } catch (e) {
                    core.warning(`Could not deserialize return packet from experiment update: ${e}`);
                }
            
                core.info(`Successfully configured experiment directing ${this.actionParams.trafficPercentage}% traffic to ${this.actionParams.slotName} on ${this.actionParams.appName}`);
            } else {
                core.error(`Could not configure app settings experiment: [${res.statusCode}] ${res.statusMessage}`);
            }
        }
        catch (ex) {
            core.error(ex);
        }
    }
}