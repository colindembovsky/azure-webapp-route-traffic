import * as process from 'process';
import { AuthorizerFactory } from 'azure-actions-webclient/AuthorizerFactory';
import nock from 'nock';
import main from '../src/main';

describe('action test suite', () => {
  beforeAll(async () => {
    jest.spyOn(AuthorizerFactory, 'getAuthorizer').mockResolvedValue({
      getToken: force => Promise.resolve('BearerToken'),
      subscriptionID: 'SubscriptionId',
      baseUrl: 'http://baseUrl/',
      getCloudEndpointUrl: name => '',
      getCloudSuffixUrl: suffixName => '.database.windows.net'
    });
  });

  it('should route traffic', async () => {
    // set inputs
    process.env['GITHUB_REPOSITORY'] = 'foo/bar';

    process.env['INPUT_RESOURCE-GROUP'] = 'rg-test';
    process.env['INPUT_APP-NAME'] = 'webapp';
    process.env['INPUT_SLOT-NAME'] = 'staging';
    process.env['INPUT_PERCENTAGE-TRAFFIC'] = '20';

    // mock the rest api calls
    const responseBody = {
      properties: {
        experiments: {
          rampUpRules: [
            {
              name: 'blue',
              actionHostName: 'myapp-slot.azurewebsites.net',
              reroutePercentage: 22.345
            }
          ]
        }
      }
    };
    nock('http://baseUrl')
      .persist()
      .defaultReplyHeaders({
        'Content-Type': 'application/json'
      })
      .post(
        '/subscriptions/SubscriptionId/resourceGroups/rg-test/providers/Microsoft.Web/sites/webapp/config/web?api-version=2016-08-01'
      )
      .reply(200, responseBody);

    // run the task
    await main();
  });
});
