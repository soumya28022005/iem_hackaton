"""
NexusOps — Beautiful Bauhaus-themed transactional emails.

Uses aiosmtplib for async SMTP delivery.
Configure via environment variables:
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL, SMTP_FROM_NAME
"""

import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone

import aiosmtplib

from app.config import settings

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════
# Shared Bauhaus HTML skeleton
# ═══════════════════════════════════════════════════════════════════

def _base_template(title: str, hero_color: str, hero_icon: str, body_html: str) -> str:
    """Wrap *body_html* inside a full Bauhaus-styled email document."""
    year = datetime.now(timezone.utc).year
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

<!-- Outer wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:40px 20px;">
<tr><td align="center">

<!-- Card -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:4px solid #1a1a2e;max-width:600px;width:100%;">

  <!-- Hero banner -->
  <tr>
    <td style="background-color:{hero_color};border-bottom:4px solid #1a1a2e;padding:40px 40px 30px;text-align:center;">
      <div style="width:64px;height:64px;margin:0 auto 16px;background-color:#ffffff;border:3px solid #1a1a2e;line-height:64px;font-size:32px;text-align:center;">
        {hero_icon}
      </div>
      <h1 style="margin:0;color:#1a1a2e;font-size:28px;font-weight:900;letter-spacing:3px;text-transform:uppercase;">{title}</h1>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:32px 40px 16px;">
      {body_html}
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:0 40px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="border-top:3px solid #1a1a2e;padding-top:20px;text-align:center;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:900;letter-spacing:4px;color:#1a1a2e;text-transform:uppercase;">
              NEXUS<span style="color:#3454d1;">OPS</span>
            </p>
            <p style="margin:0;font-size:11px;color:#666;letter-spacing:1px;">
              &copy; {year} NexusOps &bull; The Command Center for Engineering Teams
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>
<!-- /Card -->

<!-- Decorative Bauhaus shapes below card -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-top:16px;">
<tr>
  <td align="center">
    <span style="display:inline-block;width:40px;height:8px;background-color:#e63946;margin:0 4px;"></span>
    <span style="display:inline-block;width:40px;height:8px;background-color:#3454d1;margin:0 4px;"></span>
    <span style="display:inline-block;width:40px;height:8px;background-color:#ffd60a;margin:0 4px;"></span>
    <span style="display:inline-block;width:40px;height:8px;background-color:#1a1a2e;margin:0 4px;"></span>
  </td>
</tr>
</table>

</td></tr>
</table>

