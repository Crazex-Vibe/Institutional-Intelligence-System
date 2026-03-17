const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
    },
  });
};

// ── HTML Email Templates ──────────────────────────────────────────────────────

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; color: #1e293b; }
    .wrapper { max-width: 600px; margin: 30px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0f1f3d, #1e40af); padding: 32px; text-align: center; }
    .header h1 { color: white; font-size: 22px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.65); font-size: 14px; }
    .body { padding: 28px 32px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-red { background: #fef2f2; color: #dc2626; }
    .badge-yellow { background: #fef9c3; color: #a16207; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #f1f5f9; }
    td { padding: 11px 12px; border-bottom: 1px solid #f8fafc; font-size: 13px; color: #475569; }
    .stat-row { display: flex; gap: 16px; margin: 20px 0; }
    .stat-box { flex: 1; text-align: center; padding: 16px; border-radius: 12px; background: #f8fafc; }
    .stat-val { font-size: 28px; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
    .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #ef4444; border-radius: 10px; padding: 16px; margin: 16px 0; }
    .alert-box h3 { color: #dc2626; font-size: 15px; margin-bottom: 6px; }
    .alert-box p { color: #ef4444; font-size: 13px; }
    .section-title { font-size: 16px; font-weight: 700; color: #1e293b; margin: 20px 0 10px; border-left: 4px solid #2563eb; padding-left: 10px; }
    p { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 10px; }
    .greeting { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🏛️ Campusflow</h1>
      <p>Integrated Academic Management System</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      This is an automated email from Campusflow. Please do not reply to this email.<br>
      © ${new Date().getFullYear()} Campusflow — Institutional Intelligence System
    </div>
  </div>
</body>
</html>`;

// CIA Summary email template
const ciaSummaryTemplate = ({ studentName, parentName, subject, assessmentType, marksObtained, maxMarks, percentage, classAverage, department, semester, staffName, date }) => {
  const perf = percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : percentage >= 40 ? 'Average' : 'Needs Improvement';
  const badgeClass = percentage >= 60 ? 'badge-green' : percentage >= 40 ? 'badge-yellow' : 'badge-red';

  return baseTemplate(`
    <p class="greeting">Dear ${parentName || studentName},</p>
    <p>The ${assessmentType} results for <strong>${subject}</strong> have been published. Here is the performance summary:</p>

    <div style="display:flex;gap:16px;margin:20px 0;flex-wrap:wrap;">
      <div style="flex:1;min-width:120px;text-align:center;padding:20px;border-radius:12px;background:#f8fafc;border:2px solid #e2e8f0;">
        <div style="font-size:36px;font-weight:800;color:#1e293b;">${marksObtained}</div>
        <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;margin-top:4px;">Marks Obtained</div>
        <div style="font-size:13px;color:#64748b;margin-top:2px;">out of ${maxMarks}</div>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;padding:20px;border-radius:12px;background:#f8fafc;border:2px solid #e2e8f0;">
        <div style="font-size:36px;font-weight:800;color:#2563eb;">${percentage}%</div>
        <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;margin-top:4px;">Score</div>
        <div style="margin-top:6px;"><span class="badge ${badgeClass}">${perf}</span></div>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;padding:20px;border-radius:12px;background:#f8fafc;border:2px solid #e2e8f0;">
        <div style="font-size:36px;font-weight:800;color:#7c3aed;">${classAverage}</div>
        <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;margin-top:4px;">Class Average</div>
        <div style="font-size:12px;color:#64748b;margin-top:2px;">${marksObtained > classAverage ? '↑ Above avg' : '↓ Below avg'}</div>
      </div>
    </div>

    <table>
      <tr><th>Detail</th><th>Info</th></tr>
      <tr><td>Student</td><td><strong>${studentName}</strong></td></tr>
      <tr><td>Assessment</td><td>${assessmentType} — ${subject}</td></tr>
      <tr><td>Department</td><td>${department} | Semester ${semester}</td></tr>
      <tr><td>Staff</td><td>${staffName}</td></tr>
      ${date ? `<tr><td>Date</td><td>${new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>` : ''}
    </table>

    ${percentage < 40 ? `<div class="alert-box"><h3>⚠️ Attention Required</h3><p>The student scored below 40%. Please ensure extra attention is given for upcoming assessments.</p></div>` : ''}
    <p>For queries, please contact the respective staff or visit the college portal.</p>
  `);
};

// Attendance alert email template
const attendanceAlertTemplate = ({ studentName, parentName, overallPercentage, lowSubjects, department, semester }) => {
  return baseTemplate(`
    <p class="greeting">Dear ${parentName || studentName},</p>

    <div class="alert-box">
      <h3>🚨 Low Attendance Warning</h3>
      <p>The student's attendance has dropped below the required 75% threshold. Immediate attention is required.</p>
    </div>

    <div style="text-align:center;padding:20px;background:#fef2f2;border-radius:12px;margin:16px 0;">
      <div style="font-size:48px;font-weight:800;color:#dc2626;">${overallPercentage}%</div>
      <div style="font-size:14px;color:#ef4444;margin-top:4px;">Overall Attendance</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Minimum Required: 75%</div>
    </div>

    <div class="section-title">Subjects with Low Attendance</div>
    <table>
      <tr><th>Subject</th><th>Attendance</th><th>Classes Needed</th></tr>
      ${lowSubjects.map(s => `
        <tr>
          <td>${s.subject}</td>
          <td><span class="badge badge-red">${s.percentage}%</span></td>
          <td style="color:#dc2626;font-weight:600;">Attend ${s.hoursNeeded} more class${s.hoursNeeded !== 1 ? 'es' : ''}</td>
        </tr>
      `).join('')}
    </table>

    <p>Students with attendance below 75% may be <strong>barred from appearing in examinations</strong> as per university regulations.</p>
    <p>Please ensure regular attendance in all classes. For any issues, contact the class advisor or department head.</p>

    <table>
      <tr><th>Detail</th><th>Info</th></tr>
      <tr><td>Student</td><td><strong>${studentName}</strong></td></tr>
      <tr><td>Department</td><td>${department} | Semester ${semester}</td></tr>
    </table>
  `);
};

// Semester performance report template
const semesterReportTemplate = ({ studentName, parentName, semester, academicYear, cgpa, sgpa, subjects, department, totalCredits, earnedCredits }) => {
  return baseTemplate(`
    <p class="greeting">Dear ${parentName || studentName},</p>
    <p>The Semester ${semester} examination results have been published. Here is the detailed performance report:</p>

    <div style="display:flex;gap:16px;margin:20px 0;flex-wrap:wrap;">
      <div style="flex:1;min-width:120px;text-align:center;padding:20px;border-radius:12px;background:#f8fafc;border:2px solid #e2e8f0;">
        <div style="font-size:36px;font-weight:800;color:#2563eb;">${sgpa}</div>
        <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;margin-top:4px;">SGPA</div>
        <div style="font-size:12px;color:#64748b;margin-top:2px;">Semester ${semester}</div>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;padding:20px;border-radius:12px;background:#f8fafc;border:2px solid #e2e8f0;">
        <div style="font-size:36px;font-weight:800;color:#7c3aed;">${cgpa}</div>
        <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;margin-top:4px;">CGPA</div>
        <div style="font-size:12px;color:#64748b;margin-top:2px;">Cumulative</div>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;padding:20px;border-radius:12px;background:#f8fafc;border:2px solid #e2e8f0;">
        <div style="font-size:36px;font-weight:800;color:#15803d;">${earnedCredits}/${totalCredits}</div>
        <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;margin-top:4px;">Credits</div>
        <div style="font-size:12px;color:#64748b;margin-top:2px;">Earned</div>
      </div>
    </div>

    <div class="section-title">Subject-wise Results</div>
    <table>
      <tr><th>Subject</th><th>Credits</th><th>Grade</th><th>Points</th></tr>
      ${subjects.map(s => `
        <tr>
          <td>${s.name}</td>
          <td style="text-align:center;">${s.credits}</td>
          <td><span class="badge ${s.isArrear ? 'badge-red' : s.gradePoint >= 8 ? 'badge-green' : s.gradePoint >= 6 ? 'badge-blue' : 'badge-yellow'}">${s.grade}</span></td>
          <td style="text-align:center;font-weight:700;">${s.gradePoint}</td>
        </tr>
      `).join('')}
    </table>

    ${subjects.some(s => s.isArrear) ? `
      <div class="alert-box">
        <h3>⚠️ Arrear Subjects</h3>
        <p>The student has arrears in ${subjects.filter(s => s.isArrear).length} subject(s). Please register for supplementary examinations.</p>
      </div>` : `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:16px 0;">
        <p style="color:#15803d;font-weight:600;">🎉 All Clear! No arrears in Semester ${semester}.</p>
      </div>`}

    <table>
      <tr><th>Detail</th><th>Info</th></tr>
      <tr><td>Student</td><td><strong>${studentName}</strong></td></tr>
      <tr><td>Department</td><td>${department}</td></tr>
      <tr><td>Academic Year</td><td>${academicYear}</td></tr>
    </table>
  `);
};

// ── Send functions ────────────────────────────────────────────────────────────

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"EduManage" <${process.env.EMAIL_USER}>`,
    to, subject, html,
  });
  return info;
};

const sendCIASummaryEmail = async ({ to, ...data }) => {
  const html = ciaSummaryTemplate(data);
  return sendEmail({ to, subject: `${data.assessmentType} Results — ${data.subject} | EduManage`, html });
};

const sendAttendanceAlertEmail = async ({ to, ...data }) => {
  const html = attendanceAlertTemplate(data);
  return sendEmail({ to, subject: `⚠️ Low Attendance Alert — ${data.studentName} | EduManage`, html });
};

const sendSemesterReportEmail = async ({ to, ...data }) => {
  const html = semesterReportTemplate(data);
  return sendEmail({ to, subject: `Semester ${data.semester} Results — ${data.studentName} | EduManage`, html });
};

module.exports = {
  sendEmail,
  sendCIASummaryEmail,
  sendAttendanceAlertEmail,
  sendSemesterReportEmail,
};
