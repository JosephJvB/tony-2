import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

export const getSsmParameter = async (paramName: string) => {
  const client = new SSMClient()

  const cmd = new GetParameterCommand({
    Name: paramName,
  })

  const result = await client.send(cmd)

  if (!result.Parameter?.Value) {
    throw new Error(`Failed to find ssm parameter "${paramName}"`)
  }

  return result.Parameter.Value
}
