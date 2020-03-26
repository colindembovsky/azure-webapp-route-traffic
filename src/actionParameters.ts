import * as core from '@actions/core';

import { IAuthorizer } from "azure-actions-webclient/Authorizer/IAuthorizer";

export class ActionParameters {
    private static actionparams: ActionParameters;
    private _endpoint?: IAuthorizer;
    private _resourceGroupName: string;
    private _appName: string;
    private _slotName: string;
    private _trafficPercentage: number;

    private constructor(endpoint: IAuthorizer | undefined) {
        this._endpoint = endpoint;    
        this._resourceGroupName = core.getInput('resource-group', { required: true });
        this._appName = core.getInput('app-name', { required: true });
        this._slotName = core.getInput('slot-name', { required: true });
        this._trafficPercentage = parseFloat(core.getInput('traffic-percentage', { required: true }));
    }

    public static getActionParams(endpoint?: IAuthorizer) {
        if(!this.actionparams) {
            this.actionparams = new ActionParameters(!!endpoint ? endpoint : undefined);
        }
        return this.actionparams;
    }

    public get endpoint() {
        return this._endpoint;
    }

    public get resourceGroupName() {
        return this._resourceGroupName;
    }

    public get appName() {
        return this._appName;
    }

    public get slotName() {
        return this._slotName;
    }

    public get trafficPercentage() {
        return this._trafficPercentage;
    }
}