</body>
</html>"""


# ═══════════════════════════════════════════════════════════════════
# Individual email builders
# ═══════════════════════════════════════════════════════════════════

def _welcome_email(name: str) -> tuple[str, str]:
    """Return (subject, html) for the welcome email."""
    subject = "Welcome to NexusOps — Your Command Center Awaits"
    body = f"""\
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a2e;">
      Hey <strong>{name}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a2e;">
      Welcome aboard! Your NexusOps account is live and ready. You now have access to:
    </p>

    <!-- Feature grid -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td width="50%" style="padding:8px 8px 8px 0;vertical-align:top;">
          <div style="background-color:#ffd60a;border:3px solid #1a1a2e;padding:16px;text-align:center;">
            <p style="margin:0 0 4px;font-size:20px;">⚡</p>
            <p style="margin:0;font-size:12px;font-weight:800;color:#1a1a2e;letter-spacing:1px;text-transform:uppercase;">AutoFix Engine</p>
          </div>
        </td>
        <td width="50%" style="padding:8px 0 8px 8px;vertical-align:top;">
          <div style="background-color:#3454d1;border:3px solid #1a1a2e;padding:16px;text-align:center;">
            <p style="margin:0 0 4px;font-size:20px;">🧠</p>
            <p style="margin:0;font-size:12px;font-weight:800;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">Memory Context</p>
          </div>
        </td>
      </tr>
      <tr>
        <td width="50%" style="padding:8px 8px 8px 0;vertical-align:top;">
          <div style="background-color:#e63946;border:3px solid #1a1a2e;padding:16px;text-align:center;">
            <p style="margin:0 0 4px;font-size:20px;">🔗</p>
            <p style="margin:0;font-size:12px;font-weight:800;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">40+ Integrations</p>
          </div>
        </td>
        <td width="50%" style="padding:8px 0 8px 8px;vertical-align:top;">
          <div style="background-color:#1a1a2e;border:3px solid #1a1a2e;padding:16px;text-align:center;">
            <p style="margin:0 0 4px;font-size:20px;">📊</p>
            <p style="margin:0;font-size:12px;font-weight:800;color:#ffd60a;letter-spacing:1px;text-transform:uppercase;">Real-time Dashboard</p>
          </div>
        </td>
      </tr>
    </table>

    <!-- CTA button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td align="center">
        <a href="{settings.FRONTEND_URL}/dashboard" target="_blank"
           style="display:inline-block;background-color:#1a1a2e;color:#ffd60a;font-size:14px;font-weight:900;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:16px 48px;border:3px solid #1a1a2e;">
          LAUNCH DASHBOARD &rarr;
        </a>
      </td></tr>
    </table>

    <p style="margin:0;font-size:13px;line-height:1.6;color:#666;">
      If you didn't create this account, you can safely ignore this email.
    </p>"""
    return subject, _base_template("Welcome", "#ffd60a", "🚀", body)


def _login_alert_email(name: str, ip_address: str = "Unknown") -> tuple[str, str]:
    """Return (subject, html) for the login notification."""
    now = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
    subject = "NexusOps — New Login Detected"
    body = f"""\
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a2e;">
      Hey <strong>{name}</strong>,
    </p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#1a1a2e;">
      We detected a new sign-in to your NexusOps account. Here are the details:
    </p>

    <!-- Details card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:3px solid #1a1a2e;">
      <tr>
        <td style="background-color:#3454d1;padding:12px 20px;border-bottom:3px solid #1a1a2e;">
          <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:2px;color:#ffffff;text-transform:uppercase;">Login Details</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;font-size:13px;font-weight:700;color:#1a1a2e;width:100px;">Time</td>
              <td style="padding:6px 0;font-size:13px;color:#444;">{now}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;font-weight:700;color:#1a1a2e;">IP Address</td>
              <td style="padding:6px 0;font-size:13px;color:#444;font-family:monospace;">{ip_address}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;font-weight:700;color:#1a1a2e;">Status</td>
              <td style="padding:6px 0;font-size:13px;color:#2d936c;font-weight:700;">✓ Authenticated</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#1a1a2e;">
      If this was you, no action is needed. If you don't recognise this activity, please reset your password immediately.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td align="center">
        <a href="{settings.FRONTEND_URL}/login" target="_blank"
           style="display:inline-block;background-color:#e63946;color:#ffffff;font-size:14px;font-weight:900;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 40px;border:3px solid #1a1a2e;">
          SECURE MY ACCOUNT
        </a>
      </td></tr>
    </table>"""
    return subject, _base_template("Login Alert", "#3454d1", "🔐", body)


def _password_reset_email(name: str) -> tuple[str, str]:
    """Return (subject, html) for the password-reset confirmation."""
    subject = "NexusOps — Password Reset Requested"
    body = f"""\
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a2e;">
      Hey <strong>{name}</strong>,
    </p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#1a1a2e;">
      We received a request to reset the password for your NexusOps account.
      Firebase has sent you a separate email with the reset link.
    </p>

    <!-- Notice box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#fff3cd;border:3px solid #1a1a2e;padding:20px;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:800;color:#1a1a2e;">
            ⚠️ IMPORTANT
          </p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#1a1a2e;">
            Check your inbox (and spam folder) for the Firebase password reset email.
            The reset link expires in 1 hour. If you didn't request this, your account is safe — just ignore both emails.
          </p>
        </td>
      </tr>
    </table>

    <!-- Steps -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:12px 0;border-bottom:2px dashed #ddd;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:36px;vertical-align:top;">
                <div style="width:28px;height:28px;background-color:#e63946;border:2px solid #1a1a2e;color:#fff;font-size:14px;font-weight:900;text-align:center;line-height:28px;">1</div>
              </td>
              <td style="padding-left:12px;font-size:14px;color:#1a1a2e;line-height:1.5;">
                <strong>Open the Firebase reset email</strong> in your inbox
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:2px dashed #ddd;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:36px;vertical-align:top;">
                <div style="width:28px;height:28px;background-color:#3454d1;border:2px solid #1a1a2e;color:#fff;font-size:14px;font-weight:900;text-align:center;line-height:28px;">2</div>
              </td>
              <td style="padding-left:12px;font-size:14px;color:#1a1a2e;line-height:1.5;">
                <strong>Click the reset link</strong> and choose a new password
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:36px;vertical-align:top;">
                <div style="width:28px;height:28px;background-color:#ffd60a;border:2px solid #1a1a2e;color:#1a1a2e;font-size:14px;font-weight:900;text-align:center;line-height:28px;">3</div>
              </td>
              <td style="padding-left:12px;font-size:14px;color:#1a1a2e;line-height:1.5;">
                <strong>Log back in</strong> to NexusOps with your new password
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td align="center">
        <a href="{settings.FRONTEND_URL}/login" target="_blank"
           style="display:inline-block;background-color:#1a1a2e;color:#ffd60a;font-size:14px;font-weight:900;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 40px;border:3px solid #1a1a2e;">
          BACK TO LOGIN &rarr;
        </a>
      </td></tr>
    </table>"""
    return subject, _base_template("Password Reset", "#e63946", "🔑", body)


# ═══════════════════════════════════════════════════════════════════
# Send helper
# ═══════════════════════════════════════════════════════════════════

async def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send an HTML email via configured SMTP. Returns True on success."""
    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    smtp_user = settings.SMTP_USER
    smtp_password = settings.SMTP_PASSWORD
    from_email = settings.SMTP_FROM_EMAIL
    from_name = settings.SMTP_FROM_NAME

    if not settings.ENABLE_EMAILS:
        return False

    if not all([smtp_host, smtp_user, smtp_password]):
        logger.warning("SMTP is not configured — skipping email to %s", to_email)
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg["X-Mailer"] = "NexusOps/2.0"

    # Plain-text fallback
    plain_text = f"{subject}\n\nPlease view this email in an HTML-capable client.\n\n— NexusOps Team"
    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=smtp_host,
            port=smtp_port,
            username=smtp_user,
            password=smtp_password,
            use_tls=True,
        )
        logger.info("Email sent to %s — %s", to_email, subject)
        return True
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False


# ═══════════════════════════════════════════════════════════════════
# Public API
# ═══════════════════════════════════════════════════════════════════

async def send_welcome_email(to_email: str, name: str) -> bool:
    """Send a welcome email after account creation."""
    subject, html = _welcome_email(name)
    return await _send_email(to_email, subject, html)


async def send_login_alert_email(to_email: str, name: str, ip_address: str = "Unknown") -> bool:
    """Send a login-notification email."""
    subject, html = _login_alert_email(name, ip_address)
    return await _send_email(to_email, subject, html)


async def send_password_reset_email(to_email: str, name: str) -> bool:
    """Send a password-reset confirmation email."""
    subject, html = _password_reset_email(name)
    return await _send_email(to_email, subject, html)
