import * as EC2ServiceBase from '../providers/ec2Provider';
import * as RDSServiceBase from '../providers/rdsProvider';
import * as ReservedInstanceCalculatorBase from '../services/reservedInstanceCalculator';
import * as SlackHelperBase from '../services/slackHelper';
import App from './app';
import { createStubInstance, sandbox } from 'sinon';
import { expect } from 'chai';

// TODO: Move to parent folder
describe('App', () => {
    describe('#Run', () => {
        let region: string = 'ap-northeast-1';
        let webhookUrl: string = 'http://webhook/url';
        let environment: sinon.SinonSandbox;
        // TODO: Find better solution instead of using any
        let ec2ServiceStub: any;
        let rdsServiceStub: any;
        let reservedInstanceCalculatorStub: any;
        let slackHelperStub: any;

        beforeEach(() => {
            environment = sandbox.create();

            ec2ServiceStub = environment.stub(EC2ServiceBase, "EC2Service");
            ec2ServiceStub.prototype.describeActiveReservedInstances = environment.stub();
            ec2ServiceStub.prototype.describeRunningInstances = environment.stub();
            ec2ServiceStub.prototype.getInstancesUrl = environment.stub();

            rdsServiceStub = environment.stub(RDSServiceBase, "RDSService");
            rdsServiceStub.prototype.describeActiveReservedInstances = environment.stub();
            rdsServiceStub.prototype.describeRunningInstances = environment.stub();
            rdsServiceStub.prototype.getInstancesUrl = environment.stub();

            reservedInstanceCalculatorStub = environment.stub(ReservedInstanceCalculatorBase, "ReservedInstranceCalculator");
            reservedInstanceCalculatorStub.prototype.getInstanceNotReserved = environment.stub();

            slackHelperStub = environment.stub(SlackHelperBase, "SlackHelper");
            slackHelperStub.prototype.formatInstanceToSlackAttachment = environment.stub();
            slackHelperStub.prototype.sendToSlack = environment.stub();
        });

        afterEach(() => {
            environment.restore();
        });

        it('should be successed', (done) => {
            ec2ServiceStub.prototype.describeActiveReservedInstances.returns(Promise.resolve({}));
            ec2ServiceStub.prototype.describeRunningInstances.returns(Promise.resolve({}));
            ec2ServiceStub.prototype.getInstancesUrl.returns('http://instance/url');
            rdsServiceStub.prototype.describeActiveReservedInstances.returns(Promise.resolve({}));
            rdsServiceStub.prototype.describeRunningInstances.returns(Promise.resolve({}));
            rdsServiceStub.prototype.getInstancesUrl.returns('http://instance/url');
            reservedInstanceCalculatorStub.prototype.getInstanceNotReserved.returns([]);
            slackHelperStub.prototype.formatInstanceToSlackAttachment.returns({});
            slackHelperStub.prototype.sendToSlack.returns(Promise.resolve());

            let app = new App(
                [
                    new ec2ServiceStub,
                    new rdsServiceStub
                ],
                new reservedInstanceCalculatorStub(),
                new slackHelperStub(region, webhookUrl));
            let actual = app.Run();

            actual.then(() => {
                expect(ec2ServiceStub.prototype.describeActiveReservedInstances.called).to.be.true;
                expect(ec2ServiceStub.prototype.describeRunningInstances.called).to.be.true;
                expect(ec2ServiceStub.prototype.getInstancesUrl.called).to.be.true;
                expect(rdsServiceStub.prototype.describeActiveReservedInstances.called).to.be.true;
                expect(rdsServiceStub.prototype.describeRunningInstances.called).to.be.true;
                expect(rdsServiceStub.prototype.getInstancesUrl.called).to.be.true;
                expect(reservedInstanceCalculatorStub.prototype.getInstanceNotReserved.called).to.be.true;
                expect(slackHelperStub.prototype.formatInstanceToSlackAttachment.called).to.be.true;
                expect(slackHelperStub.prototype.formatInstanceToSlackAttachment.called).to.be.true;
                done();
            })
        })
    });
});