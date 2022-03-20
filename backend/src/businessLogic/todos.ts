import { TodosAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import * as createError from 'http-errors'

const logger = createLogger('Todos')
const todosAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
  return todosAccess.getTodosForUser(userId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  logger.info('Create TODO request: ', createTodoRequest)

  const todoId = uuid.v4()

  return await todosAccess.createTodo({
    userId,
    todoId,
    createdAt: new Date().toISOString(),
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false
  })
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updateTodoRequest: UpdateTodoRequest
): Promise<void | createError.HttpError> {
  logger.info('Update TODO request: ', updateTodoRequest)

  const todoItem = await todosAccess.getTodo(userId, todoId)

  if (!todoItem) {
    logger.error('TODO not found')
    return createError(404, 'This TODO does not exist!')
  }

  return await todosAccess.updateTodo(userId, todoId, updateTodoRequest)
}

export async function deleteTodo(
  userId: string,
  todoId: string
): Promise<void | createError.HttpError> {
  logger.info('Delete TODO request: ', { userId, todoId })

  const todoItem = await todosAccess.getTodo(userId, todoId)

  if (!todoItem) {
    logger.error('TODO not found')
    return createError(404, 'This TODO does not exist!')
  }

  attachmentUtils.deleteAttachment(todoId)

  return await todosAccess.deleteTodo(userId, todoId)
}

export async function createAttachmentPresignedUrl(
  userId: string,
  todoId: string
): Promise<string | createError.HttpError> {
  logger.info('Create attachment presigned url request: ', { userId, todoId })

  const todoItem = await todosAccess.getTodo(userId, todoId)

  if (!todoItem) {
    logger.error('TODO not found')
    return createError(404, 'This TODO does not exist!')
  }

  const uploadUrl = attachmentUtils.createAttachmentPresignedUrl(todoId)
  await todosAccess.updateTodoAttachmentUrl(userId, todoId, uploadUrl)
  return uploadUrl
}
