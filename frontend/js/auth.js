async function signup(nameOrPayload, email, password){
  // Support two call styles:
  //  - signup({ name, email, password, ... })
  //  - signup(name, email, password)
  const payload = (typeof nameOrPayload === 'object')
    ? nameOrPayload
    : { name: nameOrPayload, email, password };

  const res = await fetch('http://localhost:4000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.error || 'Signup failed');
  localStorage.setItem('auth', JSON.stringify(data));
  return data;
}

async function login(email, password){
  const res = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.error || 'Login failed');
  localStorage.setItem('auth', JSON.stringify(data));
  return data;
}

function getCurrentUser(){
  try { return JSON.parse(localStorage.getItem('auth')||'{}').user || null; } catch { return null; }
}

function logout(){ localStorage.removeItem('auth'); }

function guardAuth(){
  const token = (function(){ try { return JSON.parse(localStorage.getItem('auth')||'{}').token; } catch { return null; } })();
  if (!token) location.href = 'index.html';
}


