import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Shot {
  id: number;
  title: string;
  caption: string;
  videoUrl: string;
  uploadedBy: number;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
}

export interface ShotComment {
  id: number;
  shotId: number;
  userName: string;
  parentId: number | null;
  text: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ShotsService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/shots`;

  list(): Observable<Shot[]> {
    return this.http.get<Shot[]>(this.base);
  }

  toggleLike(id: number): Observable<{ liked: boolean; likeCount: number }> {
    return this.http.post<{ liked: boolean; likeCount: number }>(`${this.base}/${id}/like`, {});
  }

  comments(id: number): Observable<ShotComment[]> {
    return this.http.get<ShotComment[]>(`${this.base}/${id}/comments`);
  }

  addComment(id: number, text: string, parentId?: number): Observable<ShotComment> {
    const body: { text: string; parentId?: number } = { text };
    if (parentId != null) body.parentId = parentId;
    return this.http.post<ShotComment>(`${this.base}/${id}/comments`, body);
  }

  upload(file: File, title: string, caption: string): Observable<Shot> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title);
    fd.append('caption', caption);
    return this.http.post<Shot>(`${this.base}/upload`, fd);
  }
}
