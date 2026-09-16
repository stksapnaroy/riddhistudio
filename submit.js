document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const statusBox = document.getElementById('formStatus');

  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusBox.className = 'form-status';
    statusBox.textContent = 'Sending...';

    const formData = new FormData(form);

    try {
      const response = await fetch('/api/send-mail', {
        method: 'POST',
        body: formData
      });

      const text = await response.text();
      let result = {};

      if (text) {
        try {
          result = JSON.parse(text);
        } catch {
          result = { success: false, message: 'Server error. Please try again later.' };
        }
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || text || 'Failed to send enquiry.');
      }

      statusBox.classList.add('success');
      statusBox.textContent = result.message;
      form.reset();
    } catch (error) {
      statusBox.classList.add('error');
      statusBox.textContent = error.message || 'Something went wrong.';
    }
  });
});
