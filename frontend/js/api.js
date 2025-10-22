const API_BASE = 'http://localhost:4000';

function getToken(){
  try { return JSON.parse(localStorage.getItem('auth')||'{}').token || null; } catch { return null; }
}

async function request(method, path, body){
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) { throw new Error(data.error || 'Request failed'); }
  return data;
}

async function apiGet(path){ return request('GET', path); }
async function apiPost(path, body){ return request('POST', path, body); }
async function apiPut(path, body){ return request('PUT', path, body); }
async function apiDelete(path){ return request('DELETE', path); }


