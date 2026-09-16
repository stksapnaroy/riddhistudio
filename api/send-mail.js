const sendJson = (res, statusCode, payload) => {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(payload);
  }

  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

export const config = {
  api: {
    bodyParser: false
  }
};

const parseMultipartForm = async (req) => {
  const { formidable } = await import('formidable');
  const form = formidable({ multiples: false });
  const [fields, files] = await form.parse(req);

  const getField = (name) => {
    const value = fields[name];
    return Array.isArray(value) ? value[0] || '' : value || '';
  };

  const uploadedFile = files.upload;
  const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;

  return {
    name: getField('name').toString().trim(),
    email: getField('email').toString().trim(),
    phone: getField('phone').toString().trim(),
    company: getField('company').toString().trim(),
    service: getField('service').toString().trim(),
    quantity: getField('quantity').toString().trim(),
    need: getField('need').toString().trim(),
    file
  };
};

export default async function handler(req, res) {
  const method = req.method || 'GET';

  if (method !== 'POST') {
    return sendJson(res, 405, { success: false, message: 'Method not allowed' });
  }

  const gmailUser = process.env.GMAIL_USER || 'riddhicreativestudio@gmail.com';
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailPassword) {
    return sendJson(res, 500, {
      success: false,
      message: 'Email password is not configured in Vercel environment variables.'
    });
  }

  try {
    const { name, email, phone, company, service, quantity, need, file } = await parseMultipartForm(req);

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
    if (file && file.filepath && file.originalFilename) {
      attachments.push({
        filename: file.originalFilename,
        path: file.filepath
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
