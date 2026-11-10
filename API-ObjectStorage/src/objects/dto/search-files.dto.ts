import { ArrayMinSize, IsArray, IsString } from 'class-validator'

export class SearchFilesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  files!: string[]
}
