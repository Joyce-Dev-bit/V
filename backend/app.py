import hashlib
import re
import sqlite3
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator, model_validator

DB_PATH = Path(__file__).resolve().parent / 'app.db'

app = FastAPI(title='E-Hetsena API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


def get_db_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute('PRAGMA foreign_keys = ON')
    return connection


def initialize_database():
    with get_db_connection() as connection:
        connection.execute(
            '''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                last_name TEXT NOT NULL,
                first_name TEXT NOT NULL,
                phone_number TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            '''
        )

        connection.execute(
            'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number)'
        )

        connection.execute(
            '''
            CREATE TABLE IF NOT EXISTS videos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                author_phone_number TEXT NOT NULL,
                description TEXT NOT NULL,
                video_url TEXT NOT NULL,
                poster_url TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(author_phone_number) REFERENCES users(phone_number)
            )
            '''
        )

        connection.execute(
            '''
            CREATE TABLE IF NOT EXISTS video_likes (
                video_id INTEGER NOT NULL,
                user_phone_number TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY(video_id, user_phone_number),
                FOREIGN KEY(video_id) REFERENCES videos(id) ON DELETE CASCADE,
                FOREIGN KEY(user_phone_number) REFERENCES users(phone_number)
            )
            '''
        )

        connection.execute(
            '''
            CREATE TABLE IF NOT EXISTS video_comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                video_id INTEGER NOT NULL,
                user_phone_number TEXT NOT NULL,
                parent_comment_id INTEGER,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(video_id) REFERENCES videos(id) ON DELETE CASCADE,
                FOREIGN KEY(user_phone_number) REFERENCES users(phone_number),
                FOREIGN KEY(parent_comment_id) REFERENCES video_comments(id) ON DELETE CASCADE
            )
            '''
        )

        connection.execute(
            '''
            CREATE TABLE IF NOT EXISTS comment_likes (
                comment_id INTEGER NOT NULL,
                user_phone_number TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY(comment_id, user_phone_number),
                FOREIGN KEY(comment_id) REFERENCES video_comments(id) ON DELETE CASCADE,
                FOREIGN KEY(user_phone_number) REFERENCES users(phone_number)
            )
            '''
        )

        connection.execute(
            '''
            CREATE TABLE IF NOT EXISTS follows (
                follower_phone_number TEXT NOT NULL,
                following_phone_number TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY(follower_phone_number, following_phone_number),
                FOREIGN KEY(follower_phone_number) REFERENCES users(phone_number),
                FOREIGN KEY(following_phone_number) REFERENCES users(phone_number)
            )
            '''
        )

        connection.execute(
            'CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC, id DESC)'
        )
        connection.execute(
            'CREATE INDEX IF NOT EXISTS idx_videos_author_phone ON videos(author_phone_number)'
        )
        connection.execute(
            'CREATE INDEX IF NOT EXISTS idx_video_comments_video ON video_comments(video_id, created_at ASC)'
        )
        connection.execute(
            'CREATE INDEX IF NOT EXISTS idx_video_comments_parent ON video_comments(parent_comment_id)'
        )
        connection.execute(
            'CREATE INDEX IF NOT EXISTS idx_video_likes_video ON video_likes(video_id)'
        )
        connection.execute(
            'CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id)'
        )
        connection.execute(
            'CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_phone_number)'
        )

        seed_demo_data(connection)
        connection.commit()


def seed_demo_data(connection: sqlite3.Connection):
    demo_users = [
        ('R.', 'Mialy', '+261341234567'),
        ('R.', 'Tiana', '+261340011223'),
        ('K.', 'Anja', '+261330123456'),
        ('N.', 'Soa', '+261320098765'),
        ('T.', 'Hery', '+261340567890'),
    ]

    for last_name, first_name, phone_number in demo_users:
        connection.execute(
            '''
            INSERT OR IGNORE INTO users (last_name, first_name, phone_number, password_hash)
            VALUES (?, ?, ?, ?)
            ''',
            (last_name, first_name, phone_number, hash_password('demo12345')),
        )

    videos_count = connection.execute('SELECT COUNT(*) AS count FROM videos').fetchone()['count']
    if videos_count > 0:
        return

    demo_videos = [
        (
            '+261340011223',
            'Un aperçu du tressage en direct dans notre atelier. Chaque pièce est finie à la main.',
            'https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080_25fps.mp4',
            'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1100&q=85',
        ),
        (
            '+261330123456',
            'Nouveau vase en terre cuite, cuisson lente et teinte naturelle.',
            'https://videos.pexels.com/video-files/5532783/5532783-hd_1080_1920_30fps.mp4',
            'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1100&q=85',
        ),
        (
            '+261320098765',
            'Texture fondante au baobab, sans parfum ajouté, préparée en petite série.',
            'https://videos.pexels.com/video-files/6110058/6110058-hd_1080_1920_25fps.mp4',
            'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1100&q=85',
        ),
        (
            '+261340567890',
            'Test audio et confort: aperçu rapide de notre casque studio.',
            'https://videos.pexels.com/video-files/4488638/4488638-hd_1080_1920_25fps.mp4',
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1100&q=85',
        ),
    ]

    for author_phone, description, video_url, poster_url in demo_videos:
        connection.execute(
            '''
            INSERT INTO videos (author_phone_number, description, video_url, poster_url)
            VALUES (?, ?, ?, ?)
            ''',
            (author_phone, description, video_url, poster_url),
        )

    connection.execute(
        '''
        INSERT OR IGNORE INTO follows (follower_phone_number, following_phone_number)
        VALUES (?, ?)
        ''',
        ('+261341234567', '+261340011223'),
    )


def normalize_phone_number(phone_number: str) -> str:
    digits = re.sub(r'\D', '', phone_number or '')

    if digits.startswith('261'):
        normalized = digits
    elif digits.startswith('0') and len(digits) == 10:
        normalized = f'261{digits[1:]}'
    else:
        normalized = digits

    if len(normalized) < 9:
        raise ValueError('Le numéro de téléphone est invalide.')

    return f'+{normalized}'


def normalize_phone_number_or_http(phone_number: str, status_code: int = 400) -> str:
    try:
        return normalize_phone_number(phone_number)
    except ValueError as error:
        raise HTTPException(status_code=status_code, detail=str(error)) from error


def hash_password(password: str) -> str:
    salt = b'e-hetsena-salt'
    return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100_000).hex()


