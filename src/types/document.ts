export interface Collaborator {
  userId: string;
  name: string;
}

export interface UserInfo {
  userId: string;
  name: string;
}

export interface Document {
  documentId: string;
  title: string;
  type: string;
  roomId: string;
  roomName?: string | null;
  content?: any | null; // Editor's JSON content
  collaborators?: Collaborator[];
  createdBy: string | UserInfo;
  createdAt: string;
  updatedAt: string;
}

export interface GetDocumentsResponse {
  documents: Document[];
  total: number;
}

export interface CreateDocumentRequest {
  title: string;
  roomId: string;
}

export interface SaveDocumentRequest {
  title?: string;
  content?: any; // JSON representation of the editor content
}
