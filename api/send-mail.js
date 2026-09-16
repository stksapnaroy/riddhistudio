const sendJson = (res, statusCode, payload) => {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(payload);
  }

  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const parseFormData = async (req) => {
  if (typeof req.formData === 'function') {
    return await req.formData();
  }

  if (req.body instanceof FormData) {
    return req.body;
  }

  if (typeof req.body === 'string' || req.body instanceof Buffer) {
    return await new Response(req.body).formData();
  }

  return new FormData();
};

export default async function handler(req, res) {
  const method = req.method || 'GET';

  if (method !== 'POST') {
    return sendJson(res, 405, { success: false, message: 'Method not allowed' });
  }

  const gmailUser = process.env.GMAIL_USER || 'riddhicreativestudio@gmail.com';
  const gmailPassword = process.env.GMAIL_APP_PASSWORD || 'Riddhi@0206';

  if (!gmailPassword) {
    return sendJson(res, 500, {
      success: false,
      message: 'Email password is not configured in Vercel environment variables.'
    });
  }

  try {
    const formData = await parseFormData(req);
    const name = (formData.get('name') || '').toString().trim();
    const email = (formData.get('email') || '').toString().trim();
    const phone = (formData.get('phone') || '').toString().trim();
    const company = (formData.get('company') || '').toString().trim();
    const service = (formData.get('service') || '').toString().trim();
    const quantity = (formData.get('quantity') || '').toString().trim();
    const need = (formData.get('need') || '').toString().trim();
    const file = formData.get('upload');

    if (!name || !email || !phone || !need) {
      return sendJson(res, 400, { success: false, message: 'Please fill required fields.' });
    }

    const nodemailer = (await import('nodemailer')).default;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword
      }
    });

    const attachments = [];
    if (file && typeof file.arrayBuffer === 'function' && file.name) {
      const buffer = Buffer.from(await file.arrayBuffer());
      attachments.push({
        filename: file.name,
        content: buffer
      });
    }

    const mailOptions = {
      from: `Riddhi Creative Studio <${gmailUser}>`,
      to: gmailUser,
      replyTo: email,
      subject: 'New Project Enquiry from Website',
      html: `
        <h2>New Project Enquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Company / Business:</strong> ${company || 'N/A'}</p>
        <p><strong>Service:</strong> ${service || 'N/A'}</p>
        <p><strong>Quantity:</strong> ${quantity || 'N/A'}</p>
        <p><strong>Project Details:</strong></p>
        <p>${need.replace(/\n/g, '<br>')}</p>
      `,
      attachments
    };

    await transporter.sendMail(mailOptions);
    return sendJson(res, 200, { success: true, message: 'Your enquiry has been sent successfully.' });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, {
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
}