initialize_database()


class RegisterRequest(BaseModel):
    last_name: str = Field(..., min_length=1)
    first_name: str = Field(..., min_length=1)
    phone_number: str = Field(..., min_length=8)
    password: str = Field(..., min_length=8)
    password_confirmation: str = Field(..., min_length=8)

    @field_validator('last_name', 'first_name')
    @classmethod
    def validate_names(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError('Ce champ est obligatoire.')
        return cleaned

    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        return normalize_phone_number(value)

    @model_validator(mode='after')
    def validate_passwords(self):
        if self.password != self.password_confirmation:
            raise ValueError('Les mots de passe ne correspondent pas.')
        return self


class VideoCommentRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)
    parent_comment_id: Optional[int] = Field(default=None, ge=1)

    @field_validator('content')
    @classmethod
    def validate_content(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError('Le commentaire est obligatoire.')
        return cleaned


def get_authenticated_user(
    connection: sqlite3.Connection,
    x_phone_number: Optional[str],
) -> sqlite3.Row:
    if not x_phone_number:
        raise HTTPException(
            status_code=401,
            detail='Authentification requise (en-tête X-Phone-Number manquant).',
        )

    try:
        normalized_phone = normalize_phone_number(x_phone_number)
    except ValueError as error:
        raise HTTPException(status_code=401, detail=str(error)) from error

    user = connection.execute(
        '''
        SELECT id, last_name, first_name, phone_number
        FROM users
        WHERE phone_number = ?
        ''',
        (normalized_phone,),
    ).fetchone()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail=f'Compte introuvable pour {normalized_phone}.',
        )

    return user


