import * as process from 'process';
import { AuthorizerFactory } from 'azure-actions-webclient/AuthorizerFactory';
import nock from 'nock';
import main from '../src/main';

describe('action test suite', () => {
  beforeAll(async () => {
    await jest.spyOn(AuthorizerFactory, 'getAuthorizer').mockResolvedValue({
      getToken: force => Promise.resolve('BearerToken'),
      subscriptionID: 'SubscriptionId',
      baseUrl: 'http://baseUrl/',
      getCloudEndpointUrl: _ => '',
      getCloudSuffixUrl: _ => ''
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
              name: 'staging',
              actionHostName: 'webapp-staging.azurewebsites.net',
              reroutePercentage: 20
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
      .put(
        '/subscriptions/SubscriptionId/resourceGroups/rg-test/providers/Microsoft.Web/sites/webapp/config/web?api-version=2016-08-01'
      )
      .reply(200, responseBody);

    // run the task
    await main();
  });
});
