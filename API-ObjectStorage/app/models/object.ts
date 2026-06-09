import { StorageObjectSchema } from '#database/schema'

export default class Object extends StorageObjectSchema {
	public static table = 'storage_objects'
}
