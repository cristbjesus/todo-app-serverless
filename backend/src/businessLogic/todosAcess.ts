import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('TodosAccess')

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE
  ) { }

  async getTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info('Getting all TODO items for a current user')

    const result = await this.docClient.query({
      TableName: this.todosTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false
    }).promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    logger.info('Creating TODO item')

    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem
    }).promise()

    return todoItem
  }

  async updateTodo(userId: string, todoId: string, todoUpdate: TodoUpdate): Promise<void> {
    logger.info('Updating a TODO item for a current user')

    await this.docClient.update({
      TableName: this.todosTable,
      Key: { userId, todoId },
      ExpressionAttributeNames: { '#N': 'name' },
      UpdateExpression: 'set #N=:todoName, dueDate=:dueDate, done=:done',
      ExpressionAttributeValues: {
        ':todoName': todoUpdate.name,
        ':dueDate': todoUpdate.dueDate,
        ':done': todoUpdate.done
    },
      ReturnValues: 'UPDATED_NEW'
    }).promise()
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    logger.info('Deleting a TODO item for a current user')

    await this.docClient.delete({
      TableName: this.todosTable,
      Key: { userId, todoId }
    }).promise()
  }

  async updateTodoAttachmentUrl(userId: string, todoId: string, uploadUrl: string): Promise<void> {
    logger.info('Updating a TODO item attachment url for a current user')

    await this.docClient.update({
      TableName: this.todosTable,
      Key: { userId, todoId },
      UpdateExpression: 'set attachmentUrl=:URL',
      ExpressionAttributeValues: {
        ':URL': uploadUrl.split('?')[0]
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise()
  }

  async getTodo(userId: string, todoId: string): Promise<TodoItem> {
    logger.info('Get a TODO item for a current user')

    const result = await this.docClient.get({
      TableName: this.todosTable,
      Key: { userId, todoId }
    }).promise()

    return result.Item as TodoItem
  }
}
