<p align="center">
  <a href="https://github.com/colindembovsky/azure-webapp-route-traffic"><img alt="action status" src="https://github.com/colindembovsky/azure-webapp-route-traffic/workflows/build-test/badge.svg"></a>
</p>

# Traffic Manager: Route a Percentage of Traffic to an Azure Web App Slot

Use this action to configure traffic manager on an Azure Web App to direct a percentage of traffic to a slot.

## Usage

```yml
    # add a login action
    - name: 'Login via Azure CLI'
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    # now you can route traffic
    - name: 'Route traffic'
      uses: colindembovsky/azure-webapp-route-traffic@v1.0.1
      with: 
        resource-group: rg-containing-web-app
        app-name: web-app-name
        slot-name: slot-name
        percentage-traffic: 21 # percentage of traffic to route to slot
```

> Note: To set up the credentials for the `az login` action, refer to [this repo](https://github.com/marketplace/actions/azure-login).

## Developing

```bash
yarn install
yarn run build  # builds the typescript
yarn lint       # runs linting
yarn test       # runs the unit test
yarn run pack   # creates the bundle (the run keywork is important)
```

### Bug in AuthorizerFactory
For some reason, the `azure-actions-webclient/AuthorizerFactory` breaks when it tries to set the access token as a secret in the logs.

To work around this, replace the `getToken` method in the `dist/index.js` file after running `yarn run pack`:
```ts
getToken(force, args) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this._token || force) {
            try {
                let azAccessToken = JSON.parse(yield AzureCLIAuthorizer.executeAzCliCommand('account get-access-token', !!args ? args : []));
                // this try/catch is a hack to fix the error
                try {
                    core.setSecret(azAccessToken);
                } catch(error){
                    // do nothing
                }
                this._token = azAccessToken['accessToken'];
            }
            catch (error) {
                console.log('Failed to fetch Azure access token');
                console.log(error);
                throw error;
            }
        }
        return this._token;
    });
}
```