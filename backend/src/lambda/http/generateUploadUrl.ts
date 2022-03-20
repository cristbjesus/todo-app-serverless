import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { createAttachmentPresignedUrl } from '../../businessLogic/todos'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)

    const result = await createAttachmentPresignedUrl(userId, todoId)

    if (result instanceof Error) {
      return {
        statusCode: result.statusCode,
        body: JSON.stringify({
          error: result.message
        })
      }
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        uploadUrl: result
      })
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
