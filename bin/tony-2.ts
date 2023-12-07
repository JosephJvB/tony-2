#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { Tony2Stack } from '../stacks/tony-2-stack'
import { Tony2SupportStack } from '../stacks/tony-2-support-stack'

export const MAIN_STACK_ID = 'Tony2Stack'

const app = new cdk.App()
// -c env=dev
// const targetEnv = app.node.tryGetContext('env')
const mainStack = new Tony2Stack(app, MAIN_STACK_ID, {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  env: { account: '355151872526', region: 'eu-west-2' },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
})

new Tony2SupportStack(app, 'Tony2SupportStack', {
  env: { account: '355151872526', region: 'eu-west-2' },
  backupsBucketName: mainStack.backupsBucket.bucketName,
})
