import * as core from '@actions/core';

import { IAuthorizer } from 'azure-actions-webclient/Authorizer/IAuthorizer';

export class ActionParameters {
  private static actionparams: ActionParameters;
  private _endpoint: IAuthorizer;
  private _resourceGroupName: string;
  private _appName: string;
  private _slotName: string;
  private _trafficPercentage: number;

  private constructor(endpoint: IAuthorizer) {
    this._endpoint = endpoint;
    this._resourceGroupName = core.getInput('resource-group', {
      required: true
    });
    this._appName = core.getInput('app-name', { required: true });
    this._slotName = core.getInput('slot-name', { required: true });
    this._trafficPercentage = parseFloat(
      core.getInput('percentage-traffic', { required: true })
    );
  }

  static getActionParams(endpoint: IAuthorizer): ActionParameters {
    if (!this.actionparams) {
      this.actionparams = new ActionParameters(endpoint);
    }
    return this.actionparams;
  }

  get endpoint(): IAuthorizer {
    return this._endpoint;
  }

  get resourceGroupName(): string {
    return this._resourceGroupName;
  }

  get appName(): string {
    return this._appName;
  }

  get slotName(): string {
    return this._slotName;
  }

  get trafficPercentage(): number {
    return this._trafficPercentage;
  }
}
