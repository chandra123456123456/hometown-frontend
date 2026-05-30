import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  signal,
  ElementRef,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ShotsService, Shot, ShotComment } from '../../core/shots.service';
import { AuthService } from '../../core/auth.service';

interface CommentThread {
  comment: ShotComment;
  replies: ShotComment[];
}

interface ShotState {
  shot: Shot;
  threads: CommentThread[];
  commentsOpen: boolean;
  commentsLoaded: boolean;
  newCommentText: string;
  replyingToId: number | null;
  replyText: string;
}

@Component({
  selector: 'app-shots',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    DatePipe,
  ],
  templateUrl: './shots.component.html',
  styleUrl: './shots.component.scss',
})
export class ShotsComponent implements OnInit, AfterViewInit, OnDestroy {
  private shotsSvc = inject(ShotsService);
  auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  @ViewChildren('videoEl') videoEls!: QueryList<ElementRef<HTMLVideoElement>>;

  states = signal<ShotState[]>([]);
  loading = signal(true);

  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    this.shotsSvc.list().subscribe({
      next: shots => {
        this.states.set(shots.map(s => ({
          shot: s,
          threads: [],
          commentsOpen: false,
          commentsLoaded: false,
          newCommentText: '',
          replyingToId: null,
          replyText: '',
        })));
        this.loading.set(false);
        setTimeout(() => this.setupObserver(), 100);
      },
      error: () => this.loading.set(false),
    });
  }

  ngAfterViewInit(): void {
    this.videoEls.changes.subscribe(() => this.setupObserver());
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private setupObserver(): void {
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0.6 }
    );
    this.videoEls.forEach(ref => {
      if (ref.nativeElement) this.observer!.observe(ref.nativeElement);
    });
  }

  onTimeUpdate(video: HTMLVideoElement): void {
    if (video.currentTime > 60) video.currentTime = 0;
  }

  togglePlayPause(video: HTMLVideoElement): void {
    video.paused ? video.play().catch(() => {}) : video.pause();
  }

  toggleLike(stateIdx: number): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    const st = this.states()[stateIdx];
    this.shotsSvc.toggleLike(st.shot.id).subscribe(res => {
      const updated = [...this.states()];
      updated[stateIdx] = {
        ...st,
        shot: { ...st.shot, likedByMe: res.liked, likeCount: res.likeCount },
      };
      this.states.set(updated);
    });
  }

  openComments(stateIdx: number): void {
    const updated = [...this.states()];
    updated[stateIdx] = { ...updated[stateIdx], commentsOpen: true };
    this.states.set(updated);
    if (!updated[stateIdx].commentsLoaded) {
      this.loadComments(stateIdx);
    }
  }

  closeComments(stateIdx: number): void {
    const updated = [...this.states()];
    updated[stateIdx] = { ...updated[stateIdx], commentsOpen: false };
    this.states.set(updated);
  }

  loadComments(stateIdx: number): void {
    const st = this.states()[stateIdx];
    this.shotsSvc.comments(st.shot.id).subscribe(all => {
      const topLevel = all.filter(c => c.parentId == null);
      const threads: CommentThread[] = topLevel.map(c => ({
        comment: c,
        replies: all.filter(r => r.parentId === c.id),
      }));
      const updated = [...this.states()];
      updated[stateIdx] = { ...updated[stateIdx], threads, commentsLoaded: true };
      this.states.set(updated);
    });
  }

  postComment(stateIdx: number): void {
    if (!this.auth.isLoggedIn()) return;
    const st = this.states()[stateIdx];
    const text = st.newCommentText.trim();
    if (!text) return;
    this.shotsSvc.addComment(st.shot.id, text).subscribe(() => {
      const updated = [...this.states()];
      updated[stateIdx] = {
        ...updated[stateIdx],
        newCommentText: '',
        shot: { ...updated[stateIdx].shot, commentCount: updated[stateIdx].shot.commentCount + 1 },
        commentsLoaded: false,
      };
      this.states.set(updated);
      this.loadComments(stateIdx);
    });
  }

  startReply(stateIdx: number, commentId: number): void {
    if (!this.auth.isLoggedIn()) return;
    const updated = [...this.states()];
    updated[stateIdx] = { ...updated[stateIdx], replyingToId: commentId, replyText: '' };
    this.states.set(updated);
  }

  cancelReply(stateIdx: number): void {
    const updated = [...this.states()];
    updated[stateIdx] = { ...updated[stateIdx], replyingToId: null, replyText: '' };
    this.states.set(updated);
  }

  postReply(stateIdx: number): void {
    const st = this.states()[stateIdx];
    const text = st.replyText.trim();
    if (!text || st.replyingToId == null) return;
    this.shotsSvc.addComment(st.shot.id, text, st.replyingToId).subscribe(() => {
      const updated = [...this.states()];
      updated[stateIdx] = {
        ...updated[stateIdx],
        replyingToId: null,
        replyText: '',
        shot: { ...updated[stateIdx].shot, commentCount: updated[stateIdx].shot.commentCount + 1 },
        commentsLoaded: false,
      };
      this.states.set(updated);
      this.loadComments(stateIdx);
    });
  }

  relativeDate(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    return new Date(iso).toLocaleDateString();
  }
}
