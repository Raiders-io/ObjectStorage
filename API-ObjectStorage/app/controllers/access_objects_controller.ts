import type { HttpContext } from '@adonisjs/core/http'

export default class AccessObjectsController {
	async index() {
		return {
			objects: [],
		}
	}

	async store() {
		return {
			message: 'Object created successfully',
		}
	}

	async show({ params }: HttpContext) {
		return {
			object: {
				id: params.id,
				name: 'Example Object',
				size: 1024,
			},
		}
	}

	async update({ params }: HttpContext) {
		return {
			message: `Object with id ${params.id} updated successfully`,
		}
	}

	async destroy({ params }: HttpContext) {
		return {
			message: `Object with id ${params.id} deleted successfully`,
		}
	}
}
