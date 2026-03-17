import os
import traceback

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


def _build_html(patient_name: str, booking: dict) -> str:
    doctor = booking.get("doctor", "Your Doctor")
    specialty = booking.get("specialty", "")
    date = booking.get("date", "")
    time = booking.get("time", "")

    specialty_line = f"<p style='margin:0 0 6px;color:#94a3b8;font-size:14px;'>{specialty}</p>" if specialty else ""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Appointment Confirmed — Kyron Medical</title>
</head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1E;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:rgba(15,23,42,0.95);border-radius:16px;
                      border:1px solid rgba(14,165,233,0.2);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0EA5E9,#06B6D4);
                        padding:32px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;
                         letter-spacing:2px;color:rgba(255,255,255,0.8);
                         text-transform:uppercase;">Kyron Medical</p>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;">
                Appointment Confirmed
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 24px;font-size:16px;color:#e2e8f0;">
                Hi <strong style="color:#ffffff;">{patient_name}</strong>,<br />
                your appointment has been booked. Here are the details:
              </p>

              <!-- Details card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:rgba(14,165,233,0.08);
                            border:1px solid rgba(14,165,233,0.25);
                            border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="36" valign="top" style="padding-top:2px;">
                          <div style="width:28px;height:28px;border-radius:8px;
                                      background:rgba(14,165,233,0.2);
                                      text-align:center;line-height:28px;
                                      font-size:14px;">👨‍⚕️</div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0 0 2px;font-size:11px;font-weight:600;
                                     letter-spacing:1px;color:#64748b;
                                     text-transform:uppercase;">Doctor</p>
                          <p style="margin:0 0 2px;font-size:16px;font-weight:600;
                                     color:#ffffff;">{doctor}</p>
                          {specialty_line}
                        </td>
                      </tr>
                    </table>

                    <hr style="border:none;border-top:1px solid rgba(14,165,233,0.15);
                                margin:16px 0;" />

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%">
                          <p style="margin:0 0 2px;font-size:11px;font-weight:600;
                                     letter-spacing:1px;color:#64748b;
                                     text-transform:uppercase;">Date</p>
                          <p style="margin:0;font-size:16px;font-weight:600;
                                     color:#ffffff;">{date}</p>
                        </td>
                        <td width="50%">
                          <p style="margin:0 0 2px;font-size:11px;font-weight:600;
                                     letter-spacing:1px;color:#64748b;
                                     text-transform:uppercase;">Time</p>
                          <p style="margin:0;font-size:16px;font-weight:600;
                                     color:#0EA5E9;">{time}</p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Location -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:rgba(255,255,255,0.03);
                            border:1px solid rgba(255,255,255,0.08);
                            border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;
                               letter-spacing:1px;color:#64748b;
                               text-transform:uppercase;">Location</p>
                    <p style="margin:0;font-size:14px;color:#e2e8f0;line-height:1.6;">
                      Kyron Medical Centre<br />
                      123 Health Avenue, Suite 400<br />
                      Chicago, IL 60601
                    </p>
                    <p style="margin:10px 0 0;font-size:13px;color:#94a3b8;">
                      Mon–Fri &nbsp;8:00 am – 6:00 pm
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Reminder -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:rgba(6,182,212,0.08);
                            border-left:3px solid #06B6D4;
                            border-radius:0 8px 8px 0;margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;font-size:14px;color:#67e8f9;">
                      ⏰ &nbsp;Please arrive <strong>15 minutes early</strong> to complete any paperwork.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.6;">
                If you need to reschedule or have any questions, please call us at
                <strong style="color:#e2e8f0;">(312) 555-0100</strong> during office hours.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);
                        text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">
                © 2026 Kyron Medical &nbsp;·&nbsp; This is an automated confirmation email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


async def send_booking_confirmation(patient_data: dict, booking_details: dict) -> bool:
    """
    Send an HTML appointment confirmation email via SendGrid.
    Returns True on success, False on any failure.
    """
    api_key = os.environ.get("SENDGRID_API_KEY", "")
    from_email = os.environ.get("SENDGRID_FROM_EMAIL", "")
    to_email = patient_data.get("email", "")

    print("[email] Attempting to send to:", to_email)
    print("[email] From:", from_email)
    print("[email] SendGrid API key present:", bool(api_key))

    if not api_key or not from_email:
        print("[email_service] Missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL — skipping email.")
        return False

    if not to_email:
        print("[email_service] No patient email in session data — skipping email.")
        return False

    first = patient_data.get("first_name", "")
    last = patient_data.get("last_name", "")
    patient_name = f"{first} {last}".strip() or "Patient"

    html_content = _build_html(patient_name, booking_details)

    message = Mail(
        from_email=from_email,
        to_emails=to_email,
        subject="Your Kyron Medical Appointment is Confirmed",
        html_content=html_content,
    )

    try:
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)
        print("[email] SendGrid response status:", response.status_code)
        print("[email] SendGrid response body:", response.body)
        print("[email] Successfully sent to:", to_email)
        print("[email] Status code:", response.status_code)
        return True
    except Exception as e:
        print("[email] ERROR sending email:", str(e))
        traceback.print_exc()
        return False