def fetch_video_payload(
    connection: sqlite3.Connection,
    current_phone_number: Optional[str],
    limit: int,
    cursor: Optional[int],
    author_phone_number: Optional[str] = None,
):
    conditions = []
    params = []

    if cursor is not None:
        conditions.append('v.id < ?')
        params.append(cursor)

    if author_phone_number is not None:
        conditions.append('v.author_phone_number = ?')
        params.append(author_phone_number)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ''

    rows = connection.execute(
        f'''
        SELECT
            v.id,
            v.description,
            v.video_url,
            v.poster_url,
            v.author_phone_number,
            v.created_at,
            u.first_name,
            u.last_name,
            (
                SELECT COUNT(*) FROM video_likes vl WHERE vl.video_id = v.id
            ) AS likes_count,
            (
                SELECT COUNT(*) FROM video_comments vc WHERE vc.video_id = v.id
            ) AS comments_count,
            (
                SELECT COUNT(*)
                FROM video_likes vl2
                WHERE vl2.video_id = v.id AND vl2.user_phone_number = ?
            ) AS liked_by_me
        FROM videos v
        JOIN users u ON u.phone_number = v.author_phone_number
        {where_clause}
        ORDER BY v.id DESC
        LIMIT ?
        ''',
        [current_phone_number or '', *params, limit + 1],
    ).fetchall()

    has_more = len(rows) > limit
    visible_rows = rows[:limit]

    videos = [
        {
            'id': row['id'],
            'description': row['description'],
            'video_url': row['video_url'],
            'poster_url': row['poster_url'],
            'created_at': row['created_at'],
            'likes_count': row['likes_count'],
            'comments_count': row['comments_count'],
            'liked_by_me': bool(row['liked_by_me']),
            'author': {
                'phone_number': row['author_phone_number'],
                'first_name': row['first_name'],
                'last_name': row['last_name'],
                'display_name': f"{row['first_name']} {row['last_name']}",
                'initials': f"{row['first_name'][:1]}{row['last_name'][:1]}".upper(),
            },
        }
        for row in visible_rows
    ]

    next_cursor = visible_rows[-1]['id'] if has_more and visible_rows else None

    return {
        'items': videos,
        'next_cursor': next_cursor,
        'has_more': has_more,
    }


def fetch_comments_tree(
    connection: sqlite3.Connection,
    video_id: int,
    current_phone_number: Optional[str],
):
    rows = connection.execute(
        '''
        SELECT
            c.id,
            c.video_id,
            c.parent_comment_id,
            c.user_phone_number,
            c.content,
            c.created_at,
            u.first_name,
            u.last_name,
            (
                SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id
            ) AS likes_count,
            (
                SELECT COUNT(*) FROM comment_likes cl2
                WHERE cl2.comment_id = c.id AND cl2.user_phone_number = ?
            ) AS liked_by_me
        FROM video_comments c
        JOIN users u ON u.phone_number = c.user_phone_number
        WHERE c.video_id = ?
        ORDER BY c.created_at ASC, c.id ASC
        ''',
        (current_phone_number or '', video_id),
    ).fetchall()

    items = {
        row['id']: {
            'id': row['id'],
            'video_id': row['video_id'],
            'parent_comment_id': row['parent_comment_id'],
            'content': row['content'],
            'created_at': row['created_at'],
            'likes_count': row['likes_count'],
            'liked_by_me': bool(row['liked_by_me']),
            'author': {
                'phone_number': row['user_phone_number'],
                'display_name': f"{row['first_name']} {row['last_name']}",
                'initials': f"{row['first_name'][:1]}{row['last_name'][:1]}".upper(),
            },
            'replies': [],
        }
        for row in rows
    }

    root_comments = []
    for comment in items.values():
        if comment['parent_comment_id'] and comment['parent_comment_id'] in items:
            items[comment['parent_comment_id']]['replies'].append(comment)
        else:
            root_comments.append(comment)

    return root_comments


@app.get('/api/health')
def health_check():
    return {'status': 'ok', 'message': 'Backend Python ready'}


@app.post('/api/register')
def create_account(payload: RegisterRequest):
    normalized_phone = normalize_phone_number(payload.phone_number)

    with get_db_connection() as connection:
        existing_account = connection.execute(
            'SELECT id FROM users WHERE phone_number = ?',
            (normalized_phone,),
        ).fetchone()

        if existing_account is not None:
            raise HTTPException(
                status_code=409,
                detail=f'Un compte existe déjà avec ce numéro: {normalized_phone}',
            )

        password_hash = hash_password(payload.password)

        connection.execute(
            '''
            INSERT INTO users (last_name, first_name, phone_number, password_hash)
            VALUES (?, ?, ?, ?)
            ''',
            (
                payload.last_name.strip(),
                payload.first_name.strip(),
                normalized_phone,
                password_hash,
            ),
        )
        connection.commit()

    return {
        'status': 'ok',
        'message': 'Compte créé avec succès.',
        'phone_number': normalized_phone,
    }


@app.get('/api/videos')
def list_videos(
    limit: int = 6,
    cursor: Optional[int] = None,
    x_phone_number: Optional[str] = Header(default=None, alias='X-Phone-Number'),
):
    bounded_limit = max(1, min(limit, 15))
    normalized_phone = None

    if x_phone_number:
        normalized_phone = normalize_phone_number_or_http(x_phone_number)

    with get_db_connection() as connection:
        return fetch_video_payload(connection, normalized_phone, bounded_limit, cursor)


