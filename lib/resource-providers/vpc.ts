import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ResourceContext, ResourceProvider } from "../spi";

/**
 * VPC resource provider 
 */
export class VpcProvider implements ResourceProvider<ec2.IVpc> {
    readonly vpcId?: string;
    readonly secondaryCidrId?: string;

    constructor(vpcId?: string, secondaryCidrId?: string) {
        this.vpcId = vpcId;
        this.secondaryCidrId = secondaryCidrId;
    }

    provide(context: ResourceContext): ec2.IVpc {
        const id = context.scope.node.id;
        let vpc = undefined;

        if (this.vpcId) {
            if (this.vpcId === "default") {
                console.log(`looking up completely default VPC`);
                vpc = ec2.Vpc.fromLookup(context.scope, id + "-vpc", { isDefault: true });
            } else {
                console.log(`looking up non-default ${this.vpcId} VPC`);
                vpc = ec2.Vpc.fromLookup(context.scope, id + "-vpc", { vpcId: this.vpcId });
            }
        }

        if (vpc == null) {
            // It will automatically divide the provided VPC CIDR range, and create public and private subnets per Availability Zone.
            // Network routing for the public subnets will be configured to allow outbound access directly via an Internet Gateway.
            // Network routing for the private subnets will be configured to allow outbound access via a set of resilient NAT Gateways (one per AZ).
            vpc = new ec2.Vpc(context.scope, id + "-vpc");
            if (this.secondaryCidrId) {
                new ec2.CfnVPCCidrBlock(context.scope, id + "-secondaryCidr", {
                    vpcId: vpc.vpcId,
                    cidrBlock: this.secondaryCidrId});
            }
        }
        return vpc;
    }
}

export class DirectVpcProvider implements ResourceProvider<ec2.IVpc> {
     constructor(readonly vpc: ec2.IVpc) { }

    provide(_context: ResourceContext): ec2.IVpc {
        return this.vpc;
    }    
}