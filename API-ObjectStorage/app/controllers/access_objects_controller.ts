import type { HttpContext } from '@adonisjs/core/http'
import { FilesValidator } from '#validators/file'
import drive from '@adonisjs/drive/services/main'

export default class AccessObjectsController {
	async index({ auth }: HttpContext) {
		const user = auth.getUserOrFail()
		
		const disk = drive.use('s3')
		const prefix = `files/${user.id}/` // List only files for the authenticated user
		const response = await disk.listAll(prefix)

		/**
		 * Loop over the "objects" property, which is an "Iterator".
		 * Each item in the list can be an instance of "DriveFile"
		 * or "DriveDirectory"
		 */
		let objects: Array<{ isFile: boolean, key?: string, prefix?: string }> = []
		for (let item of response.objects) {
			if (item.isFile) {
				objects.push({ isFile: true , key: item.key })
			} else {
				objects.push({ isFile: false, prefix: item.prefix })
			}
		}
		return {
			objects: objects,
		}
	}

	async store({ auth, request, response }: HttpContext) {
		const user = auth.getUserOrFail()
		
		const  payload  = await request.validateUsing(FilesValidator)
	
		if (!payload || payload?.files?.length === 0) {
			return response.badRequest('Please upload a file')
		}
	
		for (const file of payload.files) {
			const fileName = `${file.clientName}`
			const s3Path = `files/${user.id}/${fileName}`
			// TODO: save name to postgres
			if (await drive.use('s3').exists(s3Path)) {
				// append to response not stopping the loop to check for other files
				// return response.conflict(`File with name ${fileName} already exists`)
				continue
			}
			await file.moveToDisk(s3Path, 's3')
			// console.log(`File uploaded to path: ${s3Path}`)
		}
		if (payload.files.length === 1) {
			return 'File uploaded successfully'
		}
		else {
			return `The ${payload.files.length} files uploaded successfully`
		}
	}

	async show({ auth, params, response }: HttpContext) {
		const user = auth.getUserOrFail()

		const disk = drive.use('s3')
		const prefix = `files/${user.id}/${params.id}` // List only files for the authenticated user
		if (await disk.exists(prefix)) {
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

		const disk = drive.use('s3')
		const payload = await request.validateUsing(FilesValidator)

		if (!payload || payload.files.length === 0 || params.id === undefined) {
			return response.badRequest('Please upload a file')
		}

		const prefix = `files/${user.id}/${params.id}`
		if (!(await disk.exists(prefix))) {
			return response.notFound({
				message: `Object with id ${params.id} not found`,
			})
		}

		for (const file of payload.files) {
			await file.moveToDisk(prefix, 's3')
		}

		return {
			message: `Object with id ${params.id} updated successfully`,
		}
	}

	async updateMany({ auth, request, response }: HttpContext) {
		const user = auth.getUserOrFail()

		const disk = drive.use('s3')
		const payload = await request.validateUsing(FilesValidator)

		if (!payload || payload.files.length === 0) {
			return response.badRequest('Please upload a file')
		}

		let updatedCount = 0
		for (const file of payload.files) {
			const prefix = `files/${user.id}/${file.clientName}`
			if (!(await disk.exists(prefix))) {
				continue
			}

			await file.moveToDisk(prefix, 's3')
			updatedCount++
		}

		return {
			message: updatedCount === 0
				? 'No existing objects were updated'
				: `${updatedCount} files updated successfully`,
		}
	}

	async destroy({ auth, params, response }: HttpContext) {
		const user = auth.getUserOrFail()

		const disk = drive.use('s3')

		if (params.id === undefined) {
			return response.badRequest('Please provide a file id')
		}
		const id = params.id

		const prefix = `files/${user.id}/${id}`
		if (!(await disk.exists(prefix)))
		{
			return response.notFound({
				message: `Object with id ${id} not found`,
			})
		}

		await disk.delete(prefix)

		return {
			message: `Object with id ${id} deleted successfully`
		}
	}

	async destroyMany({ auth, request, response }: HttpContext) {
		const user = auth.getUserOrFail()

		const disk = drive.use('s3')
		const ids = request.input('ids') as string[] | undefined

		if (!ids || ids.length === 0) {
			return response.badRequest('Please provide at least one file id')
		}

		let deletedCount = 0
		for (const id of ids) {
			const prefix = `files/${user.id}/${id}`
			if (!(await disk.exists(prefix))) {
				continue
			}

			await disk.delete(prefix)
			deletedCount++
		}

		return {
			message: deletedCount === 1 && ids.length === 1
				? `Object with id ${ids[0]} deleted successfully`
				: `${deletedCount} files deleted successfully`,
		}
	}
}
