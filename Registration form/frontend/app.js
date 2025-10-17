const form = document.getElementById('registerForm');
const messageEl = document.getElementById('message');

function showMessage(text, type = 'info') {
  messageEl.textContent = text;
  messageEl.className = type;
}

function validateClient(fields) {
  const errors = [];

  if (!fields.fullName || fields.fullName.trim().length < 2) errors.push('Full Name must be at least 2 characters.');
  if (!fields.companyName) errors.push('Company Name is required.');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(fields.email || '')) errors.push('Valid email is required.');

  const pass = fields.password || '';
  if (pass.length < 8 || !(/[a-z]/.test(pass) && /[A-Z]/.test(pass) && /\d/.test(pass) && /[^A-Za-z0-9]/.test(pass))) {
    errors.push('Password must be 8+ chars with a-z, A-Z, 0-9, and special char.');
  }
  if (fields.password !== fields.confirmPassword) errors.push('Passwords do not match.');

  if (!['Admin', 'Store Manager'].includes(fields.role)) errors.push('Select a valid role.');

  const phoneRegex = /^[+]?[-()\s0-9]{7,20}$/;
  if (!phoneRegex.test(fields.contactNumber || '')) errors.push('Provide a valid contact number.');

  if (!fields.warehouseLocation) errors.push('Warehouse Location is required.');

  return errors;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  showMessage('');

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  const errors = validateClient(payload);
  if (errors.length) {
    showMessage(errors[0], 'error');
    return;
  }

  try {
    const res = await fetch('http://localhost:4000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      const first = data.errors?.[0]?.msg || data.message || 'Submission failed';
      showMessage(first, 'error');
      return;
    }

    showMessage('Registration successful! Check your email/SMS for confirmation.', 'success');
    form.reset();
  } catch (err) {
    showMessage('Network error. Is the backend running on port 4000?', 'error');
  }
});


