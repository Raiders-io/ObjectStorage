import type { HttpContext } from '@adonisjs/core/http'
import { FilesValidator } from '#validators/file'
import drive from '@adonisjs/drive/services/main'
import Object from '#models/object'
import db from '@adonisjs/lucid/services/db'

const diskName = 's3'
const disk = drive.use(diskName)

export default class AccessObjectsController {
	async index({ auth }: HttpContext) {
		const user = auth.getUserOrFail()
		
		const response = await Object.query().where('owner_id', user.id).select('key', 'name', 'size_bytes', 'mime_type', 'visibility', 'created_at')
		return response
		// const prefix = `files/${user.id}/` // List only files for the authenticated user
		// const response = await disk.listAll(prefix)
		/**
		 * Loop over the "objects" property, which is an "Iterator".
		 * Each item in the list can be an instance of "DriveFile"
		 * or "DriveDirectory"
		 */
		// let objects: Array<{ isFile: boolean, key?: string, prefix?: string }> = []
		// for (let item of response.objects) {
		// 	if (item.isFile) {
		// 		objects.push({ isFile: true , key: item.key })
		// 	} else {
		// 		objects.push({ isFile: false, prefix: item.prefix })
		// 	}
		// }
		// return {
		// 	objects: objects,
		// }
	}

	async store({ auth, request, response }: HttpContext) {
		const user = auth.getUserOrFail()
		
		const  payload  = await request.validateUsing(FilesValidator)
		
		if (!payload || payload?.files?.length === 0) {
			return response.badRequest('Please upload a file')
		}

		let objects = []

		for (const file of payload.files) {
			const fileName = `${file.clientName}`
			const s3Path = `files/${user.id}/${fileName}`

			if (await Object.query().where('owner_id', user.id).where('key', s3Path).first() || await disk.exists(s3Path)) {
				objects.push({ key: s3Path, error: `File with name ${fileName} already exists, use update if you want to replace it` })
				continue
			}

			const fileSave = await db.transaction(async (trx): Promise<boolean> => {
				await Object.create({
					ownerId: user.id,
					key: s3Path,
					name: fileName,
					sizeBytes: file.size,
					mimeType: file.type,
					visibility: 'private',
				}, { client: trx })
				// object.save()
				await file.moveToDisk(s3Path, diskName)
				return true
			})
			if (!fileSave) { objects.push({ key: s3Path, error: 'Failed to save file' }) }
			else { objects.push({ key: s3Path, message: 'File uploaded successfully' }) }
			// console.log(`File uploaded to path: ${s3Path}`)
		}
		if (objects.length === 0) {
			return response.internalServerError('Failed to upload files')
		}
		return {objects}
	}

	async show({ auth, params, response }: HttpContext) {
		const user = auth.getUserOrFail()

		const prefix = `files/${user.id}/${params.id}` // List only files for the authenticated user
		if (await Object.query().where('owner_id', user.id).where('key', prefix).first() || await disk.exists(prefix)) {
			const stream = await disk.getStream(prefix)
			response.header('Content-Disposition', `attachment; filename="${params.id}"`)
			response.header('Content-Type', 'application/octet-stream')
			return response.stream(stream)
		}
		return response.notFound({
			message: `Object with id ${params.id} not found`,
		})
	}

	async update({ auth, params, request, response }: HttpContext) {
		const user = auth.getUserOrFail()

		const payload = await request.validateUsing(FilesValidator)

		if (!payload || payload.files.length === 0 || params.id === undefined) {
			return response.badRequest('Please upload a file')
		}

		const prefix = `files/${user.id}/${params.id}`
		if (!(await Object.query().where('owner_id', user.id).where('key', prefix).first()) || !(await disk.exists(prefix))) {
			return response.notFound({
				message: `Object with id ${params.id} not found`,
			})
		}

		for (const file of payload.files) {
			Object.query().where('owner_id', user.id).where('key', prefix).update({
				sizeBytes: file.size,
				mimeType: file.type,
				updatedAt: new Date()
			})
			await file.moveToDisk(prefix, diskName)
		}

		return {
			message: `Object with id ${params.id} updated successfully`,
		}
	}

	async updateMany({ auth, request, response }: HttpContext) {
		const user = auth.getUserOrFail()

		const payload = await request.validateUsing(FilesValidator)

		if (!payload || payload.files.length === 0) {
			return response.badRequest('Please upload a file')
		}

		let objects = []
		for (const file of payload.files) {
			const prefix = `files/${user.id}/${file.clientName}`
			if (!(await Object.query().where('owner_id', user.id).where('key', prefix).first())
				|| !(await disk.exists(prefix)))
			{
				objects.push({ key: prefix, message: 'Failed to update file' })
				continue
			}

			Object.query().where('owner_id', user.id).where('key', prefix).update({
				sizeBytes: file.size,
				mimeType: file.type,
				updatedAt: new Date()
			})
			await file.moveToDisk(prefix, diskName)
			objects.push({ key: prefix, message: 'File updated successfully' })
		}

		return { objects }
	}

	async destroy({ auth, params, response }: HttpContext) {
		const user = auth.getUserOrFail()

		if (params.id === undefined) {
			return response.badRequest('Please provide a file id')
		}
		const id = params.id

		const prefix = `files/${user.id}/${id}`
		if (!(await Object.query().where('owner_id', user.id).where('key', prefix).first()) || !(await disk.exists(prefix))) {
			return response.notFound({
				message: `Object with id ${id} not found`,
			})
		}

		await disk.delete(prefix)
		await Object.query().where('owner_id', user.id).where('key', prefix).delete()

		return {
			message: `Object with id ${id} deleted successfully`
		}
	}

	async destroyMany({ auth, request, response }: HttpContext) {
		const user = auth.getUserOrFail()

		const ids = request.input('ids') as string[] | undefined

		if (!ids || ids.length === 0) {
			return response.badRequest('Please provide at least one file id')
		}

		let objects = []

		for (const id of ids) {
			const prefix = `files/${user.id}/${id}`
			if (!(await Object.query().where('owner_id', user.id).where('key', prefix).first()) || !(await disk.exists(prefix))) {
				objects.push({ key: prefix, error: 'Failed to delete file' })
				continue
			}

			await disk.delete(prefix)
			await Object.query().where('owner_id', user.id).where('key', prefix).delete()
			objects.push({ key: prefix, message: 'File deleted successfully' })
		}

		return { objects }
	}
}
