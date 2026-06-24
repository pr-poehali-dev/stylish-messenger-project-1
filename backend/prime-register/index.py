"""Регистрация пользователя по инвайту и добавление в контакты"""
import json, os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    name = body.get('name', '').strip()
    nick = body.get('nick', '').strip()
    phone = body.get('phone', '').strip()
    token = body.get('invite_token', '').strip()

    if not all([name, nick, phone]):
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'name, nick, phone required'})}

    nick = nick if nick.startswith('@') else '@' + nick

    conn = get_conn()
    cur = conn.cursor()

    # Сохраняем пользователя (или обновляем если уже есть)
    cur.execute("""
        INSERT INTO users (name, nick, phone) VALUES (%s, %s, %s)
        ON CONFLICT (nick) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone
    """, (name, nick, phone))

    owner_nick = None

    # Если есть токен инвайта — активируем его и добавляем в контакты друг к другу
    if token:
        cur.execute("SELECT owner_nick, used_by_nick FROM invites WHERE token = %s", (token,))
        row = cur.fetchone()
        if row and row[1] is None:
            owner_nick = row[0]
            cur.execute("UPDATE invites SET used_by_nick = %s WHERE token = %s", (nick, token))
            # Добавляем в контакты обоим
            cur.execute("""
                INSERT INTO contacts (owner_nick, contact_nick) VALUES (%s, %s)
                ON CONFLICT DO NOTHING
            """, (owner_nick, nick))
            cur.execute("""
                INSERT INTO contacts (owner_nick, contact_nick) VALUES (%s, %s)
                ON CONFLICT DO NOTHING
            """, (nick, owner_nick))

    conn.commit()
    cur.close(); conn.close()

    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
        'ok': True,
        'nick': nick,
        'added_to_contacts_of': owner_nick
    })}