@app.get('/api/videos/{video_id}')
def get_video(
    video_id: int,
    x_phone_number: Optional[str] = Header(default=None, alias='X-Phone-Number'),
):
    normalized_phone = None
    if x_phone_number:
        normalized_phone = normalize_phone_number_or_http(x_phone_number)

    with get_db_connection() as connection:
        payload = fetch_video_payload(
            connection,
            normalized_phone,
            limit=1,
            cursor=None,
        )

        row = connection.execute(
            'SELECT id FROM videos WHERE id = ?',
            (video_id,),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail='Vidéo introuvable.')

        exact = connection.execute(
            '''
            SELECT
                v.id,
                v.description,
                v.video_url,
                v.poster_url,
                v.author_phone_number,
                v.created_at,
                u.first_name,
                u.last_name,
                (
                    SELECT COUNT(*) FROM video_likes vl WHERE vl.video_id = v.id
                ) AS likes_count,
                (
                    SELECT COUNT(*) FROM video_comments vc WHERE vc.video_id = v.id
                ) AS comments_count,
                (
                    SELECT COUNT(*)
                    FROM video_likes vl2
                    WHERE vl2.video_id = v.id AND vl2.user_phone_number = ?
                ) AS liked_by_me
            FROM videos v
            JOIN users u ON u.phone_number = v.author_phone_number
            WHERE v.id = ?
            ''',
            (normalized_phone or '', video_id),
        ).fetchone()

        return {
            'id': exact['id'],
            'description': exact['description'],
            'video_url': exact['video_url'],
            'poster_url': exact['poster_url'],
            'created_at': exact['created_at'],
            'likes_count': exact['likes_count'],
            'comments_count': exact['comments_count'],
            'liked_by_me': bool(exact['liked_by_me']),
            'author': {
                'phone_number': exact['author_phone_number'],
                'first_name': exact['first_name'],
                'last_name': exact['last_name'],
                'display_name': f"{exact['first_name']} {exact['last_name']}",
                'initials': f"{exact['first_name'][:1]}{exact['last_name'][:1]}".upper(),
            },
            'feed_preview': payload,
        }


@app.post('/api/videos/{video_id}/like')
def like_video(
    video_id: int,
    x_phone_number: Optional[str] = Header(default=None, alias='X-Phone-Number'),
):
    with get_db_connection() as connection:
        user = get_authenticated_user(connection, x_phone_number)
        video = connection.execute('SELECT id FROM videos WHERE id = ?', (video_id,)).fetchone()
        if video is None:
            raise HTTPException(status_code=404, detail='Vidéo introuvable.')

        connection.execute(
            '''
            INSERT OR IGNORE INTO video_likes (video_id, user_phone_number)
            VALUES (?, ?)
            ''',
            (video_id, user['phone_number']),
        )
        connection.commit()

        likes_count = connection.execute(
            'SELECT COUNT(*) AS count FROM video_likes WHERE video_id = ?',
            (video_id,),
        ).fetchone()['count']
        return {'status': 'ok', 'likes_count': likes_count, 'liked': True}


@app.delete('/api/videos/{video_id}/like')
def unlike_video(
    video_id: int,
    x_phone_number: Optional[str] = Header(default=None, alias='X-Phone-Number'),
):
    with get_db_connection() as connection:
        user = get_authenticated_user(connection, x_phone_number)
        connection.execute(
            '''
            DELETE FROM video_likes
            WHERE video_id = ? AND user_phone_number = ?
            ''',
            (video_id, user['phone_number']),
        )
        connection.commit()

        likes_count = connection.execute(
            'SELECT COUNT(*) AS count FROM video_likes WHERE video_id = ?',
            (video_id,),
        ).fetchone()['count']
        return {'status': 'ok', 'likes_count': likes_count, 'liked': False}


@app.get('/api/videos/{video_id}/comments')
def list_video_comments(
    video_id: int,
    x_phone_number: Optional[str] = Header(default=None, alias='X-Phone-Number'),
):
    normalized_phone = None
    if x_phone_number:
        normalized_phone = normalize_phone_number_or_http(x_phone_number)

    with get_db_connection() as connection:
        video = connection.execute('SELECT id FROM videos WHERE id = ?', (video_id,)).fetchone()
        if video is None:
            raise HTTPException(status_code=404, detail='Vidéo introuvable.')

        items = fetch_comments_tree(connection, video_id, normalized_phone)
        return {'items': items, 'count': len(items)}


