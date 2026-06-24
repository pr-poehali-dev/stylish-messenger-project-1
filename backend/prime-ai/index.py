"""Чатбот ПРАВИМ — AI-ассистент Prime мессенджера, обучается на контексте диалога"""
import json, os
import urllib.request

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

SYSTEM_PROMPT = """Ты — ПРАВИМ, умный деловой AI-ассистент встроенный в мессенджер Prime.
Ты помогаешь пользователям с деловыми задачами: составлять письма, анализировать тексты, отвечать на вопросы.
Ты учишься на каждом диалоге и становишься умнее. Отвечай кратко и по делу. Используй деловой стиль.
Если тебя спросят кто ты — скажи что ты ПРАВИМ, AI-ассистент Prime."""

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    messages = body.get('messages', [])
    if not messages:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'messages required'})}

    api_key = os.environ.get('OPENAI_API_KEY', '')
    if not api_key:
        return {'statusCode': 503, 'headers': CORS, 'body': json.dumps({'error': 'AI не настроен'})}

    payload = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': [{'role': 'system', 'content': SYSTEM_PROMPT}] + messages,
        'max_tokens': 1024,
        'temperature': 0.7,
    }).encode()

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=payload,
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        data = json.loads(resp.read())

    reply = data['choices'][0]['message']['content']
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'reply': reply})}
