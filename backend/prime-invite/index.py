"""Генерация и использование ссылок-приглашений Prime"""
import json, os, secrets
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')

    # POST /generate — создать инвайт
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        owner_nick = body.get('owner_nick', '').strip()
        if not owner_nick:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'owner_nick required'})}

        token = secrets.token_urlsafe(12)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO invites (token, owner_nick) VALUES (%s, %s) RETURNING token",
            (token, owner_nick)
        )
        conn.commit()
        cur.close(); conn.close()

        base_url = body.get('base_url', 'https://stylish-messenger-invite--preview.poehali.dev')
        invite_url = f"{base_url}?invite={token}"
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'token': token, 'url': invite_url})}

    # GET /?token=xxx — проверить инвайт
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        token = params.get('token', '')
        if not token:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'token required'})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT owner_nick, used_by_nick FROM invites WHERE token = %s", (token,))
        row = cur.fetchone()
        cur.close(); conn.close()

        if not row:
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'invalid token'})}

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
            'valid': row[1] is None,
            'owner_nick': row[0],
            'used': row[1] is not None
        })}

    return {'statusCode': 405, 'headers': CORS, 'body': ''}
