#!/bin/bash

reset_api_token() 
{
	sed -i -E "s|(token: ).*|\1[token]|" ./**/*.bru
	sed -i -E "s|(Bearer ).*|\1[token]|" ./**/*.bru
}

remove_files() {
	sed -i -E "s|(files\[\]: ).*|\1|" Objects/createObject.bru
	sed -i -E "s|(files\[\]: ).*|\1|" Objects/updateObject.bru
	sed -i -E "s|(file: ).*|\1|" Objects/updateObject.bru
	sed -i -E "s|(files\[\]: ).*|\1|" Objects/bulkUpdateObjects.bru
	sed -i -E "s|(ids\": \[).*|\1\"\[file_name\]\", \"\[file_name2\]\"\]|" Objects/bulkDeleteObjects.bru
}

reset_ids() {
	sed -i -E "s|(id: ).*|\1[file_name]|" Objects/getObject.bru
	sed -i -E "s|(id: ).*|\1[file_name]|" Objects/updateObject.bru
	sed -i -E "s|(id: ).*|\1[file_name]|" Objects/deleteObject.bru
}

reset_api_token
remove_files
reset_ids
