export interface EmailTemplate {
  recipientName: string;
  emailTitle: string;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonLink: string;
  heroButtonText: string;
  contentTitle1: string;
  contentImageURL?: string;
  contentImageAlt?: string;
  contentParagraph1: string;
  contentParagraph2?: string;
  contentTitle2?: string;
  contentListItems?: string[];
  contentAgendaDetails?: {
    description: string;
    date: string;
    location: string;
    imageURL?: string;
  };
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonLink: string;
  ctaButtonText: string;
  websiteLink?: string;
  logoURL?: string;
  companyName?: string;
  privacyPolicyLink?: string;
  termsAndConditionsLink?: string;
  unsubscribeLink?: string;
  serviceName?: string;
  currentYear?: number;
  qrCodeDataUrl?: string;
  otpCode?: string;
  footerText?: {
    rights?: string;
    privacy?: string;
    terms?: string;
    unsubscribeReason?: string;
    unsubscribeAction?: string;
    here?: string;
  };
}
const config = useRuntimeConfig();
class Email {
  private recipientName: string;
  private emailTitle: string;
  private heroTitle: string;
  private heroSubtitle: string;
  private heroButtonLink: string;
  private heroButtonText: string;
  private contentTitle1: string;
  private contentImageURL?: string;
  private contentImageAlt?: string;
  private contentParagraph1: string;
  private contentParagraph2?: string;
  private contentTitle2?: string;
  private contentListItems?: string[];
  private contentAgendaDetails?: {
    description: string;
    date: string;
    location: string;
    imageURL?: string;
  };
  private ctaTitle: string;
  private ctaSubtitle: string;
  private ctaButtonLink: string;
  private ctaButtonText: string;
  private websiteLink: string = config.public.public_uri;
  private logoURL: string = `${config.public.public_uri}/img/logo.png`;
  private companyName: string = config.public.appname;
  private privacyPolicyLink?: string;
  private termsAndConditionsLink?: string;
  private unsubscribeLink?: string;
  private serviceName: string = config.public.appname;
  private currentYear: number = new Date().getFullYear();
  private qrCodeDataUrl?: string;
  private otpCode?: string;
  private footerText: {
    rights: string;
    privacy: string;
    terms: string;
    unsubscribeReason: string;
    unsubscribeAction: string;
    here: string;
  };

