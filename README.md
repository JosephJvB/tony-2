# Welcome to your CDK TypeScript project

change outdir
https://github.com/aws/aws-cdk/issues/18743

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

what resources do I want?
several lambdas that can invokeasync each other, sure why not
if I want I can turn it into a state machine / queue driven thingo
can save backups of things to s3 too yayuh
so lets have an s3 bucket too