@app.post('/api/videos/{video_id}/comments')
def add_video_comment(
    video_id: int,
    payload: VideoCommentRequest,
    x_phone_number: Optional[str] = Header(default=None, alias='X-Phone-Number'),
):
    with get_db_connection() as connection:
        user = get_authenticated_user(connection, x_phone_number)
        video = connection.execute('SELECT id FROM videos WHERE id = ?', (video_id,)).fetchone()
        if video is None:
            raise HTTPException(status_code=404, detail='Vidéo introuvable.')

        if payload.parent_comment_id is not None:
            parent = connection.execute(
                'SELECT id, video_id FROM video_comments WHERE id = ?',
                (payload.parent_comment_id,),
            ).fetchone()
            if parent is None or parent['video_id'] != video_id:
                raise HTTPException(status_code=400, detail='Commentaire parent invalide.')

        connection.execute(
            '''
            INSERT INTO video_comments (video_id, user_phone_number, parent_comment_id, content)
            VALUES (?, ?, ?, ?)
            ''',
            (
                video_id,
                user['phone_number'],
                payload.parent_comment_id,
                payload.content.strip(),
            ),
        )
        connection.commit()

        comments_count = connection.execute(
            'SELECT COUNT(*) AS count FROM video_comments WHERE video_id = ?',
            (video_id,),
        ).fetchone()['count']

        items = fetch_comments_tree(connection, video_id, user['phone_number'])
        return {'status': 'ok', 'items': items, 'comments_count': comments_count}


@app.delete('/api/comments/{comment_id}')
def delete_comment(
    comment_id: int,
    x_phone_number: Optional[str] = Header(default=None, alias='X-Phone-Number'),
):
    with get_db_connection() as connection:
        user = get_authenticated_user(connection, x_phone_number)
        comment = connection.execute(
            'SELECT id, user_phone_number, video_id FROM video_comments WHERE id = ?',
            (comment_id,),
        ).fetchone()
        if comment is None:
            raise HTTPException(status_code=404, detail='Commentaire introuvable.')
        if comment['user_phone_number'] != user['phone_number']:
            raise HTTPException(status_code=403, detail='Suppression non autorisée.')

        connection.execute('DELETE FROM video_comments WHERE id = ?', (comment_id,))
        connection.commit()

        comments_count = connection.execute(
            'SELECT COUNT(*) AS count FROM video_comments WHERE video_id = ?',
            (comment['video_id'],),
        ).fetchone()['count']

        items = fetch_comments_tree(connection, comment['video_id'], user['phone_number'])
        return {
            'status': 'ok',
            'items': items,
            'comments_count': comments_count,
            'video_id': comment['video_id'],
        }


@app.post('/api/comments/{comment_id}/like')
def like_comment(
    comment_id: int,
    x_phone_number: Optional[str] = Header(default=None, alias='X-Phone-Number'),
):
    with get_db_connection() as connection:
        user = get_authenticated_user(connection, x_phone_number)
        comment = connection.execute(
            'SELECT id, video_id FROM video_comments WHERE id = ?',
            (comment_id,),
        ).fetchone()
        if comment is None:
            raise HTTPException(status_code=404, detail='Commentaire introuvable.')

        connection.execute(
            '''
            INSERT OR IGNORE INTO comment_likes (comment_id, user_phone_number)
            VALUES (?, ?)
            ''',
            (comment_id, user['phone_number']),
        )
        connection.commit()

        return {
            'status': 'ok',
            'liked': True,
            'items': fetch_comments_tree(connection, comment['video_id'], user['phone_number']),
        }


@app.delete('/api/comments/{comment_id}/like')
def unlike_comment(
    comment_id: int,
    x_phone_number: Optional[str] = Header(default=None, alias='X-Phone-Number'),
):
    with get_db_connection() as connection:
        user = get_authenticated_user(connection, x_phone_number)
        comment = connection.execute(
            'SELECT id, video_id FROM video_comments WHERE id = ?',
            (comment_id,),
        ).fetchone()
        if comment is None:
            raise HTTPException(status_code=404, detail='Commentaire introuvable.')

        connection.execute(
            '''
            DELETE FROM comment_likes
            WHERE comment_id = ? AND user_phone_number = ?
            ''',
            (comment_id, user['phone_number']),
        )
        connection.commit()

        return {
            'status': 'ok',
            'liked': False,
            'items': fetch_comments_tree(connection, comment['video_id'], user['phone_number']),
        }