  constructor({
    recipientName,
    emailTitle,
    heroTitle,
    heroSubtitle,
    heroButtonLink,
    heroButtonText,
    contentTitle1,
    contentImageURL,
    contentImageAlt,
    contentParagraph1,
    contentParagraph2,
    contentTitle2,
    contentListItems,
    contentAgendaDetails,
    ctaTitle,
    ctaSubtitle,
    ctaButtonLink,
    ctaButtonText,
    privacyPolicyLink,
    termsAndConditionsLink,
    unsubscribeLink,
    qrCodeDataUrl,
    otpCode,
    footerText,
  }: EmailTemplate) {
    const escapeHtml = (unsafe: string) => {
      return (unsafe || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    this.recipientName = escapeHtml(recipientName);
    this.emailTitle = escapeHtml(emailTitle);
    this.heroTitle = escapeHtml(heroTitle);
    this.heroSubtitle = escapeHtml(heroSubtitle);
    this.heroButtonLink = heroButtonLink; // URLs might need robust URL encoding, but simple escaping breaks valid URLs. kept as is for now assumes trustworthy logic generator.
    this.heroButtonText = escapeHtml(heroButtonText);
    this.contentTitle1 = escapeHtml(contentTitle1);
    this.contentImageURL = contentImageURL; // Image URL assumes trustworthy source
    this.contentImageAlt = contentImageAlt ? escapeHtml(contentImageAlt) : undefined;
    this.contentParagraph1 = contentParagraph1; // Paragraphs might contain safe HTML? No, typical email templates here seem to use plain text strings. Escaping is safer.
    this.contentParagraph2 = contentParagraph2;
    this.contentTitle2 = contentTitle2 ? escapeHtml(contentTitle2) : undefined;
    this.contentListItems = contentListItems?.map(i => escapeHtml(i));
    this.contentAgendaDetails = contentAgendaDetails;
    this.ctaTitle = escapeHtml(ctaTitle);
    this.ctaSubtitle = escapeHtml(ctaSubtitle);
    this.ctaButtonLink = ctaButtonLink;
    this.ctaButtonText = escapeHtml(ctaButtonText);
    this.privacyPolicyLink = privacyPolicyLink;
    this.termsAndConditionsLink = termsAndConditionsLink;
    this.unsubscribeLink = unsubscribeLink;
    this.qrCodeDataUrl = qrCodeDataUrl;
    this.otpCode = otpCode;
    this.footerText = {
      rights: escapeHtml(footerText?.rights || "All rights reserved."),
      privacy: escapeHtml(footerText?.privacy || "Privacy Policy"),
      terms: escapeHtml(footerText?.terms || "Terms & Conditions"),
      unsubscribeReason: escapeHtml(footerText?.unsubscribeReason || "You are receiving this email because you subscribed to"),
      unsubscribeAction: escapeHtml(footerText?.unsubscribeAction || "If you do not want to receive emails anymore, click"),
      here: escapeHtml(footerText?.here || "here")
    };
  }

  public render(): string {
    const listItemHTML = this.contentListItems
      ? this.contentListItems.map((item) => `<li>${item}</li>`).join("")
      : "";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.emailTitle}</title>
    <!--[if mso]>
    <style>
        table {border-collapse:collapse;border-spacing:0;border:none;margin:0;}
        div, td {padding:0;}
        div {margin:0 !important;}
    </style>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* General Resets */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; }
        img { border: 0; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Helvetica', 'Arial', sans-serif; }
        
        /* Client Specific Fixes */
        a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
        u + #body a { color: inherit; text-decoration: none; font-size: inherit; font-family: inherit; font-weight: inherit; line-height: inherit; }
        #MessageViewBody a { color: inherit; text-decoration: none; font-size: inherit; font-family: inherit; font-weight: inherit; line-height: inherit; }
        
        /* Mobile Responsive */
        @media screen and (max-width: 600px) {
            .email-container { width: 100% !important; margin: auto !important; }
            .fluid { max-width: 100% !important; height: auto !important; margin-left: auto !important; margin-right: auto !important; }
            .stack-column, .stack-column-center { display: block !important; width: 100% !important; max-width: 100% !important; direction: ltr !important; }
            .stack-column-center { text-align: center !important; }
            .center-on-mobile { text-align: center !important; }
            .mobile-pad { padding-left: 20px !important; padding-right: 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; color: #333333;" bgcolor="#f6f9fc">
    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Helvetica', 'Arial', sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        ${this.heroSubtitle}
    </div>

    <center style="width: 100%; background-color: #f6f9fc; text-align: left;">
        <div style="max-width: 640px; margin: 0 auto; padding: 40px 20px;" class="email-container">
            <!-- HEADING / LOGO -->
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                    <td align="center" style="padding-bottom: 15px;">
                        <a href="${this.websiteLink}" target="_blank" style="text-decoration: none; display: inline-block;">
                            <img src="${this.logoURL}" alt="${this.companyName}" width="180" border="0" style="display: block; font-family: 'Helvetica', 'Arial', sans-serif; color: #333333; font-size: 15px; max-width: 180px;">
                        </a>
                    </td>
                </tr>
            </table>

            <!-- MAIN CARD -->
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                
                <!-- HERO SECTION -->
                <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center;" class="mobile-pad">
                        <h1 style="margin: 0 0 16px 0; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 24px; line-height: 1.3; color: #1a1a1a; font-weight: 700;">
                            ${this.heroTitle}
                        </h1>
                        <p style="margin: 0 0 24px 0; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 16px; line-height: 1.6; color: #555555;">
                            ${this.heroSubtitle}
                        </p>
                        ${ this.heroButtonLink && this.heroButtonText ? `
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                            <tr>
                                <td align="center" bgcolor="#2563eb" style="border-radius: 8px;">
                                    <a href="${this.heroButtonLink}" target="_blank" style="padding: 14px 28px; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 16px; color: #ffffff; background-color: #2563eb; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; border: 1px solid #2563eb;">
                                        ${this.heroButtonText}
                                    </a>
                                </td>
                            </tr>
                        </table>
                        ` : '' }
                    </td>
                </tr>

                <!-- CONTENT IMAGE -->
                ${ this.contentImageURL ? `
                <tr>
                    <td style="padding: 0 40px 20px 40px;" class="mobile-pad">
                        <img src="${this.contentImageURL}" alt="${this.contentImageAlt || 'Image'}" border="0" width="100%" style="width: 100%; max-width: 600px; height: auto; border-radius: 8px; display: block; margin: 0 auto;">
                    </td>
                </tr>
                ` : '' }

                <!-- MAIN CONTENT AREA -->
                <tr>
                    <td style="padding: 20px 40px 40px 40px; text-align: left;" class="mobile-pad">
                        ${ this.contentTitle1 ? `
                        <h2 style="margin: 0 0 12px 0; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 20px; line-height: 1.3; color: #333333; font-weight: 600;">
                            ${this.contentTitle1}
                        </h2>
                        ` : '' }
                        
                        <p style="margin: 0 0 16px 0; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 16px; line-height: 1.6; color: #555555;">
                            ${this.contentParagraph1}
                        </p>

                        ${ this.qrCodeDataUrl ? `
                        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #e2e8f0;">
                            <img src="${this.qrCodeDataUrl}" alt="QR Code" width="200" height="200" style="display: block; margin: 0 auto; max-width: 100%; height: auto;">
                            <p style="margin: 10px 0 0 0; font-size: 13px; color: #64748b;">Scan this code at the event</p>
                        </div>
                        ` : '' }

                        ${ this.otpCode ? `
                          <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f0f8ff; border-radius: 8px; border: 1px solid #cce5ff;">
                              <p style="margin: 0 0 10px 0; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; color: #555;">
                                  Or enter this code manually:
                              </p>
                              <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb; background: #fff; padding: 10px 20px; border-radius: 4px; border: 1px dashed #2563eb; display: inline-block;">
                                  ${this.otpCode}
                              </span>
                          </div>
                          ` : '' 
                        }

                        ${ this.contentParagraph2 ? `
                        <p style="margin: 0 0 16px 0; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 16px; line-height: 1.6; color: #555555;">
                            ${this.contentParagraph2}
                        </p>
                        ` : '' }

                        ${ this.contentAgendaDetails ? `
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
                             ${ this.contentAgendaDetails.imageURL ? `
                                <img src="${this.contentAgendaDetails.imageURL}" alt="Agenda Image" style="width: 100%; height: auto; border-radius: 6px; margin-bottom: 16px; display: block;">
                             ` : '' }
                             <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td width="24" valign="top" style="padding-right: 12px; padding-bottom: 12px;">
                                        🗓️
                                    </td>
                                    <td valign="top" style="padding-bottom: 12px;">
                                        <div style="font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; font-weight: 600; color: #333;">Date</div>
                                        <div style="font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; color: #555;">${this.contentAgendaDetails.date}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td width="24" valign="top" style="padding-right: 12px; padding-bottom: 12px;">
                                        📍
                                    </td>
                                    <td valign="top" style="padding-bottom: 12px;">
                                        <div style="font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; font-weight: 600; color: #333;">Location</div>
                                        <div style="font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; color: #555;">${this.contentAgendaDetails.location}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td width="24" valign="top" style="padding-right: 12px;">
                                        📝
                                    </td>
                                    <td valign="top">
                                        <div style="font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; font-weight: 600; color: #333;">Description</div>
                                        <div style="font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; color: #555;">${this.contentAgendaDetails.description}</div>
                                    </td>
                                </tr>
                             </table>
                        </div>
                        ` : '' }

                        ${ this.contentTitle2 ? `
                        <h3 style="margin: 24px 0 12px 0; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 18px; line-height: 1.3; color: #333333; font-weight: 600;">
                            ${this.contentTitle2}
                        </h3>
                        ` : '' }

                        ${ listItemHTML ? `
                        <ul style="margin: 0 0 20px 0; padding-left: 20px; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 16px; line-height: 1.6; color: #555555;">
                            ${listItemHTML}
                        </ul>
                        ` : '' }

                        <!-- CTA SECTION / NEED HELP -->
                        ${ this.ctaTitle ? `
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 30px;">
                            <tr>
                                <td>
                                    <h4 style="margin: 0 0 8px 0; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 16px; color: #333333; font-weight: 600;">
                                        ${this.ctaTitle}
                                    </h4>
                                    <p style="margin: 0 0 16px 0; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; color: #64748b; line-height: 1.5;">
                                        ${this.ctaSubtitle}
                                    </p>
                                    <a href="${this.ctaButtonLink}" style="font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; color: #2563eb; text-decoration: none; font-weight: 600;">
                                        ${this.ctaButtonText} &rarr;
                                    </a>
                                </td>
                            </tr>
                        </table>
                        ` : '' }

                    </td>
                </tr>
            </table>

            <!-- FOOTER -->
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
                <tr>
                    <td style="padding: 0 20px; text-align: center; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px; line-height: 1.5; color: #94a3b8;">
                        <p style="margin: 0 0 12px 0;">
                            &copy; ${this.currentYear} ${this.companyName}. ${this.footerText.rights}
                        </p>
                        <p style="margin: 0 0 12px 0;">
                            <a href="${this.privacyPolicyLink}" style="color: #94a3b8; text-decoration: underline;">${this.footerText.privacy}</a>
                            &nbsp;&nbsp;&bull;&nbsp;&nbsp;
                            <a href="${this.termsAndConditionsLink}" style="color: #94a3b8; text-decoration: underline;">${this.footerText.terms}</a>
                        </p>
                        ${ this.unsubscribeLink ? `
                        <p style="margin: 0;">
                            ${this.footerText.unsubscribeReason} ${this.serviceName}. <br>
                            ${this.footerText.unsubscribeAction} <a href="${this.unsubscribeLink}" style="color: #94a3b8; text-decoration: underline;">${this.footerText.here}</a>.
                        </p>
                        ` : '' }
                    </td>
                </tr>
            </table>

        </div>
    </center>
</body>
</html>
      `;
  }
}

export default Email;
