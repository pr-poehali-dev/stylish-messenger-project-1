"""Получение списка контактов пользователя"""
import json, os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    nick = params.get('nick', '').strip()
    if not nick:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'nick required'})}

    nick = nick if nick.startswith('@') else '@' + nick

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT u.name, u.nick, u.phone
        FROM contacts c
        JOIN users u ON u.nick = c.contact_nick
        WHERE c.owner_nick = %s
        ORDER BY u.name
    """, (nick,))
    rows = cur.fetchall()
    cur.close(); conn.close()

    contacts = [{'name': r[0], 'nick': r[1], 'phone': r[2]} for r in rows]
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'contacts': contacts})}
