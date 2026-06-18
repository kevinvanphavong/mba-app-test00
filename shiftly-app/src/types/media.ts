/**
 * Types du module Media — médias polymorphes attachés à une entité parente
 * (mission, tutoriel, document plus tard).
 */

export type MediaEntityType = 'mission' | 'tutoriel' | 'document' | 'employe_document'

export interface Media {
  id:         number
  entityType: MediaEntityType
  entityId:   number
  filename:   string
  mimeType:   string
  sizeBytes:  number
  createdAt:  string
}

export interface MediaUrlResponse {
  url:       string
  expiresAt: string
}

export interface MediaUploadResponse extends Media {}