@app.get('/api/profiles/{phone_number}')
def get_profile(
    phone_number: str,
    x_phone_number: Optional[str] = Header(default=None, alias='X-Phone-Number'),
):
    normalized_target_phone = normalize_phone_number_or_http(phone_number)
    normalized_current_phone = None
    if x_phone_number:
        normalized_current_phone = normalize_phone_number_or_http(x_phone_number)

    with get_db_connection() as connection:
        user = connection.execute(
            '''
            SELECT first_name, last_name, phone_number
            FROM users
            WHERE phone_number = ?
            ''',
            (normalized_target_phone,),
        ).fetchone()
        if user is None:
            raise HTTPException(status_code=404, detail='Profil introuvable.')

        videos_count = connection.execute(
            'SELECT COUNT(*) AS count FROM videos WHERE author_phone_number = ?',
            (normalized_target_phone,),
        ).fetchone()['count']
        followers_count = connection.execute(
            'SELECT COUNT(*) AS count FROM follows WHERE following_phone_number = ?',
            (normalized_target_phone,),
        ).fetchone()['count']
        following_count = connection.execute(
            'SELECT COUNT(*) AS count FROM follows WHERE follower_phone_number = ?',
            (normalized_target_phone,),
        ).fetchone()['count']

        is_following = False
        if normalized_current_phone and normalized_current_phone != normalized_target_phone:
            is_following = bool(
                connection.execute(
                    '''
                    SELECT 1
                    FROM follows
                    WHERE follower_phone_number = ? AND following_phone_number = ?
                    ''',
                    (normalized_current_phone, normalized_target_phone),
                ).fetchone()
            )

        videos = fetch_video_payload(
            connection,
            normalized_current_phone,
            limit=18,
            cursor=None,
            author_phone_number=normalized_target_phone,
        )['items']

        return {
            'phone_number': user['phone_number'],
            'first_name': user['first_name'],
            'last_name': user['last_name'],
            'display_name': f"{user['first_name']} {user['last_name']}",
            'initials': f"{user['first_name'][:1]}{user['last_name'][:1]}".upper(),
            'bio': 'Membre de V · publications vidéo en direct du terrain.',
            'stats': {
                'videos': videos_count,
                'followers': followers_count,
                'following': following_count,
            },
            'is_following': is_following,
            'videos': videos,
        }


@app.post('/api/profiles/{phone_number}/follow')
def follow_profile(
    phone_number: str,
    x_phone_number: Optional[str] = Header(default=None, alias='X-Phone-Number'),
):
    target_phone = normalize_phone_number_or_http(phone_number)

    with get_db_connection() as connection:
        user = get_authenticated_user(connection, x_phone_number)
        if user['phone_number'] == target_phone:
            raise HTTPException(status_code=400, detail='Vous ne pouvez pas vous suivre vous-même.')

        target_exists = connection.execute(
            'SELECT 1 FROM users WHERE phone_number = ?',
            (target_phone,),
        ).fetchone()
        if target_exists is None:
            raise HTTPException(status_code=404, detail='Profil introuvable.')

        connection.execute(
            '''
            INSERT OR IGNORE INTO follows (follower_phone_number, following_phone_number)
            VALUES (?, ?)
            ''',
            (user['phone_number'], target_phone),
        )
        connection.commit()

        followers_count = connection.execute(
            'SELECT COUNT(*) AS count FROM follows WHERE following_phone_number = ?',
            (target_phone,),
        ).fetchone()['count']

        return {'status': 'ok', 'is_following': True, 'followers_count': followers_count}


@app.delete('/api/profiles/{phone_number}/follow')
def unfollow_profile(
    phone_number: str,
    x_phone_number: Optional[str] = Header(default=None, alias='X-Phone-Number'),
):
    target_phone = normalize_phone_number_or_http(phone_number)

    with get_db_connection() as connection:
        user = get_authenticated_user(connection, x_phone_number)
        connection.execute(
            '''
            DELETE FROM follows
            WHERE follower_phone_number = ? AND following_phone_number = ?
            ''',
            (user['phone_number'], target_phone),
        )
        connection.commit()

        followers_count = connection.execute(
            'SELECT COUNT(*) AS count FROM follows WHERE following_phone_number = ?',
            (target_phone,),
        ).fetchone()['count']

        return {'status': 'ok', 'is_following': False, 'followers_count': followers_count}
